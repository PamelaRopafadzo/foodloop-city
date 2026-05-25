'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pickup_outcomes', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
        allowNull:    false
      },
      donation_listing_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'donation_listings', key: 'id' }
      },
      charity_org_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'organisations', key: 'id' }
      },
      logged_by: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'users', key: 'id' }
      },
      // collected, partial, missed, cancelled
      outcome: {
        type:      Sequelize.ENUM('collected','partial','missed','cancelled'),
        allowNull: false
      },
      quantity_collected: {
        type:      Sequelize.DECIMAL(10, 3),
        allowNull: true
      },
      // Rough estimate of meals provided
      meals_equivalent: {
        type:      Sequelize.INTEGER,
        allowNull: true
      },
      notes: {
        type:      Sequelize.TEXT,
        allowNull: true
      },
      collected_at: {
        type:      Sequelize.DATE,
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

    await queryInterface.addIndex('pickup_outcomes', ['charity_org_id']);
    await queryInterface.addIndex('pickup_outcomes', ['donation_listing_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('pickup_outcomes');
  }
};