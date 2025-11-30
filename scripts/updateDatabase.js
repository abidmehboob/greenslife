const { sequelize } = require('../config/database.js');

async function updateDatabase() {
  try {
    console.log('Updating database schema...');
    await sequelize.sync({ alter: true });
    console.log('✓ Database schema updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database update failed:', error);
    process.exit(1);
  }
}

updateDatabase();