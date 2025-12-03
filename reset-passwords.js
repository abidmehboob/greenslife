const { User } = require('./models/postgres');

async function resetTestUsersPasswords() {
  try {
    console.log('Resetting test users passwords...');
    
    const testUsers = ['wholesaler@test.com', 'florist@test.com', 'admin@test.com'];
    
    for (const email of testUsers) {
      const user = await User.findOne({ where: { email } });
      if (user) {
        await user.update({ password: 'password123' });
        console.log(`✓ Password updated for ${email}`);
        
        // Test the new password
        const isValid = await user.comparePassword('password123');
        console.log(`  - Password test: ${isValid ? 'PASS' : 'FAIL'}`);
      } else {
        console.log(`❌ User not found: ${email}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Reset error:', error);
    process.exit(1);
  }
}

resetTestUsersPasswords();