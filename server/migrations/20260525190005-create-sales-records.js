'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sales_records', {
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
      units_sold: {
        type:         Sequelize.DECIMAL(10, 3),
        allowNull:    false,
        defaultValue: 0
      },
      // Kept for compatibility with the simplified sales route
      hour_of_day: {
        type:         Sequelize.INTEGER,
        allowNull:    false,
        defaultValue: 12
      },
      day_of_week: {
        type:      Sequelize.INTEGER,
        allowNull: false
      },
      sale_date: {
        type:      Sequelize.DATEONLY,
        allowNull: false
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

    await queryInterface.addIndex('sales_records', ['product_id', 'sale_date']);
    await queryInterface.addIndex('sales_records', ['organisation_id', 'sale_date']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('sales_records');
  }
};