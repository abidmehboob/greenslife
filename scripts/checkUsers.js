const { User } = require('../models/postgres');
const { connectPostgreSQL } = require('../config/database');

(async () => {
  try {
    await connectPostgreSQL();
    const users = await User.findAll();
    console.log('📊 Database Users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.userType}) - Active: ${user.isActive}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();