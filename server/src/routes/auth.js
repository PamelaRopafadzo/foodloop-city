'use strict';

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const { User, Organisation } = require('../models');
const { authenticate } = require('../middleware/auth');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
// Creates a new organisation and a manager account in one step
router.post('/register', async (req, res) => {
  try {
    const { orgName, orgType, orgAddress, orgCity, orgLat, orgLng,
            email, password, firstName, lastName, phone } = req.body;

    if (!email || !password || !firstName || !lastName || !orgName || !orgType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await User.scope('withPassword').findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const org = await Organisation.create({
      name:      orgName,
      type:      orgType,
      address:   orgAddress || '',
      city:      orgCity || 'Warsaw',
      latitude:  orgLat  || null,
      longitude: orgLng  || null
    });

    // passwordHash stores plaintext here —
    // the beforeCreate hook in User.js hashes it automatically
    const user = await User.create({
      organisationId: org.id,
      email,
      passwordHash:   password,
      firstName,
      lastName,
      role:  'manager',
      phone: phone || null
    });

    res.status(201).json({
      token: signToken(user.id),
      user: {
        id:           user.id,
        email:        user.email,
        firstName:    user.firstName,
        lastName:     user.lastName,
        role:         user.role,
        organisation: org
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.scope('withPassword').findOne({
      where:   { email, isActive: true },
      include: [{ model: Organisation, as: 'organisation' }]
    });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await user.validatePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await user.update({ lastLoginAt: new Date() });

    res.json({
      token: signToken(user.id),
      user: {
        id:           user.id,
        email:        user.email,
        firstName:    user.firstName,
        lastName:     user.lastName,
        role:         user.role,
        organisation: user.organisation
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me — restores session on app load
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id:           req.user.id,
      email:        req.user.email,
      firstName:    req.user.firstName,
      lastName:     req.user.lastName,
      role:         req.user.role,
      organisation: req.user.organisation
    }
  });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user  = await User.scope('withPassword').findByPk(req.user.id);
    const valid = await user.validatePassword(currentPassword);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    await user.update({ passwordHash: newPassword });
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: 'Password change failed' });
  }
});

module.exports = router;