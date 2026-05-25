'use strict';

module.exports = (sequelize, DataTypes) => {
  const PickupOutcome = sequelize.define('PickupOutcome', {
    id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    donationListingId:  { type: DataTypes.UUID, allowNull: false },
    charityOrgId:       { type: DataTypes.UUID, allowNull: false },
    loggedBy:           { type: DataTypes.UUID, allowNull: false },
    outcome:            { type: DataTypes.ENUM('collected','partial','missed','cancelled'), allowNull: false },
    quantityCollected:  { type: DataTypes.DECIMAL(10, 3) },
    mealsEquivalent:    { type: DataTypes.INTEGER },
    notes:              { type: DataTypes.TEXT },
    collectedAt:        { type: DataTypes.DATE }
  }, {
    tableName:   'pickup_outcomes',
    underscored: true
  });

  PickupOutcome.associate = (db) => {
    PickupOutcome.belongsTo(db.DonationListing, { foreignKey: 'donationListingId' });
    PickupOutcome.belongsTo(db.Organisation,    { foreignKey: 'charityOrgId' });
    PickupOutcome.belongsTo(db.User,            { foreignKey: 'loggedBy', as: 'loggedByUser' });
  };

  return PickupOutcome;
};