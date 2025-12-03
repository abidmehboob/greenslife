const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const User = require('../models/postgres/User');

// Test users data
const testUsers = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'admin123',
    userType: 'admin',
    companyName: 'GreensLife Admin',
    phone: '+48123456789',
    address: 'Admin Street 1',
    city: 'Warsaw',
    postalCode: '00-001',
    country: 'Poland',
    isEmailVerified: true,
    isActive: true
  },
  {
    firstName: 'Wholesale',
    lastName: 'Buyer',
    email: 'wholesaler@test.com', 
    password: 'password123',
    userType: 'wholesaler',
    companyName: 'Flower Wholesale Co.',
    phone: '+48987654321',
    address: 'Wholesale Avenue 15',
    city: 'Krakow',
    postalCode: '30-001',
    country: 'Poland',
    isEmailVerified: true,
    isActive: true
  },
  {
    firstName: 'Local',
    lastName: 'Florist',
    email: 'florist@test.com',
    password: 'password123', 
    userType: 'florist',
    companyName: 'Beautiful Blooms Shop',
    phone: '+48555666777',
    address: 'Market Square 8',
    city: 'Gdansk',
    postalCode: '80-001',
    country: 'Poland',
    isEmailVerified: true,
    isActive: true
  },
  {
    firstName: 'Regular',
    lastName: 'Customer',
    email: 'customer@test.com',
    password: 'password123',
    userType: 'florist', // Changed from 'customer' since enum doesn't include customer
    companyName: 'Individual Customer',
    phone: '+48111222333',
    address: 'Customer Lane 25',
    city: 'Wroclaw',
    postalCode: '50-001', 
    country: 'Poland',
    isEmailVerified: true,
    isActive: true
  }
];

// Seed function
const seedUsers = async () => {
  try {
    console.log('Connecting to SQLite database...');
    
    // Make sure database is connected and synced
    await sequelize.authenticate();
    await sequelize.sync({ force: false }); // Don't drop existing tables
    
    console.log('Connected to SQLite database');
    
    // Check if users already exist
    const existingUserCount = await User.count();
    console.log(`Existing users in database: ${existingUserCount}`);
    
    // Create test users
    console.log('Creating test users...');
    
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: userData.email } });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user with correct field mapping
      const user = await User.create({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: hashedPassword,
        userType: userData.userType,
        businessName: userData.companyName,
        phone: userData.phone,
        street: userData.address,
        city: userData.city,
        postalCode: userData.postalCode
      });
      
      console.log(`Created user: ${user.email} (${user.userType})`);
    }
    
    console.log('Test users created successfully!');
    
    // Display summary
    const totalUsers = await User.count();
    console.log(`\nTotal users in database: ${totalUsers}`);
    
    console.log('\n=== TEST USER CREDENTIALS ===');
    testUsers.forEach(user => {
      console.log(`${user.userType.toUpperCase()}: ${user.email} / ${user.password}`);
    });
    
    console.log('\n=== USER TYPES EXPLANATION ===');
    console.log('- admin: Full access to all features and management');
    console.log('- wholesaler: Bulk pricing, box quantities');
    console.log('- florist: Standard retail pricing, stem quantities');
    console.log('- customer: Basic customer access');
    
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed');
  }
};

// Run seeding
seedUsers();