const config = require('../../config');

function calculateMinimumBid(auction) {
  const currentBid = parseFloat(auction.currentHighestBid) || 0;
  const increment = parseFloat(auction.bidIncrement);
  const starting = parseFloat(auction.startingPrice);
  if (currentBid === 0) {
    return starting;
  }
  return currentBid + increment;
}

function isAuctionLive(auction, now = new Date()) {
  return auction.status === 'LIVE' && now >= auction.startTime && now <= auction.endTime;
}

function isConsecutiveSelfBid(auction, bidderId) {
  if (!auction.currentHighestBidderId) return false;
  const current = String(auction.currentHighestBidderId).replace(/-/g, '');
  const bidder = String(bidderId).replace(/-/g, '');
  return current === bidder;
}

function shouldExtendEndTime(auction, bidTime = new Date()) {
  if (!auction.extendOnLastMinuteBid) return false;
  const timeRemaining = (auction.endTime - bidTime) / 1000;
  return timeRemaining <= config.antiSnipe.extensionSeconds;
}

function calculateNewEndTime(currentEndTime, bidTime = new Date()) {
  const extensionMs = config.antiSnipe.extensionSeconds * 1000;
  const newEnd = new Date(Math.max(currentEndTime.getTime(), bidTime.getTime() + extensionMs));
  return newEnd;
}

function validateBid(bidAmount, auction, bidderId, bidTime = new Date()) {
  if (!isAuctionLive(auction, bidTime)) {
    return {
      valid: false,
      reason: 'Auction is not currently live',
    };
  }

  const minimumBid = calculateMinimumBid(auction);
  if (bidAmount < minimumBid) {
    return {
      valid: false,
      reason: `Bid must be at least $${minimumBid}. Current highest: $${auction.currentHighestBid}`,
    };
  }

  if (isConsecutiveSelfBid(auction, bidderId)) {
    return {
      valid: false,
      reason: 'Cannot outbid yourself consecutively',
    };
  }

  return { valid: true };
}

module.exports = {
  calculateMinimumBid,
  isAuctionLive,
  isConsecutiveSelfBid,
  shouldExtendEndTime,
  calculateNewEndTime,
  validateBid,
};
