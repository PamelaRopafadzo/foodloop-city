'use strict';

module.exports = (sequelize, DataTypes) => {
  const SalesRecord = sequelize.define('SalesRecord', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId:      { type: DataTypes.UUID, allowNull: false },
    organisationId: { type: DataTypes.UUID, allowNull: false },
    unitsSold:      { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
    hourOfDay:      { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12 },
    dayOfWeek:      { type: DataTypes.INTEGER, allowNull: false },
    saleDate:       { type: DataTypes.DATEONLY, allowNull: false }
  }, {
    tableName:   'sales_records',
    underscored: true
  });

  SalesRecord.associate = (db) => {
    SalesRecord.belongsTo(db.Product,      { foreignKey: 'productId' });
    SalesRecord.belongsTo(db.Organisation, { foreignKey: 'organisationId' });
  };

  return SalesRecord;
};