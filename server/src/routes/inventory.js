'use strict';

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { InventoryEvent, Product } = require('../models');
const { authenticate, requireStaff } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validate');

// GET /api/inventory/current — latest stock level per product
router.get('/current', authenticate, requireStaff, asyncHandler(async (req, res) => {
  // Get the most recent event per product using a subquery
  const latest = await InventoryEvent.findAll({
    where: { organisationId: req.user.organisationId },
    attributes: [
      'productId',
      [InventoryEvent.sequelize.fn('MAX', InventoryEvent.sequelize.col('recorded_at')), 'latestAt']
    ],
    group: ['product_id'],
    raw: true
  });

  if (!latest.length) return res.json([]);

  // Fetch full events for those timestamps
  const current = await Promise.all(
    latest.map(({ productId, latestAt }) =>
      InventoryEvent.findOne({
        where: {
          productId,
          organisationId: req.user.organisationId,
          recordedAt: latestAt
        },
        include: [{
          model: Product,
          attributes: ['id', 'name', 'category', 'unit', 'expiryDays']
        }]
      })
    )
  );

  res.json(current.filter(Boolean));
}));

// GET /api/inventory — full history with optional filters
router.get('/', authenticate, requireStaff, asyncHandler(async (req, res) => {
  const { productId, from, to } = req.query;
  const where = { organisationId: req.user.organisationId };
  if (productId) where.productId = productId;
  if (from || to) {
    where.recordedAt = {};
    if (from) where.recordedAt[Op.gte] = new Date(from);
    if (to)   where.recordedAt[Op.lte] = new Date(to);
  }

  const events = await InventoryEvent.findAll({
    where,
    include: [{ model: Product, attributes: ['id', 'name', 'category', 'unit'] }],
    order: [['recordedAt', 'DESC']],
    limit: 200
  });

  res.json(events);
}));

// POST /api/inventory — log a stock event
router.post('/', authenticate, requireStaff, asyncHandler(async (req, res) => {
  const error = validate(req.body, ['productId', 'quantity']);
  if (error) throw new AppError(error, 400);

  // Make sure the product belongs to this org
  const product = await Product.findOne({
    where: { id: req.body.productId, organisationId: req.user.organisationId }
  });
  if (!product) throw new AppError('Product not found', 404);

  const event = await InventoryEvent.create({
    productId:      req.body.productId,
    organisationId: req.user.organisationId,
    loggedBy:       req.user.id,
    quantity:       req.body.quantity,
    expiryDate:     req.body.expiryDate || null,
    notes:          req.body.notes || null,
    eventType:      req.body.eventType || 'stock_check',
    recordedAt:     new Date()
  });

  // Tell the manager dashboard to refresh via WebSocket
  const io = req.app.get('io');
  io.of('/manager')
    .to(`org:${req.user.organisationId}`)
    .emit('inventory:updated', {
      productId: event.productId,
      quantity:  event.quantity
    });

  res.status(201).json(event);
}));

// POST /api/inventory/bulk — log multiple products at once
router.post('/bulk', authenticate, requireStaff, asyncHandler(async (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events) || !events.length) {
    throw new AppError('events must be a non-empty array', 400);
  }

  // Verify all products belong to this org before writing anything
  const productIds = [...new Set(events.map(e => e.productId))];
  const products = await Product.findAll({
    where: { id: productIds, organisationId: req.user.organisationId }
  });
  if (products.length !== productIds.length) {
    throw new AppError('One or more products not found', 404);
  }

  const records = events.map(e => ({
    productId:      e.productId,
    organisationId: req.user.organisationId,
    loggedBy:       req.user.id,
    quantity:       e.quantity,
    expiryDate:     e.expiryDate || null,
    notes:          e.notes || null,
    eventType:      e.eventType || 'stock_check',
    recordedAt:     new Date()
  }));

  const created = await InventoryEvent.bulkCreate(records);

  const io = req.app.get('io');
  io.of('/manager')
    .to(`org:${req.user.organisationId}`)
    .emit('inventory:bulk_updated', { count: created.length });

  res.status(201).json({ created: created.length });
}));

module.exports = router;