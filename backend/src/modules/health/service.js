const { sequelize } = require('../../models');
const { checkRedisConnection } = require('../../config/redis');
const logger = require('../../config/logger');

async function checkMysql() {
  try {
    await sequelize.authenticate();
    return { status: 'connected' };
  } catch (err) {
    logger.error({ event: 'health_check_failed', component: 'mysql', error: err.message }, 'MySQL health check failed');
    return { status: 'disconnected' };
  }
}

async function checkRedis() {
  try {
    const connected = await checkRedisConnection();
    return { status: connected ? 'connected' : 'disconnected' };
  } catch (err) {
    logger.error({ event: 'health_check_failed', component: 'redis', error: err.message }, 'Redis health check failed');
    return { status: 'disconnected' };
  }
}

async function checkReadiness() {
  const [mysql, redis] = await Promise.all([checkMysql(), checkRedis()]);
  const status = mysql.status === 'connected' && redis.status === 'connected' ? 'ok' : 'degraded';

  return {
    status,
    mysql: mysql.status,
    redis: redis.status,
  };
}

module.exports = { checkReadiness };
