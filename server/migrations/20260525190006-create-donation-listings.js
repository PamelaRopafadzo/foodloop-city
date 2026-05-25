'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('donation_listings', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
        allowNull:    false
      },
      donor_org_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'organisations', key: 'id' }
      },
      product_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'products', key: 'id' }
      },
      claimed_by_org_id: {
        type:       Sequelize.UUID,
        allowNull:  true,
        references: { model: 'organisations', key: 'id' }
      },
      quantity: {
        type:      Sequelize.DECIMAL(10, 3),
        allowNull: false
      },
      unit: {
        type:         Sequelize.STRING(20),
        defaultValue: 'units'
      },
      description: {
        type:      Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type:         Sequelize.ENUM('available','claimed','completed','cancelled','expired'),
        defaultValue: 'available'
      },
      pickup_window_start: {
        type:      Sequelize.DATE,
        allowNull: false
      },
      pickup_window_end: {
        type:      Sequelize.DATE,
        allowNull: false
      },
      best_before: {
        type:      Sequelize.DATEONLY,
        allowNull: true
      },
      claimed_at: {
        type:      Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type:      Sequelize.DATE,
        allowNull: true
      },
      // Estimated CO2 saved — calculated on completion
      // Rough formula: quantity × 2.5 kg CO2 per kg of food saved
      co2_saved_kg: {
        type:      Sequelize.DECIMAL(8, 3),
        allowNull: true
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

    await queryInterface.addIndex('donation_listings', ['status']);
    await queryInterface.addIndex('donation_listings', ['donor_org_id']);
    await queryInterface.addIndex('donation_listings', ['claimed_by_org_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('donation_listings');
  }
};