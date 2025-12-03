#!/usr/bin/env node
/**
 * Test script for SQLite transactional database
 * Run this to verify that transactional data is properly saved to SQLite
 */
require('dotenv').config();
const { initializeTransactionalDatabase, getDatabaseStats } = require('./initSQLiteDatabase');

async function testSQLiteTransactions() {
  console.log('🧪 Testing SQLite Transactional Database Setup');
  console.log('================================================\n');
  
  try {
    // Initialize database
    const initResult = await initializeTransactionalDatabase();
    console.log('\n📊 Database Initialization Result:');
    console.log(JSON.stringify(initResult, null, 2));
    
    // Get current statistics
    console.log('\n📈 Current Database Statistics:');
    const stats = await getDatabaseStats();
    console.log(JSON.stringify(stats, null, 2));
    
    // Test transaction creation
    console.log('\n💳 Testing Transaction Creation...');
    await testTransactionCreation();
    
    // Final statistics
    console.log('\n📈 Final Database Statistics:');
    const finalStats = await getDatabaseStats();
    console.log(JSON.stringify(finalStats, null, 2));
    
    console.log('\n✅ SQLite transactional database test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

async function testTransactionCreation() {
  const { User, Order, Payment } = require('../models/postgres');
  
  try {
    // Create a test transaction sequence
    console.log('   Creating test user...');
    const testUser = await User.create({
      email: `test-${Date.now()}@example.com`,
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      firstName: 'Test',
      lastName: 'User',
      userType: 'florist',
      businessName: 'Test Florist Shop',
      businessAddress: {
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '12-345',
        country: 'Poland'
      },
      isActive: true,
      emailVerified: true
    });
    console.log(`   ✅ User created with ID: ${testUser.id}`);
    
    // Create test order
    console.log('   Creating test order...');
    const testOrder = await Order.create({
      userId: testUser.id,
      orderNumber: `TEST-${Date.now()}`,
      status: 'pending',
      items: [
        {
          flowerId: 'test-flower-123',
          name: 'Test Roses',
          quantity: 10,
          pricePerStem: 3.00,
          total: 30.00
        }
      ],
      subtotal: 30.00,
      shippingCost: 10.00,
      tax: 8.00,
      total: 48.00,
      currency: 'PLN',
      shippingAddress: {
        name: 'Test User',
        street: 'Test Street 123',
        city: 'Test City',
        postalCode: '12-345',
        country: 'Poland'
      },
      paymentStatus: 'pending'
    });
    console.log(`   ✅ Order created with ID: ${testOrder.id}`);
    
    // Create test payment
    console.log('   Creating test payment...');
    const testPayment = await Payment.create({
      orderId: testOrder.id,
      userId: testUser.id,
      amount: 48.00,
      currency: 'PLN',
      method: 'card',
      status: 'completed',
      transactionId: `TEST-TXN-${Date.now()}`,
      metadata: {
        testTransaction: true,
        provider: 'test-payment-system'
      }
    });
    console.log(`   ✅ Payment created with ID: ${testPayment.id}`);
    
    // Test relationship queries
    console.log('   Testing relationships...');
    const userWithOrders = await User.findByPk(testUser.id, {
      include: ['orders', 'payments']
    });
    console.log(`   ✅ User has ${userWithOrders.orders.length} orders and ${userWithOrders.payments.length} payments`);
    
    const orderWithPayments = await Order.findByPk(testOrder.id, {
      include: ['payments']
    });
    console.log(`   ✅ Order has ${orderWithPayments.payments.length} payments`);
    
  } catch (error) {
    console.error('   ❌ Transaction test failed:', error);
    throw error;
  }
}

// Run the test
testSQLiteTransactions();