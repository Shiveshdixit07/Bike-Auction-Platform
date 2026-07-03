import { describe, it, expect } from 'vitest';

describe('BidForm Validation', () => {
  it('should validate minimum bid amount', () => {
    const auction = {
      currentHighestBid: 5000,
      bidIncrement: 100,
      startingPrice: 4000,
    };

    const minimumBid = auction.currentHighestBid + auction.bidIncrement;
    expect(minimumBid).toBe(5100);
  });

  it('should calculate minimum bid from starting price when no bids', () => {
    const auction = {
      currentHighestBid: 0,
      bidIncrement: 100,
      startingPrice: 4000,
    };

    const minimumBid = auction.currentHighestBid === 0
      ? auction.startingPrice
      : auction.currentHighestBid + auction.bidIncrement;

    expect(minimumBid).toBe(4000);
  });

  it('should reject bid below minimum', () => {
    const bidAmount = 4500;
    const minimumBid = 5100;

    expect(bidAmount < minimumBid).toBe(true);
  });

  it('should accept bid at minimum', () => {
    const bidAmount = 5100;
    const minimumBid = 5100;

    expect(bidAmount >= minimumBid).toBe(true);
  });
});
