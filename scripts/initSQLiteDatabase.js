const { sequelize } = require('../config/database');
const { User, Order, Payment } = require('../models/postgres');

/**
 * Initialize SQLite database for transactional data
 * This script creates the necessary tables and relationships
 */
async function initializeTransactionalDatabase() {
  try {
    console.log('Initializing SQLite database for transactional data...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ SQLite connection established successfully.');
    
    // Create tables without altering existing structure
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ All SQLite tables synchronized successfully.');
    
    // Check if we have any existing users
    const userCount = await User.count();
    console.log(`📊 Current users in SQLite database: ${userCount}`);
    
    // Create test transactional data if database is empty
    if (userCount === 0) {
      await createTestTransactionalData();
    }
    
    console.log('✅ SQLite transactional database initialization complete!');
    
    return {
      success: true,
      tablesCreated: ['users', 'orders', 'payments'],
      relationships: ['User -> Orders', 'User -> Payments', 'Order -> Payments']
    };
    
  } catch (error) {
    console.error('❌ Error initializing SQLite database:', error);
    throw error;
  }
}

/**
 * Create test transactional data for development
 */
async function createTestTransactionalData() {
  try {
    console.log('Creating test transactional data...');
    
    // Create test users for different roles
    const testUsers = await User.bulkCreate([
      {
        email: 'wholesaler@test.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
        firstName: 'John',
        lastName: 'Smith',
        userType: 'wholesaler',
        businessName: 'Smith Wholesale Flowers',
        businessAddress: {
          street: 'ul. Kwiatowa 123',
          city: 'Warsaw',
          postalCode: '00-001',
          country: 'Poland'
        },
        phone: '+48123456789',
        isActive: true,
        emailVerified: true
      },
      {
        email: 'florist@test.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
        firstName: 'Anna',
        lastName: 'Kowalski',
        userType: 'florist',
        businessName: 'Kowalski Flower Shop',
        businessAddress: {
          street: 'ul. Różana 45',
          city: 'Krakow',
          postalCode: '30-001',
          country: 'Poland'
        },
        phone: '+48987654321',
        isActive: true,
        emailVerified: true
      },
      {
        email: 'admin@test.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
        firstName: 'System',
        lastName: 'Administrator',
        userType: 'admin',
        businessName: 'GreenLife Administration',
        businessAddress: {
          street: 'ul. Centralna 1',
          city: 'Warsaw',
          postalCode: '00-000',
          country: 'Poland'
        },
        isActive: true,
        emailVerified: true
      }
    ]);
    
    console.log(`✅ Created ${testUsers.length} test users`);
    
    // Create a sample order
    const sampleOrder = await Order.create({
      userId: testUsers[1].id, // Florist user
      orderNumber: 'ORD-' + Date.now(),
      status: 'pending',
      items: [
        {
          flowerId: 'sample-flower-id',
          name: 'Red Roses',
          quantity: 50,
          pricePerStem: 2.50,
          total: 125.00
        },
        {
          flowerId: 'sample-flower-id-2',
          name: 'White Carnations',
          quantity: 25,
          pricePerStem: 1.80,
          total: 45.00
        }
      ],
      subtotal: 170.00,
      shippingCost: 15.00,
      tax: 34.00,
      total: 219.00,
      currency: 'PLN',
      shippingAddress: {
        name: 'Anna Kowalski',
        street: 'ul. Różana 45',
        city: 'Krakow',
        postalCode: '30-001',
        country: 'Poland',
        phone: '+48987654321'
      },
      paymentStatus: 'pending'
    });
    
    console.log(`✅ Created sample order: ${sampleOrder.orderNumber}`);
    
    // Create a sample payment
    const samplePayment = await Payment.create({
      orderId: sampleOrder.id,
      userId: testUsers[1].id,
      amount: 219.00,
      currency: 'PLN',
      method: 'card',
      status: 'completed',
      transactionId: 'TXN-' + Date.now(),
      metadata: {
        paymentProvider: 'test',
        testMode: true
      }
    });
    
    console.log(`✅ Created sample payment: ${samplePayment.transactionId}`);
    
  } catch (error) {
    console.error('Error creating test transactional data:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  try {
    const stats = {
      users: await User.count(),
      orders: await Order.count(),
      payments: await Payment.count(),
      activeUsers: await User.count({ where: { isActive: true } }),
      verifiedUsers: await User.count({ where: { emailVerified: true } }),
      completedOrders: await Order.count({ where: { status: 'delivered' } }),
      totalRevenue: await Payment.sum('amount', { where: { status: 'completed' } }) || 0
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
}

module.exports = {
  initializeTransactionalDatabase,
  createTestTransactionalData,
  getDatabaseStats
};