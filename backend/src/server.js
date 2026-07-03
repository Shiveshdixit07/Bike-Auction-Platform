const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const connectDB = require('./config/db');
const { sequelize } = require('./models');
const { getRedisClient } = require('./config/redis');
const { setupSocketIO } = require('./modules/notifications/socket');
const { transitionAuctions } = require('./modules/auctions/service');

const server = http.createServer(app);

const io = setupSocketIO(server);
app.set('io', io);

let transitionInterval;

async function start() {
  await connectDB();

  transitionInterval = setInterval(async () => {
    try {
      await transitionAuctions();
    } catch (error) {
      logger.error({ err: error, event: 'scheduler_error' }, 'Auction transition failed');
    }
  }, 10000);

  server.listen(config.port, () => {
    logger.info({ event: 'server_start', port: config.port, env: config.nodeEnv }, 'Server started');
  });
}

async function shutdown(signal) {
  logger.info({ event: 'shutdown_start', signal }, 'Graceful shutdown initiated');

  if (transitionInterval) {
    clearInterval(transitionInterval);
    logger.debug({ event: 'scheduler_stopped' }, 'Auction transition interval cleared');
  }

  server.close(() => {
    logger.debug({ event: 'http_server_closed' }, 'HTTP server closed');
  });

  try {
    io.close(() => {
      logger.debug({ event: 'socketio_closed' }, 'Socket.IO connections closed');
    });
  } catch (err) {
    logger.error({ err, event: 'socketio_shutdown_error' }, 'Error closing Socket.IO');
  }

  try {
    await sequelize.close();
    logger.debug({ event: 'mysql_closed' }, 'MySQL connection closed');
  } catch (err) {
    logger.error({ err, event: 'mysql_shutdown_error' }, 'Error closing MySQL');
  }

  try {
    const redis = getRedisClient();
    await redis.quit();
    logger.debug({ event: 'redis_closed' }, 'Redis connection closed');
  } catch (err) {
    logger.error({ err, event: 'redis_shutdown_error' }, 'Error closing Redis');
  }

  logger.info({ event: 'shutdown_complete' }, 'Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error({ err, event: 'unhandled_rejection' }, 'Unhandled Promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err, event: 'uncaught_exception' }, 'Uncaught exception — shutting down');
  shutdown('uncaughtException');
});

start().catch((err) => {
  logger.fatal({ err, event: 'startup_failed' }, 'Server failed to start');
  process.exit(1);
});
