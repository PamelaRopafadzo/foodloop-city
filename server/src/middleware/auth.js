'use strict';

const jwt          = require('jsonwebtoken');
const { User, Organisation } = require('../models');

// Verify JWT and attach user to req.user
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where:   { id: decoded.userId, isActive: true },
      include: [{ model: Organisation, as: 'organisation' }]
    });

    if (!user) return res.status(401).json({ error: 'User not found or deactivated' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Role guard — pass one or more allowed roles
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access denied. Required: ${roles.join(' or ')}` });
  }
  next();
};

// Convenience shortcuts used throughout the routes
const requireAdmin   = requireRole('admin');
const requireManager = requireRole('admin', 'manager');
const requireStaff   = requireRole('admin', 'manager', 'staff');
const requireCharity = requireRole('admin', 'charity_coordinator');

module.exports = { authenticate, requireRole, requireAdmin, requireManager, requireStaff, requireCharity };