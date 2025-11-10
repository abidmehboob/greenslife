const bcrypt = require('bcryptjs');
const { User } = require('../models/postgres');
const { connectPostgreSQL } = require('../config/database');

async function checkTestUsers() {
  try {
    console.log('🔍 Checking test users and passwords...\n');
    
    await connectPostgreSQL();
    
    const testEmail = 'wholesaler@test.com';
    const testPassword = 'password123';
    
    const user = await User.findOne({ where: { email: testEmail } });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log('✅ User found:');
    console.log('- Email:', user.email);
    console.log('- User Type:', user.userType);
    console.log('- Active:', user.isActive);
    console.log('- Email Verified:', user.emailVerified);
    console.log('- Business Name:', user.businessName);
    
    // Test password comparison
    console.log('\n🔐 Testing password...');
    const isPasswordValid = await user.comparePassword(testPassword);
    console.log('- Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('- Stored hash:', user.password.substring(0, 20) + '...');
      
      // Try manually comparing
      const manualCheck = await bcrypt.compare(testPassword, user.password);
      console.log('- Manual bcrypt check:', manualCheck);
    }
    
    // Test with all users
    console.log('\n📊 All test users:');
    const allUsers = await User.findAll({
      where: {
        email: ['wholesaler@test.com', 'florist@test.com', 'admin@test.com']
      }
    });
    
    for (const u of allUsers) {
      const pwd = u.email === 'admin@test.com' ? 'admin123' : 'password123';
      const valid = await u.comparePassword(pwd);
      console.log(`- ${u.email} (${u.userType}): Password ${valid ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  checkTestUsers();
}