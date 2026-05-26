'use strict';

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { scoreAllProducts } = require('../services/riskEngine');
const {
  InventoryEvent, SalesRecord, DonationListing,
  Product, Organisation, sequelize
} = require('../models');
const { authenticate, requireManager, requireCharity, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/analytics/risk
// Computes risk scores on the fly — no pre-computed table needed
router.get('/risk', authenticate, requireManager, asyncHandler(async (req, res) => {
  const db = require('../models');
  const scores = await scoreAllProducts(req.user.organisationId, db);
  res.json(scores);
}));

// GET /api/analytics/waste-summary
// Waste logged events grouped by category over the last 30 days
router.get('/waste-summary', authenticate, requireManager, asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const wasteEvents = await InventoryEvent.findAll({
    where: {
      organisationId: req.user.organisationId,
      eventType: 'waste_logged',
      recordedAt: { [Op.gte]: thirtyDaysAgo }
    },
    attributes: [
      [sequelize.col('Product.category'), 'category'],
      [sequelize.fn('SUM', sequelize.col('InventoryEvent.quantity')), 'totalWasted'],
      [sequelize.fn('COUNT', sequelize.col('InventoryEvent.id')), 'eventCount']
    ],
    include: [{ model: Product, attributes: [] }],
    group: ['Product.category'],
    raw: true
  });

  // Also get donation totals per category for context
  const donationTotals = await DonationListing.findAll({
    where: {
      donorOrgId: req.user.organisationId,
      status: 'completed',
      completedAt: { [Op.gte]: thirtyDaysAgo }
    },
    attributes: [
      [sequelize.col('product.category'), 'category'],
      [sequelize.fn('SUM', sequelize.col('DonationListing.quantity')), 'totalDonated']
    ],
    include: [{ model: Product, as: 'product', attributes: [] }],
    group: ['product.category'],
    raw: true
  });

  const donationMap = {};
  donationTotals.forEach(d => { donationMap[d.category] = parseFloat(d.totalDonated || 0); });

  const summary = wasteEvents.map(w => ({
    category:    w.category,
    totalWasted: parseFloat(w.totalWasted || 0),
    totalDonated: donationMap[w.category] || 0,
    eventCount:  parseInt(w.eventCount)
  }));

  res.json(summary);
}));

// GET /api/analytics/sales-trend
// Daily sales totals for the last 14 days — powers the trend chart
router.get('/sales-trend', authenticate, requireManager, asyncHandler(async (req, res) => {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const trend = await SalesRecord.findAll({
    where: {
      organisationId: req.user.organisationId,
      saleDate: { [Op.gte]: fourteenDaysAgo.toISOString().split('T')[0] }
    },
    attributes: [
      'saleDate',
      [sequelize.fn('SUM', sequelize.col('units_sold')), 'totalSold']
    ],
    group: ['sale_date'],
    order: [['saleDate', 'ASC']],
    raw: true
  });

  res.json(trend);
}));

// GET /api/analytics/donations-summary
// Overview of this org's donation activity
router.get('/donations-summary', authenticate, requireManager, asyncHandler(async (req, res) => {
  const [total, completed, available] = await Promise.all([
    DonationListing.count({ where: { donorOrgId: req.user.organisationId } }),
    DonationListing.count({ where: { donorOrgId: req.user.organisationId, status: 'completed' } }),
    DonationListing.count({ where: { donorOrgId: req.user.organisationId, status: 'available' } })
  ]);

  const co2Saved = await DonationListing.sum('co2SavedKg', {
    where: { donorOrgId: req.user.organisationId, status: 'completed' }
  });

  res.json({
    total,
    completed,
    available,
    completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
    co2SavedKg: parseFloat(co2Saved || 0).toFixed(2)
  });
}));

// GET /api/analytics/charity/impact
// Charity coordinator's impact dashboard
router.get('/charity/impact', authenticate, requireCharity, asyncHandler(async (req, res) => {
  const { PickupOutcome } = require('../models');

  const outcomes = await PickupOutcome.findAll({
    where: { charityOrgId: req.user.organisationId }
  });

  const total      = outcomes.length;
  const successful = outcomes.filter(o =>
    o.outcome === 'collected' || o.outcome === 'partial'
  ).length;

  const totalKg = outcomes.reduce((sum, o) =>
    sum + parseFloat(o.quantityCollected || 0), 0
  );

  const totalMeals = outcomes.reduce((sum, o) =>
    sum + parseInt(o.mealsEquivalent || 0), 0
  );

  res.json({
    totalPickups:       total,
    successfulPickups:  successful,
    reliabilityScore:   total > 0 ? parseFloat((successful / total).toFixed(3)) : 1.0,
    totalKgCollected:   parseFloat(totalKg.toFixed(2)),
    totalMealsEquivalent: totalMeals
  });
}));

// GET /api/analytics/admin/stats — platform-wide stats for admin
router.get('/admin/stats', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { PickupOutcome } = require('../models');

  const [totalOrgs, activeOrgs, totalDonations, completedDonations, totalMeals] =
    await Promise.all([
      Organisation.count(),
      Organisation.count({ where: { isActive: true } }),
      DonationListing.count(),
      DonationListing.count({ where: { status: 'completed' } }),
      PickupOutcome.sum('mealsEquivalent')
    ]);

  res.json({
    totalOrgs,
    activeOrgs,
    totalDonations,
    completedDonations,
    completionRate: totalDonations
      ? ((completedDonations / totalDonations) * 100).toFixed(1)
      : 0,
    totalMeals: totalMeals || 0
  });
}));

module.exports = router;