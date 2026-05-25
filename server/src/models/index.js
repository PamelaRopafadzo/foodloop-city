'use strict';

const { Sequelize } = require('sequelize');
const config        = require('../config/database');

const env      = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

// Load all models
const Organisation   = require('./Organisation')(sequelize,   Sequelize.DataTypes);
const User           = require('./User')(sequelize,           Sequelize.DataTypes);
const Product        = require('./Product')(sequelize,        Sequelize.DataTypes);
const InventoryEvent = require('./InventoryEvent')(sequelize, Sequelize.DataTypes);
const SalesRecord    = require('./SalesRecord')(sequelize,    Sequelize.DataTypes);
const DonationListing = require('./DonationListing')(sequelize, Sequelize.DataTypes);
const PickupOutcome  = require('./PickupOutcome')(sequelize,  Sequelize.DataTypes);

const db = {
  sequelize,
  Sequelize,
  Organisation,
  User,
  Product,
  InventoryEvent,
  SalesRecord,
  DonationListing,
  PickupOutcome
};

// Run associations — each model defines its own
Object.values(db).forEach(model => {
  if (model && model.associate) model.associate(db);
});

module.exports = db;