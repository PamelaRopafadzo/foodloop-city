'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
        allowNull:    false
      },
      organisation_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'organisations', key: 'id' },
        onDelete:   'CASCADE'
      },
      name: {
        type:      Sequelize.STRING(200),
        allowNull: false
      },
      sku: {
        type:      Sequelize.STRING(100),
        allowNull: true
      },
      category: {
        type:         Sequelize.ENUM(
          'bakery','dairy','produce','meat','seafood',
          'prepared','beverages','dry_goods','frozen','other'
        ),
        defaultValue: 'other'
      },
      // Default shelf life in days
      // Used when staff don't log a specific expiry date
      expiry_days: {
        type:         Sequelize.INTEGER,
        allowNull:    false,
        defaultValue: 3
      },
      unit: {
        type:         Sequelize.STRING(20),
        defaultValue: 'units'
      },
      // Barcode from OpenFoodFacts API lookup
      off_barcode: {
        type:      Sequelize.STRING(50),
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

    await queryInterface.addIndex('products', ['organisation_id']);
    await queryInterface.addIndex('products', ['category']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('products');
  }
};