'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    const hash = await bcrypt.hash('password123', 12);

    const restaurantId = uuidv4();
    const charityId    = uuidv4();

    await queryInterface.bulkInsert('organisations', [
      {
        id:               restaurantId,
        name:             'MKcafe',
        type:             'cafe',
        address:          'ul. Wolska 12, Warsaw',
        city:             'Warsaw',
        latitude:         52.2297,
        longitude:        21.0122,
        food_preferences: JSON.stringify([]),
        is_active:        true,
        created_at:       new Date(),
        updated_at:       new Date()
      },
      {
        id:               charityId,
        name:             'Warsaw Food Bank',
        type:             'charity',
        address:          'ul. Ludna 9, Warsaw',
        city:             'Warsaw',
        latitude:         52.2350,
        longitude:        21.0300,
        food_preferences: JSON.stringify(['bakery', 'dairy', 'produce']),
        is_active:        true,
        created_at:       new Date(),
        updated_at:       new Date()
      }
    ]);

    await queryInterface.bulkInsert('users', [
      {
        id:             uuidv4(),
        organisation_id: null,
        email:          'admin@foodloop.city',
        password_hash:  hash,
        first_name:     'Platform',
        last_name:      'Admin',
        role:           'admin',
        is_active:      true,
        created_at:     new Date(),
        updated_at:     new Date()
      },
      {
        id:             uuidv4(),
        organisation_id: restaurantId,
        email:          'manager@cafewola.pl',
        password_hash:  hash,
        first_name:     'Ana',
        last_name:      'Beth',
        role:           'manager',
        is_active:      true,
        created_at:     new Date(),
        updated_at:     new Date()
      },
      {
        id:             uuidv4(),
        organisation_id: restaurantId,
        email:          'staff@cafewola.pl',
        password_hash:  hash,
        first_name:     'Pamela',
        last_name:      'Ropafadzo',
        role:           'staff',
        is_active:      true,
        created_at:     new Date(),
        updated_at:     new Date()
      },
      {
        id:             uuidv4(),
        organisation_id: charityId,
        email:          'coordinator@warsawfoodbank.pl',
        password_hash:  hash,
        first_name:     'Ewa',
        last_name:      'Nowak',
        role:           'charity_coordinator',
        is_active:      true,
        created_at:     new Date(),
        updated_at:     new Date()
      }
    ]);

    await queryInterface.bulkInsert('products', [
      {
        id:              uuidv4(),
        organisation_id: restaurantId,
        name:            'Croissant',
        sku:             'BAKE-001',
        category:        'bakery',
        expiry_days:     2,
        unit:            'units',
        is_active:       true,
        created_at:      new Date(),
        updated_at:      new Date()
      },
      {
        id:              uuidv4(),
        organisation_id: restaurantId,
        name:            'Whole Milk 1L',
        sku:             'DAIRY-001',
        category:        'dairy',
        expiry_days:     5,
        unit:            'l',
        is_active:       true,
        created_at:      new Date(),
        updated_at:      new Date()
      },
      {
        id:              uuidv4(),
        organisation_id: restaurantId,
        name:            'Chicken Sandwich',
        sku:             'PREP-001',
        category:        'prepared',
        expiry_days:     1,
        unit:            'units',
        is_active:       true,
        created_at:      new Date(),
        updated_at:      new Date()
      },
      {
        id:              uuidv4(),
        organisation_id: restaurantId,
        name:            'Sourdough Loaf',
        sku:             'BAKE-002',
        category:        'bakery',
        expiry_days:     3,
        unit:            'units',
        is_active:       true,
        created_at:      new Date(),
        updated_at:      new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('products',      null, {});
    await queryInterface.bulkDelete('users',         null, {});
    await queryInterface.bulkDelete('organisations', null, {});
  }
};
