'use strict';

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate, requireManager } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { scoreAllProducts } = require('../services/riskEngine');
const { Op } = require('sequelize');

// GET /api/reports/weekly — AI-generated waste report via Claude API
router.get('/weekly', authenticate, requireManager, asyncHandler(async (req, res) => {
  const db = require('../models');
  const { WasteSummary, DonationListing, Product, sequelize } = db;

  const org = req.user.organisation;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Gather data to send to Claude
  const [riskScores, recentWaste, recentDonations] = await Promise.all([
    scoreAllProducts(req.user.organisationId, db),
    db.InventoryEvent.findAll({
      where: {
        organisationId: req.user.organisationId,
        eventType: 'waste_logged',
        recordedAt: { [Op.gte]: sevenDaysAgo }
      },
      include: [{ model: Product, attributes: ['name', 'category'] }],
      raw: true, nest: true
    }),
    DonationListing.count({
      where: {
        donorOrgId: req.user.organisationId,
        status: 'completed',
        completedAt: { [Op.gte]: sevenDaysAgo }
      }
    })
  ]);

  const highRisk = riskScores.filter(r => r.tier === 'high' || r.tier === 'critical');

  const context = {
    organisation: { name: org.name, type: org.type },
    thisWeek: {
      wasteEvents: recentWaste.length,
      donationsCompleted: recentDonations,
      highRiskProducts: highRisk.map(r => ({
        name:         r.productName,
        category:     r.category,
        tier:         r.tier,
        daysToExpiry: r.daysToExpiry,
        currentStock: r.currentStock
      }))
    }
  };

  const prompt = `You are a food waste reduction assistant for FoodLoop City.
Write a short weekly waste report for ${org.name} (a ${org.type}).

Data from this week:
${JSON.stringify(context, null, 2)}

Write 2-3 short paragraphs covering:
1. This week's waste situation
2. The top at-risk products right now and what to do
3. One practical recommendation for next week

Be specific with product names and numbers. Keep it under 200 words. Friendly but professional tone.`;

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key':          process.env.CLAUDE_API_KEY,
          'anthropic-version':  '2023-06-01',
          'content-type':       'application/json'
        },
        timeout: 15000
      }
    );

    res.json({
      report:      response.data.content[0]?.text || 'Report unavailable',
      generatedAt: new Date().toISOString(),
      context
    });
  } catch (err) {
    // Fallback if Claude API is not configured
    const fallback = highRisk.length > 0
      ? `This week ${org.name} has ${highRisk.length} product(s) at high or critical waste risk. ` +
        `Most urgent: ${highRisk[0].productName} (${highRisk[0].daysToExpiry} days to expiry, ${highRisk[0].currentStock} units in stock). ` +
        `Consider donating or discounting immediately.`
      : `Good news — no high-risk products this week for ${org.name}. Keep monitoring stock levels daily.`;

    res.json({
      report:      fallback,
      generatedAt: new Date().toISOString(),
      context,
      fallback:    true
    });
  }
}));

// GET /api/organisations/:id — used by both manager and admin
router.get('/organisations/:id', authenticate, asyncHandler(async (req, res) => {
  const { Organisation, User } = require('../models');
  const { id } = req.params;

  if (req.user.role !== 'admin' && req.user.organisationId !== id) {
    throw new AppError('Access denied', 403);
  }

  const org = await Organisation.findByPk(id, {
    include: [{ model: User, as: 'users',
      attributes: ['id', 'firstName', 'lastName', 'role', 'email'] }]
  });

  if (!org) throw new AppError('Organisation not found', 404);
  res.json(org);
}));

module.exports = router;