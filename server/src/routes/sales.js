'use strict';

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { SalesRecord, Product } = require('../models');
const { authenticate, requireStaff, requireManager } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validate');

// GET /api/sales
router.get('/', authenticate, requireManager, asyncHandler(async (req, res) => {
  const { productId, from, to } = req.query;
  const where = { organisationId: req.user.organisationId };
  if (productId) where.productId = productId;
  if (from || to) {
    where.saleDate = {};
    if (from) where.saleDate[Op.gte] = from;
    if (to)   where.saleDate[Op.lte] = to;
  }

  const records = await SalesRecord.findAll({
    where,
    include: [{ model: Product, attributes: ['id', 'name', 'category'] }],
    order: [['saleDate', 'DESC']],
    limit: 200
  });

  res.json(records);
}));

// POST /api/sales — log daily sales for a product
router.post('/', authenticate, requireStaff, asyncHandler(async (req, res) => {
  const error = validate(req.body, ['productId', 'unitsSold', 'saleDate']);
  if (error) throw new AppError(error, 400);

  const product = await Product.findOne({
    where: { id: req.body.productId, organisationId: req.user.organisationId }
  });
  if (!product) throw new AppError('Product not found', 404);

  const saleDate = new Date(req.body.saleDate);
  const dayOfWeek = saleDate.getDay();

  // Upsert — update if already logged for this product + date
  const [record, created] = await SalesRecord.findOrCreate({
    where: {
      productId:      req.body.productId,
      organisationId: req.user.organisationId,
      saleDate:       req.body.saleDate
    },
    defaults: { unitsSold: req.body.unitsSold, dayOfWeek, hourOfDay: 12 }
  });

  if (!created) await record.update({ unitsSold: req.body.unitsSold });

  res.status(created ? 201 : 200).json(record);
}));

// POST /api/sales/bulk
router.post('/bulk', authenticate, requireStaff, asyncHandler(async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || !records.length) {
    throw new AppError('records must be a non-empty array', 400);
  }

  const productIds = [...new Set(records.map(r => r.productId))];
  const products = await Product.findAll({
    where: { id: productIds, organisationId: req.user.organisationId }
  });
  if (products.length !== productIds.length) {
    throw new AppError('One or more products not found', 404);
  }

  const toCreate = records.map(r => ({
    productId:      r.productId,
    organisationId: req.user.organisationId,
    unitsSold:      r.unitsSold,
    saleDate:       r.saleDate,
    dayOfWeek:      new Date(r.saleDate).getDay(),
    hourOfDay:      12
  }));

  await SalesRecord.bulkCreate(toCreate, {
    updateOnDuplicate: ['unitsSold', 'updatedAt']
  });

  res.status(201).json({ created: toCreate.length });
}));

module.exports = router;