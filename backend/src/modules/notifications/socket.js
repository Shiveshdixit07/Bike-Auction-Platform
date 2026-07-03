const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { getRedisClient, getRedisSubscriber } = require('../../config/redis');
const { wsConnections } = require('../../common/metrics');
const logger = require('../../config/logger');

function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  const pubClient = getRedisClient();
  const subClient = getRedisSubscriber();
  io.adapter(createAdapter(pubClient, subClient));

  let connectionCount = 0;

  io.on('connection', (socket) => {
    connectionCount++;
    wsConnections.set(connectionCount);
    logger.debug({ event: 'ws_connection', socketId: socket.id }, 'Client connected');

    socket.on('join_auction', ({ auctionId }) => {
      socket.join(`auction:${auctionId}`);
      logger.debug({ event: 'ws_join_room', socketId: socket.id, auctionId }, 'Client joined auction room');
    });

    socket.on('leave_auction', ({ auctionId }) => {
      socket.leave(`auction:${auctionId}`);
      logger.debug({ event: 'ws_leave_room', socketId: socket.id, auctionId }, 'Client left auction room');
    });

    socket.on('disconnect', () => {
      connectionCount--;
      wsConnections.set(connectionCount);
      logger.debug({ event: 'ws_disconnect', socketId: socket.id }, 'Client disconnected');
    });
  });

  return io;
}

module.exports = { setupSocketIO };
