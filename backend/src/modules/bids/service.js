const { Op } = require('sequelize');
const { Bid, Auction, AuditLog, User } = require('../../models');
const { getRedisClient } = require('../../config/redis');
const { validateBid, shouldExtendEndTime, calculateNewEndTime } = require('./biddingEngine');
const { bidsPlaced } = require('../../common/metrics');
const logger = require('../../config/logger');

async function placeBid(auctionId, userId, amount, io) {
  const redis = getRedisClient();
  const lockKey = `lock:auction:${auctionId}`;

  const acquired = await redis.set(lockKey, userId, 'NX', 'PX', 5000);
  if (!acquired) {
    logger.warn({
      event: 'bid_lock_busy',
      auctionId,
      bidderId: userId,
    }, 'Could not acquire bid lock');
    const error = new Error('Auction is busy, please try again');
    error.statusCode = 409;
    throw error;
  }

  try {
    const auction = await Auction.findByPk(auctionId);
    if (!auction) {
      const error = new Error('Auction not found');
      error.statusCode = 404;
      throw error;
    }

    const validation = validateBid(amount, auction, userId);
    if (!validation.valid) {
      const bid = await Bid.create({
        auctionId,
        userId,
        amount,
        status: 'REJECTED',
        rejectionReason: validation.reason,
      });

      logger.warn({
        event: 'bid_rejected',
        auctionId,
        bidderId: userId,
        amount,
        reason: validation.reason,
      }, `Bid rejected: ${validation.reason}`);

      bidsPlaced.inc({ status: 'rejected' });

      return { bid, auction, rejected: true, reason: validation.reason };
    }

    const newHighestBid = amount;
    const updateData = {
      currentHighestBid: newHighestBid,
      currentHighestBidderId: userId,
      version: auction.version + 1,
    };

    let newEndTime = null;
    if (shouldExtendEndTime(auction)) {
      newEndTime = calculateNewEndTime(auction.endTime);
      updateData.endTime = newEndTime;
    }

    const [updated] = await Auction.update(updateData, {
      where: {
        id: auctionId,
        version: auction.version,
        status: 'LIVE',
      },
    });

    if (updated === 0) {
      logger.warn({
        event: 'bid_conflict',
        auctionId,
        bidderId: userId,
        amount,
      }, 'Bid conflict — another bid placed first');
      const error = new Error('Bid conflict - another bid was placed first');
      error.statusCode = 409;
      throw error;
    }

    const updatedAuction = await Auction.findByPk(auctionId);

    const bid = await Bid.create({
      auctionId,
      userId,
      amount,
      status: 'ACCEPTED',
    });

    logger.info({
      event: 'bid_accepted',
      auctionId,
      bidderId: userId,
      amount,
      previousHighest: auction.currentHighestBid,
      newVersion: auction.version + 1,
      antiSnipingApplied: !!newEndTime,
    }, `Bid accepted: ${amount} on auction ${auctionId}`);

    await AuditLog.create({
      actor: userId,
      action: 'PLACE_BID',
      entityType: 'BID',
      entityId: bid.id,
      metadata: { auctionId, amount, previousHighest: auction.currentHighestBid },
    });

    bidsPlaced.inc({ status: 'accepted' });

    const redis2 = getRedisClient();
    await redis2.del(`auction:${auctionId}`);

    if (io) {
      io.to(`auction:${auctionId}`).emit('bid_placed', {
        auctionId,
        amount,
        bidderId: userId.toString().slice(-4),
        newEndTime: newEndTime || updatedAuction.endTime,
        timestamp: new Date().toISOString(),
      });
    }

    if (newEndTime) {
      logger.info({
        event: 'auction_extended',
        auctionId,
        previousEndTime: auction.endTime,
        newEndTime,
        reason: 'anti_snipe',
      }, `Auction ${auctionId} end time extended`);
    }

    return { bid, auction: updatedAuction, rejected: false };
  } finally {
    await redis.del(lockKey);
  }
}

async function getBidsByAuction(auctionId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const { rows: bids, count: total } = await Bid.findAndCountAll({
    where: { auctionId, status: 'ACCEPTED' },
    include: [{ model: User, as: 'bidder', attributes: ['id', 'name'] }],
    offset,
    limit,
    order: [['placedAt', 'DESC']],
  });

  return {
    bids,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function getBidsByUser(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const { rows: bids, count: total } = await Bid.findAndCountAll({
    where: { userId },
    include: [{ model: Auction, as: 'auction' }],
    offset,
    limit,
    order: [['placedAt', 'DESC']],
  });

  return {
    bids,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

module.exports = { placeBid, getBidsByAuction, getBidsByUser };
