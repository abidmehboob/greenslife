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
// Allow frontend origins (localhost and 127.0.0.1) and any CLIENT_URL env override
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g., curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS policy: This origin is not allowed'), false);
  },
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
    
    // Wait a moment for models to be fully loaded
    setTimeout(async () => {
      await createTestUsers();
    }, 1000);
  } catch (error) {
    console.error('SQLite connection failed:', error.message);
    console.log('⚠ Continuing without transactional database...');
  }
};

// Create test users for development
const createTestUsers = async () => {
  try {
    console.log('Creating test users...');
    const { User } = require('./models/postgres');
    
    const testUsers = [
      {
        email: 'wholesaler@test.com',
        password: 'password123',
        userType: 'wholesaler',
        businessName: 'Wholesale Flowers Inc',
        firstName: 'John',
        lastName: 'Wholesaler'
      },
      {
        email: 'florist@test.com',
        password: 'password123',
        userType: 'florist',
        businessName: 'Beautiful Blooms Florist',
        firstName: 'Jane',
        lastName: 'Florist'
      },
      {
        email: 'admin@test.com',
        password: 'password123',
        userType: 'admin',
        businessName: 'greenslife Admin',
        firstName: 'Admin',
        lastName: 'User'
      }
    ];

    for (const userData of testUsers) {
      try {
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (!existingUser) {
          await User.create(userData);
          console.log(`✓ Test user created: ${userData.email}`);
        } else {
          console.log(`- Test user already exists: ${userData.email}`);
        }
      } catch (userError) {
        console.log(`✗ Failed to create user ${userData.email}:`, userError.message);
      }
    }
    console.log('✓ Test user creation completed');
  } catch (error) {
    console.log('Note: Could not create test users:', error.message);
  }
};

