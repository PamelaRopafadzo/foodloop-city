require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    dialect:  'postgres',
    logging:  false,
    define: {
      underscored: true,  // use snake_case column names automatically
      timestamps:  true   // createdAt + updatedAt on every table
    }
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'foodloop_test',
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    dialect:  'postgres',
    logging:  false,
    define: { underscored: true, timestamps: true }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    },
    define: { underscored: true, timestamps: true }
  }
};