'use strict';

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { DonationListing, PickupOutcome, Organisation, Product } = require('../models');
const { authenticate, requireManager, requireCharity } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validate');

// GET /api/donations
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let where = {};

  if (req.user.role === 'manager' || req.user.role === 'staff') {
    where.donorOrgId = req.user.organisationId;
  } else if (req.user.role === 'charity_coordinator') {
    where = {
      [Op.or]: [
        { status: 'available' },
        { claimedByOrgId: req.user.organisationId }
      ]
    };
  }

  if (status) where.status = status;

  const { count, rows } = await DonationListing.findAndCountAll({
    where,
    include: [
      {
        model: Organisation, as: 'donor',
        attributes: ['id', 'name', 'address', 'city', 'latitude', 'longitude']
      },
      { model: Product, as: 'product', attributes: ['id', 'name', 'category', 'unit'] },
      { model: Organisation, as: 'claimedBy', attributes: ['id', 'name'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  res.json({ total: count, listings: rows });
}));

// GET /api/donations/map — available listings with coordinates for the map
router.get('/map', authenticate, requireCharity, asyncHandler(async (req, res) => {
  const { city = 'Warsaw' } = req.query;

  const listings = await DonationListing.findAll({
    where: { status: 'available' },
    include: [
      {
        model: Organisation, as: 'donor',
        where: { city },
        attributes: ['id', 'name', 'address', 'latitude', 'longitude']
      },
      { model: Product, as: 'product', attributes: ['id', 'name', 'category'] }
    ],
    order: [['pickupWindowEnd', 'ASC']]
  });

  // Shape into map marker objects
  const markers = listings
    .filter(l => l.donor.latitude && l.donor.longitude)
    .map(l => ({
      id:               l.id,
      lat:              parseFloat(l.donor.latitude),
      lng:              parseFloat(l.donor.longitude),
      donorName:        l.donor.name,
      donorAddress:     l.donor.address,
      product:          l.product.name,
      category:         l.product.category,
      quantity:         l.quantity,
      unit:             l.unit,
      pickupWindowEnd:  l.pickupWindowEnd,
      bestBefore:       l.bestBefore
    }));

  res.json(markers);
}));

// POST /api/donations — manager creates a listing
router.post('/', authenticate, requireManager, asyncHandler(async (req, res) => {
  const error = validate(req.body, ['productId', 'quantity', 'pickupWindowStart', 'pickupWindowEnd']);
  if (error) throw new AppError(error, 400);

  const product = await Product.findOne({
    where: { id: req.body.productId, organisationId: req.user.organisationId }
  });
  if (!product) throw new AppError('Product not found', 404);

  const listing = await DonationListing.create({
    donorOrgId:        req.user.organisationId,
    productId:         req.body.productId,
    quantity:          req.body.quantity,
    unit:              req.body.unit || product.unit,
    description:       req.body.description || null,
    pickupWindowStart: req.body.pickupWindowStart,
    pickupWindowEnd:   req.body.pickupWindowEnd,
    bestBefore:        req.body.bestBefore || null
  });

  // Load full listing with associations for the WebSocket payload
  const full = await DonationListing.findByPk(listing.id, {
    include: [
      { model: Organisation, as: 'donor',
        attributes: ['id', 'name', 'address', 'city', 'latitude', 'longitude'] },
      { model: Product, as: 'product', attributes: ['id', 'name', 'category'] }
    ]
  });

  // Push new pin to charity map instantly
  const io = req.app.get('io');
  if (full.donor.latitude && full.donor.longitude) {
    io.of('/charity')
      .to(`city:${full.donor.city}`)
      .emit('donation:new', {
        id:             full.id,
        lat:            parseFloat(full.donor.latitude),
        lng:            parseFloat(full.donor.longitude),
        donorName:      full.donor.name,
        product:        full.product.name,
        category:       full.product.category,
        quantity:       full.quantity,
        unit:           full.unit,
        pickupWindowEnd: full.pickupWindowEnd
      });
  }

  res.status(201).json(full);
}));

// POST /api/donations/:id/claim
router.post('/:id/claim', authenticate, requireCharity, asyncHandler(async (req, res) => {
  const listing = await DonationListing.findByPk(req.params.id);
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.status !== 'available') {
    throw new AppError(`Listing is already ${listing.status}`, 409);
  }

  await listing.update({
    status:          'claimed',
    claimedByOrgId:  req.user.organisationId,
    claimedAt:       new Date()
  });

  const io = req.app.get('io');
  // Remove pin from charity map
  io.of('/charity').emit('donation:claimed', { id: listing.id });
  // Notify donor manager
  io.of('/manager')
    .to(`org:${listing.donorOrgId}`)
    .emit('donation:claimed', { id: listing.id });

  res.json(listing);
}));

// POST /api/donations/:id/complete — charity logs what happened
router.post('/:id/complete', authenticate, requireCharity, asyncHandler(async (req, res) => {
  const error = validate(req.body, ['outcome']);
  if (error) throw new AppError(error, 400);

  const listing = await DonationListing.findByPk(req.params.id);
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.claimedByOrgId !== req.user.organisationId) {
    throw new AppError('You did not claim this listing', 403);
  }
  if (listing.status !== 'claimed') {
    throw new AppError('Listing is not claimed', 409);
  }

  // Rough CO2 calculation: ~2.5kg CO2 saved per kg of food rescued
  const co2 = req.body.quantityCollected
    ? parseFloat((req.body.quantityCollected * 2.5).toFixed(2))
    : null;

  await listing.update({
    status:      'completed',
    completedAt: new Date(),
    co2SavedKg:  co2
  });

  const outcome = await PickupOutcome.create({
    donationListingId: listing.id,
    charityOrgId:      req.user.organisationId,
    loggedBy:          req.user.id,
    outcome:           req.body.outcome,
    quantityCollected: req.body.quantityCollected || null,
    mealsEquivalent:   req.body.mealsEquivalent || null,
    notes:             req.body.notes || null,
    collectedAt:       new Date()
  });

  res.json({ listing, outcome });
}));

// POST /api/donations/:id/cancel
router.post('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
  const listing = await DonationListing.findByPk(req.params.id);
  if (!listing) throw new AppError('Listing not found', 404);

  const isOwner   = listing.donorOrgId      === req.user.organisationId;
  const isClaimer = listing.claimedByOrgId  === req.user.organisationId;
  const isAdmin   = req.user.role           === 'admin';

  if (!isOwner && !isClaimer && !isAdmin) {
    throw new AppError('Access denied', 403);
  }
  if (['completed', 'cancelled'].includes(listing.status)) {
    throw new AppError(`Listing already ${listing.status}`, 409);
  }

  await listing.update({ status: 'cancelled' });
  const io = req.app.get('io');
  io.of('/charity').emit('donation:cancelled', { id: listing.id });

  res.json({ message: 'Cancelled', id: listing.id });
}));

module.exports = router;