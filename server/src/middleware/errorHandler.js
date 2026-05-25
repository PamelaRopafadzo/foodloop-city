'use strict';

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Wraps async route handlers — no try/catch needed in every route
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const globalErrorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message;

  console.error(`[${status}] ${err.message}`);
  res.status(status).json({ error: message });
};

module.exports = { AppError, asyncHandler, globalErrorHandler };