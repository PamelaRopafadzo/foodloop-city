'use strict';

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Product } = require('../models');
const { authenticate, requireManager, requireStaff } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validate');

// GET /api/products
router.get('/', authenticate, requireStaff, asyncHandler(async (req, res) => {
  const { category } = req.query;
  const where = { organisationId: req.user.organisationId, isActive: true };
  if (category) where.category = category;

  const products = await Product.findAll({ where, order: [['name', 'ASC']] });
  res.json(products);
}));

// GET /api/products/:id
router.get('/:id', authenticate, requireStaff, asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    where: { id: req.params.id, organisationId: req.user.organisationId }
  });
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
}));

// POST /api/products
router.post('/', authenticate, requireManager, asyncHandler(async (req, res) => {
  const error = validate(req.body, ['name', 'category', 'expiryDays']);
  if (error) throw new AppError(error, 400);

  const product = await Product.create({
    ...req.body,
    organisationId: req.user.organisationId
  });
  res.status(201).json(product);
}));

// PUT /api/products/:id
router.put('/:id', authenticate, requireManager, asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    where: { id: req.params.id, organisationId: req.user.organisationId }
  });
  if (!product) throw new AppError('Product not found', 404);

  const allowed = ['name', 'category', 'expiryDays', 'unit', 'sku', 'isActive'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  await product.update(updates);
  res.json(product);
}));

// DELETE /api/products/:id — soft delete
router.delete('/:id', authenticate, requireManager, asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    where: { id: req.params.id, organisationId: req.user.organisationId }
  });
  if (!product) throw new AppError('Product not found', 404);
  await product.update({ isActive: false });
  res.json({ message: 'Product deactivated' });
}));

// GET /api/products/lookup/openfoodfacts?query=croissant
// Autofills product details so staff don't type everything manually
router.get('/lookup/openfoodfacts', authenticate, requireStaff, asyncHandler(async (req, res) => {
  const { query, barcode } = req.query;
  if (!query && !barcode) throw new AppError('Provide query or barcode', 400);

  let url;
  if (barcode) {
    url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
  } else {
    url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`;
  }

  const response = await axios.get(url, { timeout: 5000 });

  if (barcode) {
    const prod = response.data.product;
    if (!prod) throw new AppError('Product not found', 404);
    return res.json([{
      name: prod.product_name || '',
      offBarcode: barcode,
      category: mapCategory(prod.categories_tags),
      expiryDays: defaultExpiry(prod.categories_tags)
    }]);
  }

  const products = (response.data.products || []).slice(0, 5).map(p => ({
    name: p.product_name || '',
    offBarcode: p.code,
    category: mapCategory(p.categories_tags),
    expiryDays: defaultExpiry(p.categories_tags)
  }));

  res.json(products);
}));

function mapCategory(tags = []) {
  const t = tags.join(' ').toLowerCase();
  if (t.includes('bread') || t.includes('pastry') || t.includes('bakery')) return 'bakery';
  if (t.includes('dairy') || t.includes('milk') || t.includes('cheese')) return 'dairy';
  if (t.includes('meat')) return 'meat';
  if (t.includes('fish') || t.includes('seafood')) return 'seafood';
  if (t.includes('vegetable') || t.includes('fruit')) return 'produce';
  if (t.includes('beverage') || t.includes('drink')) return 'beverages';
  if (t.includes('frozen')) return 'frozen';
  return 'other';
}

function defaultExpiry(tags = []) {
  const t = tags.join(' ').toLowerCase();
  if (t.includes('bread') || t.includes('pastry')) return 2;
  if (t.includes('dairy') || t.includes('milk')) return 5;
  if (t.includes('meat')) return 3;
  if (t.includes('fruit') || t.includes('vegetable')) return 4;
  if (t.includes('frozen')) return 90;
  return 3;
}

module.exports = router;