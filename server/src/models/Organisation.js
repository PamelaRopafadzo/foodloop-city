'use strict';

module.exports = (sequelize, DataTypes) => {
  const Organisation = sequelize.define('Organisation', {
    id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:             { type: DataTypes.STRING(200), allowNull: false },
    type:             { type: DataTypes.ENUM('restaurant','supermarket','cafe','bakery','vendor','charity'), allowNull: false },
    address:          { type: DataTypes.TEXT, allowNull: false },
    city:             { type: DataTypes.STRING(100), defaultValue: 'Warsaw' },
    latitude:         { type: DataTypes.DECIMAL(10, 8) },
    longitude:        { type: DataTypes.DECIMAL(11, 8) },
    foodPreferences:  { type: DataTypes.JSONB, defaultValue: [] },
    isActive:         { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName:   'organisations',
    underscored: true
  });

  Organisation.associate = (db) => {
    Organisation.hasMany(db.User,           { foreignKey: 'organisationId', as: 'users' });
    Organisation.hasMany(db.Product,        { foreignKey: 'organisationId', as: 'products' });
    Organisation.hasMany(db.InventoryEvent, { foreignKey: 'organisationId' });
    Organisation.hasMany(db.SalesRecord,    { foreignKey: 'organisationId' });
    Organisation.hasMany(db.DonationListing, { foreignKey: 'donorOrgId',      as: 'donationsGiven' });
    Organisation.hasMany(db.DonationListing, { foreignKey: 'claimedByOrgId',  as: 'donationsClaimed' });
  };

  return Organisation;
};