const { Op } = require('sequelize');
const { Auction, Bike, AuditLog, User } = require('../../models');
const { getRedisClient } = require('../../config/redis');
const { activeAuctions } = require('../../common/metrics');
const logger = require('../../config/logger');

async function createAuction(data, createdBy) {
  const bike = await Bike.findByPk(data.bikeId);
  if (!bike) {
    const error = new Error('Bike not found');
    error.statusCode = 404;
    throw error;
  }

  const auction = await Auction.create({ ...data, createdBy });

  logger.info({
    event: 'auction_created',
    auctionId: auction.id,
    bikeId: data.bikeId,
    status: auction.status,
    startingPrice: data.startingPrice,
    createdBy,
  }, `Auction created for bike ${data.bikeId}`);

  await AuditLog.create({
    actor: createdBy,
    action: 'CREATE_AUCTION',
    entityType: 'AUCTION',
    entityId: auction.id,
    metadata: { bikeId: data.bikeId, startingPrice: data.startingPrice },
  });

  return auction;
}

async function getAuctionById(id) {
  const auction = await Auction.findByPk(id, {
    include: [
      { model: Bike, as: 'bike' },
      { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'winner', attributes: ['id', 'name', 'email'] },
    ],
  });
  return auction;
}

async function listAuctions(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.minPrice || filters.maxPrice) {
    where.startingPrice = {};
    if (filters.minPrice) where.startingPrice[Op.gte] = filters.minPrice;
    if (filters.maxPrice) where.startingPrice[Op.lte] = filters.maxPrice;
  }

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const include = [
    { model: Bike, as: 'bike' },
    { model: User, as: 'winner', attributes: ['id', 'name', 'email'] },
  ];

  if (filters.make) {
    include[0].where = { make: { [Op.like]: `%${filters.make}%` } };
  }

  const { rows: auctions, count: total } = await Auction.findAndCountAll({
    where,
    include,
    offset,
    limit,
    order: [['createdAt', 'DESC']],
    distinct: true,
  });

  return {
    auctions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function updateAuction(id, data) {
  const auction = await Auction.findByPk(id);
  if (!auction) {
    const error = new Error('Auction not found');
    error.statusCode = 404;
    throw error;
  }

  if (!['DRAFT', 'SCHEDULED'].includes(auction.status)) {
    const error = new Error('Cannot update auction in current status');
    error.statusCode = 400;
    throw error;
  }

  await auction.update(data);
  return auction;
}

async function publishAuction(id, adminId) {
  const auction = await Auction.findByPk(id);
  if (!auction) {
    const error = new Error('Auction not found');
    error.statusCode = 404;
    throw error;
  }

  if (auction.status !== 'DRAFT') {
    const error = new Error('Only DRAFT auctions can be published');
    error.statusCode = 400;
    throw error;
  }

  await auction.update({ status: 'SCHEDULED' });

  logger.info({
    event: 'auction_published',
    auctionId: auction.id,
    bikeId: auction.bikeId,
    status: 'SCHEDULED',
    publishedBy: adminId,
  }, `Auction ${auction.id} published`);

  await AuditLog.create({
    actor: adminId,
    action: 'PUBLISH_AUCTION',
    entityType: 'AUCTION',
    entityId: auction.id,
    metadata: { status: 'SCHEDULED' },
  });

  return auction;
}

async function cancelAuction(id, adminId) {
  const auction = await Auction.findByPk(id);
  if (!auction) {
    const error = new Error('Auction not found');
    error.statusCode = 404;
    throw error;
  }

  if (['ENDED', 'SETTLED', 'CANCELLED'].includes(auction.status)) {
    const error = new Error('Cannot cancel auction in current status');
    error.statusCode = 400;
    throw error;
  }

  const previousStatus = auction.status;
  await auction.update({ status: 'CANCELLED' });

  logger.info({
    event: 'auction_cancelled',
    auctionId: auction.id,
    bikeId: auction.bikeId,
    previousStatus,
    cancelledBy: adminId,
  }, `Auction ${auction.id} cancelled`);

  await AuditLog.create({
    actor: adminId,
    action: 'CANCEL_AUCTION',
    entityType: 'AUCTION',
    entityId: auction.id,
    metadata: { previousStatus },
  });

  const redis = getRedisClient();
  await redis.del(`auction:${id}`);

  return auction;
}

async function transitionAuctions() {
  const now = new Date();

  const [scheduledActivated] = await Auction.update(
    { status: 'LIVE' },
    {
      where: {
        status: 'SCHEDULED',
        startTime: { [Op.lte]: now },
      },
    }
  );

  const liveToEnded = await Auction.findAll({
    where: {
      status: 'LIVE',
      endTime: { [Op.lte]: now },
    },
  });

  let endedCount = 0;
  for (const auction of liveToEnded) {
    await auction.update({ status: 'ENDED' });
    const redis = getRedisClient();
    await redis.del(`auction:${auction.id}`);

    logger.info({
      event: 'auction_ended',
      auctionId: auction.id,
      bikeId: auction.bikeId,
      status: 'ENDED',
    }, `Auction ${auction.id} ended`);

    endedCount++;
  }

  await updateActiveAuctionsGauge();

  if (scheduledActivated > 0 || endedCount > 0) {
    logger.info({
      event: 'auction_status_transition',
      scheduled_to_live: scheduledActivated,
      live_to_ended: endedCount,
    }, `Transition complete: ${scheduledActivated} activated, ${endedCount} ended`);
  } else {
    logger.debug({ event: 'auction_scheduler_heartbeat' }, 'No auction transitions needed');
  }

  return { scheduledToLive: scheduledActivated, liveToEnded: endedCount };
}

async function updateActiveAuctionsGauge() {
  const count = await Auction.count({ where: { status: 'LIVE' } });
  activeAuctions.set(count);
}

async function settleAuction(id, adminId) {
  const auction = await Auction.findByPk(id);
  if (!auction) {
    const error = new Error('Auction not found');
    error.statusCode = 404;
    throw error;
  }

  if (auction.status !== 'ENDED') {
    const error = new Error('Only ENDED auctions can be settled');
    error.statusCode = 400;
    throw error;
  }

  const reserveMet = !auction.reservePrice || parseFloat(auction.currentHighestBid) >= parseFloat(auction.reservePrice);

  if (reserveMet && auction.currentHighestBidderId) {
    await auction.update({ status: 'SETTLED' });
  } else {
    await auction.update({ status: 'CANCELLED' });
  }

  logger.info({
    event: 'auction_settled',
    auctionId: auction.id,
    bikeId: auction.bikeId,
    status: auction.status,
    winningBid: auction.currentHighestBid,
    winnerId: auction.currentHighestBidderId,
    settledBy: adminId,
  }, `Auction ${auction.id} settled as ${auction.status}`);

  await AuditLog.create({
    actor: adminId,
    action: 'SETTLE_AUCTION',
    entityType: 'AUCTION',
    entityId: auction.id,
    metadata: { finalStatus: auction.status, winningBid: auction.currentHighestBid },
  });

  return auction;
}

module.exports = {
  createAuction,
  getAuctionById,
  listAuctions,
  updateAuction,
  publishAuction,
  cancelAuction,
  transitionAuctions,
  settleAuction,
  updateActiveAuctionsGauge,
};
