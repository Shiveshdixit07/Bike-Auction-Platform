const Redis = require('ioredis');
const config = require('./index');
const logger = require('./logger');

let redisClient;
let redisSubscriber;

function createRedisClient() {
  const client = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  client.on('connect', () => {
    logger.info('Redis connected');
  });

  client.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  client.on('disconnect', () => {
    logger.error('Redis disconnected');
  });

  return client;
}

function getRedisClient() {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

function getRedisSubscriber() {
  if (!redisSubscriber) {
    redisSubscriber = createRedisClient();
  }
  return redisSubscriber;
}

async function checkRedisConnection() {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

module.exports = { getRedisClient, getRedisSubscriber, checkRedisConnection };
