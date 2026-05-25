'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
        allowNull:    false
      },
      organisation_id: {
        type:       Sequelize.UUID,
        allowNull:  true, // null for platform admins
        references: { model: 'organisations', key: 'id' },
        onDelete:   'CASCADE'
      },
      email: {
        type:      Sequelize.STRING(255),
        allowNull: false,
        unique:    true
      },
      password_hash: {
        type:      Sequelize.STRING(255),
        allowNull: false
      },
      first_name: {
        type:      Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type:      Sequelize.STRING(100),
        allowNull: false
      },
      role: {
        type:         Sequelize.ENUM('admin','manager','staff','charity_coordinator'),
        allowNull:    false,
        defaultValue: 'staff'
      },
      phone: {
        type:      Sequelize.STRING(30),
        allowNull: true
      },
      last_login_at: {
        type:      Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type:         Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['organisation_id']);
    await queryInterface.addIndex('users', ['role']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('users');
  }
};