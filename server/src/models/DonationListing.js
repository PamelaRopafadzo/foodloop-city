'use strict';

module.exports = (sequelize, DataTypes) => {
  const DonationListing = sequelize.define('DonationListing', {
    id:                { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    donorOrgId:        { type: DataTypes.UUID, allowNull: false },
    productId:         { type: DataTypes.UUID, allowNull: false },
    claimedByOrgId:    { type: DataTypes.UUID },
    quantity:          { type: DataTypes.DECIMAL(10, 3), allowNull: false },
    unit:              { type: DataTypes.STRING(20), defaultValue: 'units' },
    description:       { type: DataTypes.TEXT },
    status:            { type: DataTypes.ENUM('available','claimed','completed','cancelled','expired'), defaultValue: 'available' },
    pickupWindowStart: { type: DataTypes.DATE, allowNull: false },
    pickupWindowEnd:   { type: DataTypes.DATE, allowNull: false },
    bestBefore:        { type: DataTypes.DATEONLY },
    claimedAt:         { type: DataTypes.DATE },
    completedAt:       { type: DataTypes.DATE },
    co2SavedKg:        { type: DataTypes.DECIMAL(8, 3) }
  }, {
    tableName:   'donation_listings',
    underscored: true
  });

  DonationListing.associate = (db) => {
    DonationListing.belongsTo(db.Organisation, { foreignKey: 'donorOrgId',     as: 'donor' });
    DonationListing.belongsTo(db.Organisation, { foreignKey: 'claimedByOrgId', as: 'claimedBy' });
    DonationListing.belongsTo(db.Product,      { foreignKey: 'productId',      as: 'product' });
    DonationListing.hasOne(db.PickupOutcome,   { foreignKey: 'donationListingId' });
  };

  return DonationListing;
};