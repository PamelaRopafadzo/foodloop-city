'use strict';

const express = require('express');
const router = express.Router();
const { Organisation, User, DonationListing, PickupOutcome } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// GET /api/admin/organisations
router.get('/organisations', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows } = await Organisation.findAndCountAll({
    limit: parseInt(limit),
    offset,
    order: [['createdAt', 'DESC']]
  });

  res.json({ total: count, organisations: rows });
}));

// PUT /api/admin/organisations/:id/deactivate
router.put('/organisations/:id/deactivate', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const org = await Organisation.findByPk(req.params.id);
  if (!org) throw new AppError('Organisation not found', 404);

  await org.update({ isActive: false });
  await User.update({ isActive: false }, { where: { organisationId: req.params.id } });

  res.json({ message: 'Organisation deactivated' });
}));

// GET /api/admin/users
router.get('/users', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows } = await User.findAll({
    include: [{ model: Organisation, as: 'organisation', attributes: ['id', 'name', 'type'] }],
    limit: parseInt(limit),
    offset,
    order: [['createdAt', 'DESC']]
  });

  res.json({ total: count, users: rows });
}));

// PUT /api/admin/users/:id
router.put('/users/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  const allowed = ['role', 'isActive'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  await user.update(updates);
  res.json(user);
}));

module.exports = router;