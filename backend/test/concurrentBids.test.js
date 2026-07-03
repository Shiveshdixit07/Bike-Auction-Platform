const { User, Bike, Auction, Bid, sequelize } = require('../src/models');
const { placeBid } = require('../src/modules/bids/service');

let user1, user2, auction;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  user1 = await User.create({
    name: 'User 1',
    email: 'user1@test.com',
    passwordHash: 'password123',
    role: 'BUYER',
  });

  user2 = await User.create({
    name: 'User 2',
    email: 'user2@test.com',
    passwordHash: 'password123',
    role: 'BUYER',
  });

  const bike = await Bike.create({
    title: 'Test Bike',
    description: 'Test',
    make: 'Honda',
    model: 'CBR',
    year: 2023,
    mileage: 1000,
    condition: 'EXCELLENT',
  });

  auction = await Auction.create({
    bikeId: bike.id,
    status: 'LIVE',
    startTime: new Date(Date.now() - 3600000),
    endTime: new Date(Date.now() + 7200000),
    startingPrice: 5000,
    bidIncrement: 100,
    createdBy: user1.id,
  });
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  await Bid.destroy({ where: { auctionId: auction.id } });
  await Auction.update(
    {
      currentHighestBid: 0,
      currentHighestBidderId: null,
      status: 'LIVE',
      version: 1,
    },
    { where: { id: auction.id } }
  );
});

describe('Concurrent Bids', () => {
  const itIfRedis = process.env.REDIS_URL ? it : it.skip;

  itIfRedis('should handle concurrent bids correctly', async () => {
    const bidPromises = [
      placeBid(auction.id, user1.id, 5100),
      placeBid(auction.id, user2.id, 5200),
      placeBid(auction.id, user1.id, 5300),
    ];

    const results = await Promise.allSettled(bidPromises);

    const accepted = results.filter((r) => r.status === 'fulfilled' && !r.value.rejected);

    expect(accepted.length).toBeGreaterThanOrEqual(1);

    const updatedAuction = await Auction.findByPk(auction.id);
    expect(parseFloat(updatedAuction.currentHighestBid)).toBeGreaterThanOrEqual(5100);
  });

  itIfRedis('should reject bid below current highest', async () => {
    await placeBid(auction.id, user1.id, 5500);

    const result = await placeBid(auction.id, user2.id, 5100);
    expect(result.rejected).toBe(true);
    expect(result.reason).toContain('Bid must be at least');
  });

  itIfRedis('should reject self-bid', async () => {
    await placeBid(auction.id, user1.id, 5000);

    const result = await placeBid(auction.id, user1.id, 5100);
    expect(result.rejected).toBe(true);
    expect(result.reason).toContain('Cannot outbid yourself');
  });
});
