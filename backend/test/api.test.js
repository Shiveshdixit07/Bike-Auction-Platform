const request = require('supertest');
const app = require('../src/app');
const { User, Bike, Auction, Bid, sequelize } = require('../src/models');

let adminToken;
let buyerToken;
let auctionId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await Bid.destroy({ where: {} });
  await Auction.destroy({ where: {} });
  await Bike.destroy({ where: {} });
  await User.destroy({ where: {} });

  const adminRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
  adminToken = adminRes.body.data.accessToken;

  await User.update({ role: 'ADMIN' }, { where: { email: 'admin@test.com' } });

  const buyerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Buyer', email: 'buyer@test.com', password: 'password123' });
  buyerToken = buyerRes.body.data.accessToken;
});

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('test@test.com');
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'admin@test.com', password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });
});

describe('Auction Endpoints', () => {
  let bikeId;

  beforeEach(async () => {
    const bikeRes = await request(app)
      .post('/api/v1/bikes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Bike',
        description: 'A test bike',
        make: 'Honda',
        model: 'CBR',
        year: 2023,
        mileage: 1000,
        condition: 'EXCELLENT',
      });
    bikeId = bikeRes.body.data.bike.id;
  });

  it('should create auction (admin only)', async () => {
    const res = await request(app)
      .post('/api/v1/auctions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bikeId,
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        startingPrice: 5000,
        bidIncrement: 100,
      });

    if (res.status !== 201) {
      console.error('Auction creation error:', JSON.stringify(res.body, null, 2));
    }
    expect(res.status).toBe(201);
    expect(res.body.data.auction.status).toBe('DRAFT');
    auctionId = res.body.data.auction.id;
  });

  it('should reject non-admin creating auction', async () => {
    const res = await request(app)
      .post('/api/v1/auctions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        bikeId,
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        startingPrice: 5000,
        bidIncrement: 100,
      });

    expect(res.status).toBe(403);
  });

  it('should list auctions', async () => {
    const res = await request(app).get('/api/v1/auctions');

    expect(res.status).toBe(200);
    expect(res.body.data.auctions).toBeDefined();
  });

  it('should publish auction', async () => {
    const createRes = await request(app)
      .post('/api/v1/auctions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bikeId,
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        startingPrice: 5000,
        bidIncrement: 100,
      });
    const id = createRes.body.data.auction.id;

    const res = await request(app)
      .post(`/api/v1/auctions/${id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.auction.status).toBe('SCHEDULED');
  });
});

describe('Health Endpoints', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should return readiness status', async () => {
    const res = await request(app).get('/health/ready');
    expect([200, 503]).toContain(res.status);
    expect(['ok', 'degraded']).toContain(res.body.status);
  });
});
