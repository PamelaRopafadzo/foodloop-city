'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory_events', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
        allowNull:    false
      },
      product_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'products', key: 'id' },
        onDelete:   'CASCADE'
      },
      organisation_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'organisations', key: 'id' },
        onDelete:   'CASCADE'
      },
      logged_by: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'users', key: 'id' }
      },
      quantity: {
        type:      Sequelize.DECIMAL(10, 3),
        allowNull: false
      },
      // When does this batch expire?
      // If null, risk engine falls back to product.expiry_days
      expiry_date: {
        type:      Sequelize.DATEONLY,
        allowNull: true
      },
      notes: {
        type:      Sequelize.TEXT,
        allowNull: true
      },
      // stock_check, delivery, adjustment, waste_logged
      event_type: {
        type:         Sequelize.ENUM('stock_check','delivery','adjustment','waste_logged'),
        defaultValue: 'stock_check'
      },
      recorded_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('NOW()')
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

    await queryInterface.addIndex('inventory_events', ['product_id', 'recorded_at']);
    await queryInterface.addIndex('inventory_events', ['organisation_id', 'recorded_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('inventory_events');
  }
};