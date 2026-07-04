const { sequelize } = require('../models');
const logger = require('./logger');

async function connectDB() {
  try {
    await sequelize.authenticate();
    logger.info('Connected to MySQL database');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Database models synchronized');
  } catch (error) {
    logger.error({
      event: 'mysql_connection_error',
      message: error.message,
      name: error.name,
      parent: error.parent ? {
        code: error.parent.code,
        errno: error.parent.errno,
        syscall: error.parent.syscall,
        hostname: error.parent.hostname,
      } : null,
    }, 'MySQL connection error');
    process.exit(1);
  }
}

module.exports = connectDB;
