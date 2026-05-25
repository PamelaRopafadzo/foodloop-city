'use strict';

module.exports = (sequelize, DataTypes) => {
  const InventoryEvent = sequelize.define('InventoryEvent', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId:      { type: DataTypes.UUID, allowNull: false },
    organisationId: { type: DataTypes.UUID, allowNull: false },
    loggedBy:       { type: DataTypes.UUID, allowNull: false },
    quantity:       { type: DataTypes.DECIMAL(10, 3), allowNull: false },
    expiryDate:     { type: DataTypes.DATEONLY },
    notes:          { type: DataTypes.TEXT },
    eventType:      { type: DataTypes.ENUM('stock_check','delivery','adjustment','waste_logged'), defaultValue: 'stock_check' },
    recordedAt:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName:   'inventory_events',
    underscored: true
  });

  InventoryEvent.associate = (db) => {
    InventoryEvent.belongsTo(db.Product,      { foreignKey: 'productId' });
    InventoryEvent.belongsTo(db.Organisation, { foreignKey: 'organisationId' });
    InventoryEvent.belongsTo(db.User,         { foreignKey: 'loggedBy', as: 'loggedByUser' });
  };

  return InventoryEvent;
};