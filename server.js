const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectMongoDB, connectPostgreSQL } = require('./config/database');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database connections
const initializeDatabases = async () => {
  console.log('Initializing databases...');
  
  // Try to connect to MongoDB for catalog data  
  try {
    await connectMongoDB();
    console.log('✓ MongoDB connected successfully (catalog data)');
  } catch (error) {
    console.log('⚠ MongoDB not available, continuing without catalog features');
  }
  
  // Connect to SQLite for transactional data
  try {
    await connectPostgreSQL();
    
    // Import models after database connection
    require('./models/postgres/User');
    require('./models/postgres/Order');
    require('./models/postgres/Payment');
    require('./models/postgres/index'); // This sets up associations
    
    console.log('✓ SQLite connected successfully (transactional data)');
  } catch (error) {
    console.error('SQLite connection failed:', error.message);
    console.log('⚠ Continuing without transactional database...');
  }
};

// Start server after database initialization
const startServer = async () => {
  await initializeDatabases();
  
  // Basic health check route
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Flower Distribution API Server is running!',
      databases: {
        mongodb: 'Catalog data (flowers, categories)',
        sqlite: 'Transactional data (users, orders, payments)'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/flowers', require('./routes/flowers'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/payments', require('./routes/payments'));

  // Serve static files from the React app
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'client/build/index.html'));
    });
  }

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'production' ? {} : err.stack
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
  
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ API available at http://localhost:${PORT}/`);
    console.log(`✓ Frontend: http://localhost:3000/ (when running)`);
  });
};

const PORT = process.env.PORT || 5001;

startServer();