const { Sequelize } = require('sequelize');
const config = require('../../config');
const logger = require('../../config/logger');

const SLOW_QUERY_THRESHOLD_MS = 100;

function sequelizeLogger(sql, executionTime) {
  const durationMs = typeof executionTime === 'number' ? executionTime : parseFloat(executionTime);

  if (Number.isNaN(durationMs)) return;

  if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
    logger.warn({
      event: 'slow_query',
      durationMs,
      sql: sql.substring(0, 500),
    }, `Slow query detected (${durationMs}ms)`);
  }
}

function sequelizeErrorLogger(err) {
  logger.error({
    event: 'query_error',
    err,
    sql: err.sql?.substring(0, 500),
    sqlState: err.sqlState,
    errno: err.errno,
  }, 'Sequelize query failed');
}

let sequelize;

if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });
} else {
  sequelize = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    {
      host: config.db.host,
      port: config.db.port,
      dialect: 'mysql',
      logging: config.nodeEnv === 'development' ? sequelizeLogger : false,
      logQueryParameters: false,
      benchmark: true,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        ssl: config.nodeEnv === 'production' ? {
          require: true,
          rejectUnauthorized: false,
        } : false,
      },
    }
  );
}

const User = require('./User')(sequelize);
const Bike = require('./Bike')(sequelize);
const Auction = require('./Auction')(sequelize);
const Bid = require('./Bid')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);

User.hasMany(Auction, { foreignKey: 'created_by', as: 'auctions' });
Auction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(Bid, { foreignKey: 'user_id', as: 'bids' });
Bid.belongsTo(User, { foreignKey: 'user_id', as: 'bidder' });

Auction.hasMany(Bid, { foreignKey: 'auction_id', as: 'bids' });
Bid.belongsTo(Auction, { foreignKey: 'auction_id', as: 'auction' });

Bike.hasOne(Auction, { foreignKey: 'bike_id', as: 'auction' });
Auction.belongsTo(Bike, { foreignKey: 'bike_id', as: 'bike' });

User.hasMany(AuditLog, { foreignKey: 'actor', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'actor', as: 'actorUser' });

Auction.belongsTo(User, { foreignKey: 'current_highest_bidder_id', as: 'winner' });

module.exports = {
  sequelize,
  User,
  Bike,
  Auction,
  Bid,
  AuditLog,
};
