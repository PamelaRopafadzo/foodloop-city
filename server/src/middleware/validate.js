'use strict';

const validate = (data, requiredFields) => {
  const missing = requiredFields.filter(f =>
    data[f] === undefined || data[f] === null || data[f] === ''
  );
  return missing.length > 0
    ? `Missing required fields: ${missing.join(', ')}`
    : null;
};

module.exports = { validate };