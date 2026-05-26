'use strict';

/**
 * WASTE RISK SCORING ENGINE
 *
 * How it works:
 * 1. Get the latest stock level for a product
 * 2. Get the average daily sales over the last 7 days
 * 3. Calculate how many days of stock remain at current sales rate
 * 4. Compare that to how many days until expiry
 * 5. If stock outlasts expiry → waste risk
 *
 * Score tiers:
 *   0.00 – 0.40 → safe     (stock will sell before expiry)
 *   0.40 – 0.65 → watch    (getting close)
 *   0.65 – 0.85 → high     (likely to have surplus)
 *   0.85 – 1.00 → critical (will definitely expire)
 */

/**
 * Compute risk score for a single product
 * @param {number} currentStock  - latest logged quantity
 * @param {number} avgDailySales - average units sold per day (last 7 days)
 * @param {number} daysToExpiry  - days until this batch expires
 * @returns {{ score: number, tier: string, daysOfStock: number }}
 */
const computeRiskScore = (currentStock, avgDailySales, daysToExpiry) => {
  // Already expired
  if (daysToExpiry <= 0) {
    return { score: 1.0, tier: 'critical', daysOfStock: 0 };
  }

  // No stock → no risk
  if (currentStock <= 0) {
    return { score: 0.0, tier: 'safe', daysOfStock: 0 };
  }

  // Days of stock at current consumption rate
  // If no sales data yet, assume worst case (stock won't sell)
  const daysOfStock = avgDailySales > 0
    ? currentStock / avgDailySales
    : 999;

  // Core ratio: how many sell-through cycles fit before expiry?
  // ratio < 1 → stock sells before expiry → safe
  // ratio > 1 → stock outlasts expiry → risk
  const ratio = daysOfStock / daysToExpiry;

  // Map ratio to a 0–1 score
  let score;
  if (ratio <= 0.3)       score = 0.05;
  else if (ratio <= 0.7)  score = 0.05 + (ratio - 0.3) * 0.875; // 0.05 → 0.40
  else if (ratio <= 1.0)  score = 0.40 + (ratio - 0.7) * 0.833; // 0.40 → 0.65
  else if (ratio <= 1.5)  score = 0.65 + (ratio - 1.0) * 0.40;  // 0.65 → 0.85
  else                    score = Math.min(0.98, 0.85 + (ratio - 1.5) * 0.13);

  const tier =
    score < 0.40 ? 'safe' :
    score < 0.65 ? 'watch' :
    score < 0.85 ? 'high' :
    'critical';

  return {
    score: parseFloat(score.toFixed(3)),
    tier,
    daysOfStock: parseFloat(daysOfStock.toFixed(1))
  };
};

/**
 * Compute risk scores for all products in an organisation
 * Called directly by the analytics route — no ETL needed
 *
 * @param {string} organisationId
 * @param {object} db - destructured models
 * @returns {Array} scored products ready for the dashboard
 */
const scoreAllProducts = async (organisationId, db) => {
  const { Product, InventoryEvent, SalesRecord, sequelize } = db;
  const { Op } = require('sequelize');

  // Get all active products for this org
  const products = await Product.findAll({
    where: { organisationId, isActive: true },
    order: [['name', 'ASC']]
  });

  if (!products.length) return [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const results = [];

  for (const product of products) {
    // Latest inventory event for this product
    const latestInventory = await InventoryEvent.findOne({
      where: { productId: product.id, organisationId },
      order: [['recordedAt', 'DESC']]
    });

    if (!latestInventory) continue; // no stock logged yet

    // Average daily sales over last 7 days
    const salesData = await SalesRecord.findOne({
      where: {
        productId: product.id,
        organisationId,
        saleDate: { [Op.gte]: sevenDaysAgo.toISOString().split('T')[0] }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('units_sold')), 'totalSold'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('sale_date'))), 'daysWithSales']
      ],
      raw: true
    });

    const totalSold = parseFloat(salesData?.totalSold || 0);
    const daysWithSales = parseInt(salesData?.daysWithSales || 1);
    const avgDailySales = totalSold / 7; // divide by 7 days, not just days with sales

    // Days to expiry
    let daysToExpiry;
    if (latestInventory.expiryDate) {
      const msPerDay = 24 * 60 * 60 * 1000;
      daysToExpiry = Math.ceil(
        (new Date(latestInventory.expiryDate) - new Date()) / msPerDay
      );
    } else {
      daysToExpiry = product.expiryDays;
    }

    const { score, tier, daysOfStock } = computeRiskScore(
      parseFloat(latestInventory.quantity),
      avgDailySales,
      daysToExpiry
    );

    results.push({
      productId: product.id,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      currentStock: parseFloat(latestInventory.quantity),
      avgDailySales: parseFloat(avgDailySales.toFixed(2)),
      daysOfStock,
      daysToExpiry,
      score,
      tier,
      expiryDate: latestInventory.expiryDate,
      lastUpdated: latestInventory.recordedAt
    });
  }

  // Sort by score descending — highest risk first
  return results.sort((a, b) => b.score - a.score);
};

module.exports = { computeRiskScore, scoreAllProducts };