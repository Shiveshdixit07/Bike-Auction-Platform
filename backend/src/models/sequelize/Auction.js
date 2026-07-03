const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Auction = sequelize.define('Auction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bikeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'bike_id',
      references: {
        model: 'bikes',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'SETTLED', 'CANCELLED'),
      defaultValue: 'DRAFT',
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time',
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_time',
    },
    startingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'starting_price',
      validate: {
        min: 0,
      },
    },
    bidIncrement: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'bid_increment',
      validate: {
        min: 1,
      },
    },
    reservePrice: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'reserve_price',
      validate: {
        min: 0,
      },
    },
    currentHighestBid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'current_highest_bid',
    },
    currentHighestBidderId: {
      type: DataTypes.UUID,
      field: 'current_highest_bidder_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    extendOnLastMinuteBid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'extend_on_last_minute_bid',
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  }, {
    tableName: 'auctions',
    timestamps: true,
    underscored: true,
  });

  return Auction;
};
