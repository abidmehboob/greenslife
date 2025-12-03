const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shippingCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'PLN'
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('card', 'transfer', 'payu'),
    allowNull: true
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;