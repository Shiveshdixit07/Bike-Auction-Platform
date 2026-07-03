const {
  calculateMinimumBid,
  isAuctionLive,
  isConsecutiveSelfBid,
  shouldExtendEndTime,
  calculateNewEndTime,
  validateBid,
} = require('../src/modules/bids/biddingEngine');

describe('Bidding Engine', () => {
  describe('calculateMinimumBid', () => {
    it('should return starting price when no bids placed', () => {
      const auction = { currentHighestBid: 0, startingPrice: 5000, bidIncrement: 100 };
      expect(calculateMinimumBid(auction)).toBe(5000);
    });

    it('should return current highest + increment when bids exist', () => {
      const auction = { currentHighestBid: 5500, startingPrice: 5000, bidIncrement: 100 };
      expect(calculateMinimumBid(auction)).toBe(5600);
    });
  });

  describe('isAuctionLive', () => {
    it('should return true for live auction within time window', () => {
      const now = new Date();
      const auction = {
        status: 'LIVE',
        startTime: new Date(now.getTime() - 3600000),
        endTime: new Date(now.getTime() + 3600000),
      };
      expect(isAuctionLive(auction, now)).toBe(true);
    });

    it('should return false for non-live status', () => {
      const auction = { status: 'SCHEDULED', startTime: new Date(), endTime: new Date() };
      expect(isAuctionLive(auction)).toBe(false);
    });

    it('should return false when auction has ended', () => {
      const auction = {
        status: 'LIVE',
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 3600000),
      };
      expect(isAuctionLive(auction)).toBe(false);
    });
  });

  describe('isConsecutiveSelfBid', () => {
    it('should return true when bidder is current highest bidder', () => {
      const auction = { currentHighestBidderId: 'user123' };
      expect(isConsecutiveSelfBid(auction, 'user123')).toBe(true);
    });

    it('should return false when different bidder', () => {
      const auction = { currentHighestBidderId: 'user123' };
      expect(isConsecutiveSelfBid(auction, 'user456')).toBe(false);
    });

    it('should return false when no current bidder', () => {
      const auction = { currentHighestBidderId: null };
      expect(isConsecutiveSelfBid(auction, 'user123')).toBe(false);
    });
  });

  describe('shouldExtendEndTime', () => {
    it('should return true when bid is within last 30 seconds', () => {
      const auction = {
        extendOnLastMinuteBid: true,
        endTime: new Date(Date.now() + 20000),
      };
      expect(shouldExtendEndTime(auction)).toBe(true);
    });

    it('should return false when extendOnLastMinuteBid is disabled', () => {
      const auction = {
        extendOnLastMinuteBid: false,
        endTime: new Date(Date.now() + 20000),
      };
      expect(shouldExtendEndTime(auction)).toBe(false);
    });

    it('should return false when more than 30 seconds remaining', () => {
      const auction = {
        extendOnLastMinuteBid: true,
        endTime: new Date(Date.now() + 60000),
      };
      expect(shouldExtendEndTime(auction)).toBe(false);
    });
  });

  describe('validateBid', () => {
    const baseAuction = {
      status: 'LIVE',
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() + 3600000),
      startingPrice: 5000,
      bidIncrement: 100,
      currentHighestBid: 0,
      currentHighestBidderId: null,
    };

    it('should accept valid bid meeting minimum', () => {
      const result = validateBid(5000, baseAuction, 'user1');
      expect(result.valid).toBe(true);
    });

    it('should reject bid below minimum', () => {
      const result = validateBid(4000, baseAuction, 'user1');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Bid must be at least');
    });

    it('should reject bid on non-live auction', () => {
      const auction = { ...baseAuction, status: 'SCHEDULED' };
      const result = validateBid(5000, auction, 'user1');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not currently live');
    });

    it('should reject consecutive self-bid', () => {
      const auction = { ...baseAuction, currentHighestBidderId: 'user1' };
      const result = validateBid(5100, auction, 'user1');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Cannot outbid yourself');
    });
  });
});
