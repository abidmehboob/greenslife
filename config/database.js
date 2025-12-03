const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');

// SQLite Configuration (for transactional data - easier development setup)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_URL || './database/flower_ecommerce.db',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// MongoDB Configuration (for catalog data)
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flower-catalog', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds instead of hanging
    });
    console.log('MongoDB connected successfully (Catalog Database)');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Note: MongoDB is required for catalog functionality. Continuing without it...');
    throw error; // Re-throw to handle in calling code
  }
};

// SQLite Connection Test
const connectSQLite = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite connected successfully (Transactional Database)');
    
    // Sync database models (tables will be created automatically)
    await sequelize.sync({ alter: true });
    console.log('SQLite models synchronized');
  } catch (error) {
    console.error('SQLite connection error:', error.message);
    console.log('Note: SQLite is required for transactional data. Using fallback mode.');
  }
};

module.exports = {
  sequelize,
  connectMongoDB,
  connectSQLite: connectSQLite,
  connectPostgreSQL: connectSQLite, // Alias for backward compatibility
  mongoose
};