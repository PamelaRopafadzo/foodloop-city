'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organisationId: { type: DataTypes.UUID, allowNull: true },
    email:          { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash:   { type: DataTypes.STRING(255), allowNull: false },
    firstName:      { type: DataTypes.STRING(100), allowNull: false },
    lastName:       { type: DataTypes.STRING(100), allowNull: false },
    role:           { type: DataTypes.ENUM('admin','manager','staff','charity_coordinator'), defaultValue: 'staff' },
    phone:          { type: DataTypes.STRING(30) },
    lastLoginAt:    { type: DataTypes.DATE },
    isActive:       { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName:    'users',
    underscored:  true,
    // Never return passwordHash in API responses by default
    defaultScope: { attributes: { exclude: ['passwordHash'] } },
    scopes:       { withPassword: { attributes: {} } }
  });

  // Compare plaintext password against stored hash
  User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.passwordHash);
  };

  // Hash password before creating user
  User.beforeCreate(async (user) => {
    const salt    = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
  });

  // Hash password if it changes on update
  User.beforeUpdate(async (user) => {
    if (user.changed('passwordHash')) {
      const salt    = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
    }
  });

  User.associate = (db) => {
    User.belongsTo(db.Organisation, { foreignKey: 'organisationId', as: 'organisation' });
  };

  return User;
};