const { sequelize } = require('../models');
const logger = require('./logger');

async function connectDB() {
  try {
    await sequelize.authenticate();
    logger.info('Connected to MySQL database');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Database models synchronized');
  } catch (error) {
    logger.error('MySQL connection error:', error);
    process.exit(1);
  }
}

module.exports = connectDB;
