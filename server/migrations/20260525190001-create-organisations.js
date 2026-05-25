'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('organisations', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
        allowNull:    false
      },
      name: {
        type:      Sequelize.STRING(200),
        allowNull: false
      },
      // 'restaurant', 'supermarket', 'cafe', 'bakery', 'vendor', 'charity'
      type: {
        type:      Sequelize.ENUM('restaurant','supermarket','cafe','bakery','vendor','charity'),
        allowNull: false
      },
      address: {
        type:      Sequelize.TEXT,
        allowNull: false
      },
      city: {
        type:         Sequelize.STRING(100),
        allowNull:    false,
        defaultValue: 'Warsaw'
      },
      // Latitude and longitude for the charity map
      latitude: {
        type:      Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type:      Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      // Charities can list which food types they accept
      food_preferences: {
        type:         Sequelize.JSONB,
        defaultValue: []
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

    await queryInterface.addIndex('organisations', ['type']);
    await queryInterface.addIndex('organisations', ['city']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('organisations');
  }
};