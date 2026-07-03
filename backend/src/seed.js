const { User, Bike, Auction, Bid, AuditLog, sequelize } = require('./models');

async function seed() {
  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Connected to database');

  console.log('Syncing models...');
  await sequelize.sync({ force: true });
  console.log('Models synced');

  console.log('Seeding data...');

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@bikeauction.com',
    passwordHash: 'admin123',
    role: 'ADMIN',
  });

  const buyer1 = await User.create({
    name: 'John Buyer',
    email: 'john@bikeauction.com',
    passwordHash: 'buyer123',
    role: 'BUYER',
  });

  const buyer2 = await User.create({
    name: 'Jane Buyer',
    email: 'jane@bikeauction.com',
    passwordHash: 'buyer123',
    role: 'BUYER',
  });

  console.log('Users created:', { admin: admin.id, buyer1: buyer1.id, buyer2: buyer2.id });

  const bike1 = await Bike.create({
    title: '2022 Honda CBR600RR',
    description: 'Excellent condition sport bike, low mileage, well maintained.',
    images: ['https://bike.net/res/media/img/oy800/ref/39d/104523.jpg'],
    make: 'Honda',
    model: 'CBR600RR',
    year: 2022,
    mileage: 3500,
    condition: 'EXCELLENT',
    ownerNotes: 'Always garaged, recent oil change',
  });

  const bike2 = await Bike.create({
    title: '2020 Yamaha MT-07',
    description: 'Great commuter bike, comfortable and reliable.',
    images: ['https://cloudfront-us-east-1.images.arcpublishing.com/octane/53ZHDNVO6ZGMJJE775VGTKSLRY.jpg'],
    make: 'Yamaha',
    model: 'MT-07',
    year: 2020,
    mileage: 8000,
    condition: 'GOOD',
    ownerNotes: 'Minor scratches on fairing',
  });

  const bike3 = await Bike.create({
    title: '2021 Kawasaki Ninja 400',
    description: 'Perfect beginner sport bike, low miles.',
    images: ['https://images.drivespark.com/img/2020/10/2021-kawasaki-ninja-400-front-style-1601886576.jpg'],
    make: 'Kawasaki',
    model: 'Ninja 400',
    year: 2021,
    mileage: 2000,
    condition: 'EXCELLENT',
    ownerNotes: 'Like new condition',
  });

  console.log('Bikes created:', 3);

  const now = new Date();

  const auction1 = await Auction.create({
    bikeId: bike1.id,
    status: 'LIVE',
    startTime: new Date(now.getTime() - 3600000),
    endTime: new Date(now.getTime() + 7200000),
    startingPrice: 5000,
    bidIncrement: 100,
    reservePrice: 7000,
    currentHighestBid: 5500,
    currentHighestBidderId: buyer1.id,
    createdBy: admin.id,
    extendOnLastMinuteBid: true,
  });

  const auction2 = await Auction.create({
    bikeId: bike2.id,
    status: 'SCHEDULED',
    startTime: new Date(now.getTime() + 86400000),
    endTime: new Date(now.getTime() + 172800000),
    startingPrice: 3000,
    bidIncrement: 50,
    reservePrice: 4000,
    createdBy: admin.id,
    extendOnLastMinuteBid: true,
  });

  const auction3 = await Auction.create({
    bikeId: bike3.id,
    status: 'DRAFT',
    startTime: new Date(now.getTime() + 259200000),
    endTime: new Date(now.getTime() + 345600000),
    startingPrice: 4000,
    bidIncrement: 75,
    createdBy: admin.id,
    extendOnLastMinuteBid: true,
  });

  console.log('Auctions created:', 3);

  await Bid.bulkCreate([
    {
      auctionId: auction1.id,
      userId: buyer1.id,
      amount: 5100,
      status: 'ACCEPTED',
    },
    {
      auctionId: auction1.id,
      userId: buyer2.id,
      amount: 5300,
      status: 'ACCEPTED',
    },

  ]);

  console.log('Bids created:', 3);

  console.log('\nSeed completed successfully!');
  console.log('\nDemo Credentials:');
  console.log('Admin: admin@bikeauction.com / admin123');
  console.log('Buyer 1: john@bikeauction.com / buyer123');
  console.log('Buyer 2: jane@bikeauction.com / buyer123');

  await sequelize.close();
  console.log('Database connection closed');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
