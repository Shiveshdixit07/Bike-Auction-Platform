const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bid = sequelize.define('Bid', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    auctionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'auction_id',
      references: {
        model: 'auctions',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    placedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'placed_at',
    },
    status: {
      type: DataTypes.ENUM('ACCEPTED', 'REJECTED'),
      allowNull: false,
    },
    rejectionReason: {
      type: DataTypes.STRING(500),
      field: 'rejection_reason',
    },
  }, {
    tableName: 'bids',
    timestamps: true,
    underscored: true,
  });

  return Bid;
};
