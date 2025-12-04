const express = require('express');
const router = express.Router();
const { optionalAuthenticate, authenticateToken } = require('../middleware/auth');
const { Order, User } = require('../models/postgres');
const { categories, flowers: carnationFlowers } = require('../data/carnationCatalog');

// Get dashboard statistics (role-based)
router.get('/dashboard', optionalAuthenticate, async (req, res) => {
  try {
    const userType = req.user?.userType || 'guest';
    const userId = req.user?.id;

    let stats = {};

    if (userType === 'wholesaler') {
      // Wholesaler-specific stats
      const userOrders = userId ? await Order.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      }) : [];

      const recentOrders = userOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= thirtyDaysAgo;
      });

      const totalRevenue = recentOrders.reduce((sum, order) => sum + parseFloat(order.totalValue || 0), 0);
      const activeOrders = userOrders.filter(order => ['pending', 'processing'].includes(order.status)).length;
      const pendingDeliveries = userOrders.filter(order => order.status === 'shipped').length;

      stats = {
        totalInventory: carnationFlowers.length,
        activeOrders,
        pendingDeliveries,
        monthlyRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders: userOrders.length,
        currency: 'EUR'
      };

    } else if (userType === 'florist') {
      // Florist-specific stats
      const userOrders = userId ? await Order.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      }) : [];

      const recentOrders = userOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= thirtyDaysAgo;
      });

      const totalSpent = recentOrders.reduce((sum, order) => sum + parseFloat(order.totalValue || 0), 0);
      const activeOrders = userOrders.filter(order => ['pending', 'processing'].includes(order.status)).length;
      const completedOrders = userOrders.filter(order => order.status === 'completed').length;

      stats = {
        availableFlowers: carnationFlowers.length,
        activeOrders,
        completedOrders,
        monthlySpent: Math.round(totalSpent * 100) / 100,
        totalOrders: userOrders.length,
        currency: 'EUR'
      };

    } else {
      // Admin or guest stats
      const [totalUsers, totalOrders] = await Promise.all([
        User.count(),
        Order.count()
      ]);

      const allOrders = await Order.findAll({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      const totalRevenue = allOrders.reduce((sum, order) => sum + parseFloat(order.totalValue || 0), 0);

      stats = {
        totalUsers,
        totalOrders,
        availableFlowers: carnationFlowers.length,
        monthlyRevenue: Math.round(totalRevenue * 100) / 100,
        currency: 'EUR'
      };
    }

    res.json({
      success: true,
      userType,
      stats
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      stats: {
        totalInventory: 0,
        activeOrders: 0,
        pendingDeliveries: 0,
        monthlyRevenue: 0
      }
    });
  }
});

// Get user-specific order statistics
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;

    const orders = await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    const recentOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return orderDate >= thirtyDaysAgo;
    });

    const monthlyValue = recentOrders.reduce((sum, order) => sum + parseFloat(order.totalValue || 0), 0);

    res.json({
      success: true,
      userType,
      orders: stats,
      monthlyValue: Math.round(monthlyValue * 100) / 100,
      currency: 'EUR'
    });

  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics'
    });
  }
});

module.exports = router;