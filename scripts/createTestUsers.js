const bcrypt = require('bcryptjs');
const { User } = require('../models/postgres');
const { connectPostgreSQL } = require('../config/database');

// Test users data
const testUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'wholesaler@test.com',
    password: 'password123',
    userType: 'wholesaler',
    businessName: 'Wholesale Flowers Inc.',
    phone: '+1-555-0101',
    businessAddress: {
      street: '123 Business Street',
      city: 'Warsaw',
      postalCode: '00-001',
      country: 'Poland'
    },
    taxNumber: 'PL1234567890',
    isActive: true,
    emailVerified: true
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'florist@test.com',
    password: 'password123',
    userType: 'florist',
    businessName: 'Beautiful Blooms Florist',
    phone: '+1-555-0102',
    businessAddress: {
      street: '456 Flower Avenue',
      city: 'Krakow',
      postalCode: '30-001',
      country: 'Poland'
    },
    taxNumber: 'PL0987654321',
    isActive: true,
    emailVerified: true
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'admin123',
    userType: 'admin',
    businessName: 'Flower Distribution Admin',
    phone: '+1-555-0100',
    businessAddress: {
      street: '789 Admin Plaza',
      city: 'Warsaw',
      postalCode: '00-002',
      country: 'Poland'
    },
    taxNumber: 'PL1122334455',
    isActive: true,
    emailVerified: true
  }
];

// Create test users function
const createTestUsers = async () => {
  try {
    console.log('🔧 Creating test users...');
    
    // Connect to SQLite database
    await connectPostgreSQL();
    console.log('✓ Connected to SQLite database');

    // Create each test user
    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: userData.email } });
        
        if (existingUser) {
          console.log(`⚠ User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Create new user
        const user = await User.create(userData);
        console.log(`✓ Created ${userData.userType}: ${userData.email}`);
        
      } catch (userError) {
        console.error(`❌ Error creating user ${userData.email}:`, userError.message);
      }
    }

    console.log('\n🎉 Test user creation completed!');
    console.log('\n📋 Test User Credentials:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│                   TEST USERS                            │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ WHOLESALER:                                             │');
    console.log('│   Email: wholesaler@test.com                           │');
    console.log('│   Password: password123                                 │');
    console.log('│   Role: Sees box pricing (100 stems per box)           │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ FLORIST:                                                │');
    console.log('│   Email: florist@test.com                               │');
    console.log('│   Password: password123                                 │');
    console.log('│   Role: Sees individual stem pricing                    │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ ADMIN:                                                  │');
    console.log('│   Email: admin@test.com                                 │');
    console.log('│   Password: admin123                                    │');
    console.log('│   Role: Full system access                              │');
    console.log('└─────────────────────────────────────────────────────────┘');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    // Close database connection
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  createTestUsers();
}

module.exports = { createTestUsers, testUsers };