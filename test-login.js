const { User } = require('./models/postgres');

async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    // Test finding user
    const user = await User.findOne({ where: { email: 'florist@test.com' } });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✓ User found: ${user.email}`);
    console.log(`  - isActive: ${user.isActive}`);
    console.log(`  - emailVerified: ${user.emailVerified}`);
    console.log(`  - userType: ${user.userType}`);
    
    // Test password comparison
    const isValidPassword = await user.comparePassword('password123');
    console.log(`  - Password valid: ${isValidPassword}`);
    
    if (user.isActive && isValidPassword) {
      console.log('✅ Login should work!');
    } else {
      console.log('❌ Login will fail');
      if (!user.isActive) console.log('   - Account not active');
      if (!isValidPassword) console.log('   - Invalid password');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

testLogin();