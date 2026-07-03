const { Op } = require('sequelize');
const { Auction, Bid, User, AuditLog } = require('../../models');

async function getDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalAuctions,
    activeAuctions,
    totalBids,
    bidsToday,
    totalUsers,
    recentBids,
    revenueResult,
  ] = await Promise.all([
    Auction.count(),
    Auction.count({ where: { status: 'LIVE' } }),
    Bid.count(),
    Bid.count({
      where: {
        placedAt: { [Op.gte]: today },
      },
    }),
    User.count(),
    Bid.findAll({
      include: [
        { model: User, as: 'bidder', attributes: ['id', 'name'] },
        { model: Auction, as: 'auction' },
      ],
      order: [['placedAt', 'DESC']],
      limit: 10,
    }),
    Auction.sum('currentHighestBid', {
      where: { status: { [Op.in]: ['LIVE', 'ENDED'] } },
    }),
  ]);

  return {
    totalAuctions,
    activeAuctions,
    totalBids,
    bidsToday,
    totalUsers,
    revenueInProgress: revenueResult || 0,
    recentBids,
  };
}

module.exports = { getDashboard };
