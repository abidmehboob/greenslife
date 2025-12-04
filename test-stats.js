const { sequelize } = require('./config/database');

// Test the stats logic directly
async function testStats() {
  try {
    console.log('=== Testing Stats Logic Directly ===');
    
    // Initialize database connection
    await sequelize.authenticate();
    console.log('✓ Database connected');
    
    // Import models
    const User = require('./models/postgres/User');
    const Order = require('./models/postgres/Order');
    
    console.log('✓ Models loaded');
    
    // Test guest stats (should be like admin)
    console.log('\n--- Guest/Admin Stats ---');
    
    const totalUsers = await User.count();
    const totalOrders = await Order.count();
    
    console.log('Total users:', totalUsers);
    console.log('Total orders:', totalOrders);
    
    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = await Order.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: thirtyDaysAgo
        }
      }
    });
    
    console.log('Recent orders count:', recentOrders.length);
    
    const totalRevenue = recentOrders.reduce((sum, order) => {
      const amount = parseFloat(order.total || 0);
      console.log(`  Order ${order.orderNumber}: €${amount} (${order.status})`);
      return sum + amount;
    }, 0);
    
    console.log('Total revenue: €' + Math.round(totalRevenue * 100) / 100);
    
    // Test carnation flowers fallback (like we use for inventory)
    const carnationFlowers = Array.from({length: 16}, (_, i) => ({
      id: `carnation-${i + 1}`,
      name: `Carnation ${i + 1}`,
      category: 'carnations'
    }));
    
    const stats = {
      totalUsers,
      totalOrders,
      availableFlowers: carnationFlowers.length,
      monthlyRevenue: Math.round(totalRevenue * 100) / 100,
      currency: 'EUR'
    };
    
    console.log('\nFinal stats object:');
    console.log(JSON.stringify(stats, null, 2));
    
  } catch (error) {
    console.error('Error testing stats:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testStats();