// Start server after database initialization
const startServer = async () => {
  await initializeDatabases();
  
  // Redirect root to frontend
  app.get('/', (req, res) => {
    res.redirect('/app');
  });

  // Health check route
  app.get('/health', (req, res) => {
    res.json({ 
      message: 'Flower Distribution API Server is running!',
      databases: {
        mongodb: 'Catalog data (flowers, categories)',
        sqlite: 'Transactional data (users, orders, payments)'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Main frontend application - simplified version without template literal issues
  app.get('/app', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌸 greenslife - Professional Flower Distribution Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
            min-height: 100vh;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #2d5016 0%, #4a7c59 50%, #28a745 100%); 
            color: white; 
            padding: 3rem 0; 
            text-align: center; 
            margin-bottom: 2rem;
            box-shadow: 0 4px 20px rgba(45, 80, 22, 0.3);
        }
        .card { 
            background: white; 
            border-radius: 15px; 
            padding: 2rem; 
            margin-bottom: 2rem; 
            box-shadow: 0 5px 25px rgba(0,0,0,0.1);
        }
        .btn { 
            padding: 14px 28px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: 600; 
            margin: 8px; 
            transition: all 0.3s ease;
        }
        .btn-primary { background: linear-gradient(135deg, #007bff, #0056b3); color: white; }
        .btn-success { background: linear-gradient(135deg, #28a745, #1e7e34); color: white; }
        .btn-warning { background: linear-gradient(135deg, #ffc107, #e0a800); color: #212529; }
        .btn-danger { background: linear-gradient(135deg, #dc3545, #c82333); color: white; }
        .btn:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
        .result { margin-top: 1rem; padding: 1.5rem; border-radius: 10px; font-weight: 500; }
        .success { background: linear-gradient(135deg, #d4edda, #c3e6cb); border: 2px solid #28a745; color: #155724; }
        .error { background: linear-gradient(135deg, #f8d7da, #f5c6cb); border: 2px solid #dc3545; color: #721c24; }
        .info { background: linear-gradient(135deg, #d1ecf1, #bee5eb); border: 2px solid #17a2b8; color: #0c5460; }
        .hidden { display: none; }
        .auth-section { display: none; }
        .flowers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
        .flower-card { 
            border: 2px solid #e8f5e8; 
            border-radius: 12px; 
            padding: 1.5rem; 
            text-align: center;
            background: white;
            transition: all 0.3s ease;
        }
        .flower-card:hover { border-color: #28a745; transform: translateY(-5px); }
        .flower-name { font-size: 1.2rem; font-weight: bold; color: #2d5016; margin-bottom: 0.5rem; }
        .flower-category { 
            background: linear-gradient(135deg, #28a745, #20c997); 
            color: white; 
            padding: 0.2rem 0.8rem; 
            border-radius: 15px; 
            font-size: 0.8rem; 
            display: inline-block;
            margin-bottom: 0.5rem;
        }
        .flower-price { font-size: 1.4rem; font-weight: bold; color: #28a745; margin: 0.5rem 0; }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>🌸 greenslife Professional Flower Distribution Platform</h1>
            <p>Connecting wholesalers and florists with premium fresh flowers worldwide</p>
        </div>
    </div>

    <div class="container">
        <div class="card" id="loginSection">
            <h2>🔐 Welcome to greenslife</h2>
            <p>Choose your account type to access personalized pricing and features:</p>
            <div class="grid">
                <div style="padding: 1.5rem; border-radius: 12px; border: 2px solid #2196f3;">
                    <h3 style="color: #1976d2;">👔 Wholesaler Portal</h3>
                    <p>Bulk quantities with wholesale pricing</p>
                    <button class="btn btn-primary" onclick="login('wholesaler@test.com', 'password123', 'Wholesaler')">
                        🏢 Enter Wholesaler Portal
                    </button>
                </div>
                <div style="padding: 1.5rem; border-radius: 12px; border: 2px solid #4caf50;">
                    <h3 style="color: #2e7d32;">🌺 Florist Dashboard</h3>
                    <p>Individual stems and small quantities</p>
                    <button class="btn btn-success" onclick="login('florist@test.com', 'password123', 'Florist')">
                        🌸 Enter Florist Dashboard
                    </button>
                </div>
                <div style="padding: 1.5rem; border-radius: 12px; border: 2px solid #ff9800;">
                    <h3 style="color: #f57c00;">⚙️ Administrator Panel</h3>
                    <p>Full system access and management</p>
                    <button class="btn btn-warning" onclick="login('admin@test.com', 'password123', 'Admin')">
                        🛠️ Enter Admin Panel
                    </button>
                </div>
            </div>
        </div>

        <div class="auth-section" id="mainApp">
            <div class="card">
                <h2>🌸 Premium Flower Catalog</h2>
                <p>Discover our premium carnation collection with role-based pricing</p>
                <button class="btn btn-primary" onclick="loadFlowers()">
                    🌹 Browse Carnation Collection
                </button>
                <div id="flowersResult"></div>
            </div>
        </div>

        <div class="card">
            <h2>📊 System Status</h2>
            <div id="globalResult" class="info">Ready to test greenslife functionality...</div>
        </div>
    </div>

    <script>
        let currentUser = null;
        let currentToken = null;

        async function login(email, password, userType) {
            try {
                showResult('Logging in...', 'info');
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }

                const data = await response.json();
                currentUser = data.user;
                currentToken = data.token;

                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';

                showResult('✅ Welcome ' + data.user.businessName + '!\\n' + userType + ' login successful\\nEmail: ' + data.user.email, 'success');
            } catch (error) {
                showResult('❌ ' + userType + ' Login Failed: ' + error.message, 'error');
            }
        }

        async function loadFlowers() {
            try {
                showResult('Loading flowers...', 'info');
                const headers = {};
                if (currentToken) {
                    headers.Authorization = 'Bearer ' + currentToken;
                }

                const response = await fetch('/api/flowers', { headers });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + JSON.stringify(data));
                }

                displayFlowers(data.flowers || []);
                showResult('✅ Loaded ' + (data.flowers ? data.flowers.length : 0) + ' flowers', 'success');
            } catch (error) {
                showResult('❌ Failed to load flowers: ' + error.message, 'error');
            }
        }

        function displayFlowers(flowers) {
            const container = document.getElementById('flowersResult');
            if (!flowers.length) {
                container.innerHTML = '<p>No flowers available. Using demo data...</p>';
                flowers = getDemoFlowers();
            }

            let html = '<div class="flowers-grid">';
            flowers.forEach(function(flower) {
                html += '<div class="flower-card">';
                html += '<div class="flower-category">' + (flower.category || 'CARNATIONS') + '</div>';
                html += '<div class="flower-name">' + flower.name + '</div>';
                html += '<p>' + flower.description + '</p>';
                html += '<p><strong>Color:</strong> ' + flower.color + '</p>';
                html += '<div class="flower-price">$' + flower.pricing.pricePerStem + '</div>';
                html += '<p>per stem</p>';
                html += '</div>';
            });
            html += '</div>';
            container.innerHTML = html;
        }

        function getDemoFlowers() {
            return [
                {
                    name: 'Red Carnation',
                    category: 'CARNATIONS',
                    description: 'Classic red carnations perfect for romantic occasions',
                    color: 'Red',
                    pricing: { pricePerStem: 0.35 }
                },
                {
                    name: 'Pink Carnation', 
                    category: 'CARNATIONS',
                    description: 'Soft pink carnations for gentle expressions',
                    color: 'Pink',
                    pricing: { pricePerStem: 0.33 }
                },
                {
                    name: 'White Carnation',
                    category: 'CARNATIONS', 
                    description: 'Pure white carnations perfect for weddings',
                    color: 'White',
                    pricing: { pricePerStem: 0.32 }
                }
            ];
        }

        function showResult(message, type) {
            const container = document.getElementById('globalResult');
            container.textContent = message;
            container.className = 'result ' + type;
        }
    </script>
</body>
</html>`);
  });

  // API test route
  app.get('/test', (req, res) => {
    res.redirect('/app');
  });

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
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
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ API available at http://localhost:${PORT}/`);
    console.log(`✓ Also accessible at http://127.0.0.1:${PORT}/`);
    console.log(`✓ Frontend: http://localhost:3000/ (when running)`);
  });
};

const PORT = process.env.PORT || 3001;

startServer();