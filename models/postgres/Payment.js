const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'PLN'
  },
  method: {
    type: DataTypes.ENUM('card', 'transfer', 'payu', 'stripe'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  providerTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  providerResponse: {
    type: DataTypes.JSON,
    allowNull: true
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  refundDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;