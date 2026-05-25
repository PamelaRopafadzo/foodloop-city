'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organisationId: { type: DataTypes.UUID, allowNull: false },
    name:           { type: DataTypes.STRING(200), allowNull: false },
    sku:            { type: DataTypes.STRING(100) },
    category:       { type: DataTypes.ENUM('bakery','dairy','produce','meat','seafood','prepared','beverages','dry_goods','frozen','other'), defaultValue: 'other' },
    expiryDays:     { type: DataTypes.INTEGER, defaultValue: 3 },
    unit:           { type: DataTypes.STRING(20), defaultValue: 'units' },
    offBarcode:     { type: DataTypes.STRING(50) },
    isActive:       { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName:   'products',
    underscored: true
  });

  Product.associate = (db) => {
    Product.belongsTo(db.Organisation,    { foreignKey: 'organisationId' });
    Product.hasMany(db.InventoryEvent,    { foreignKey: 'productId' });
    Product.hasMany(db.SalesRecord,       { foreignKey: 'productId' });
    Product.hasMany(db.DonationListing,   { foreignKey: 'productId' });
  };

  return Product;
};