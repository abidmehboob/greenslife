const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectMongoDB, connectPostgreSQL } = require('./config/database');
const ImageHandler = require('./utils/ImageHandler');
require('dotenv').config();

const app = express();

// Security middleware with CSP configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
// Allow frontend origins (localhost and 127.0.0.1) and any CLIENT_URL env override
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000', 
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'http://localhost',
  'http://127.0.0.1',
  'http://localhost:80',
  'http://127.0.0.1:80'
];
app.use(cors({
  origin: (origin, callback) => {
    console.log('CORS check - Origin received:', origin);
    console.log('CORS check - Allowed origins:', allowedOrigins);
    // Allow non-browser requests (e.g., curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.log('CORS REJECTED - Origin not in allowed list:', origin);
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
        lastName: 'Wholesaler',
        isActive: true,
        emailVerified: true,
        activationDate: new Date()
      },
      {
        email: 'florist@test.com',
        password: 'password123',
        userType: 'florist',
        businessName: 'Beautiful Blooms Florist',
        firstName: 'Jane',
        lastName: 'Florist',
        isActive: true,
        emailVerified: true,
        activationDate: new Date()
      },
      {
        email: 'admin@test.com',
        password: 'password123',
        userType: 'admin',
        businessName: 'greenslife Admin',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        emailVerified: true,
        activationDate: new Date()
      }
    ];

    for (const userData of testUsers) {
      try {
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (!existingUser) {
          const user = await User.create(userData);
          console.log(`✓ Test user created: ${userData.email} (Active: ${user.isActive})`);
        } else {
          // Update existing users to ensure they are active for testing
          if (!existingUser.isActive || !existingUser.emailVerified) {
            await existingUser.update({
              isActive: true,
              emailVerified: true,
              activationDate: new Date()
            });
            console.log(`✓ Test user activated: ${userData.email}`);
          } else {
            console.log(`- Test user already exists and is active: ${userData.email}`);
          }
        }
      } catch (userError) {
        console.log(`✗ Failed to create/update user ${userData.email}:`, userError.message);
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
  
  // Initialize email service
  const emailService = require('./services/emailService');
  await emailService.initialize();
  
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
        .btn-success { background: linear-gradient(135deg, #388e3c, #2e7d32); color: white; }
        .btn-warning { background: linear-gradient(135deg, #ffc107, #e0a800); color: #212529; }
        .btn-danger { background: linear-gradient(135deg, #dc3545, #c82333); color: white; }
        .btn:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
        .result { margin-top: 1rem; padding: 1.5rem; border-radius: 10px; font-weight: 500; }
        .success { background: linear-gradient(135deg, #e8f5e8, #dcedc8); border: 2px solid #388e3c; color: #2e4a2e; }
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
        .flower-card:hover { border-color: #388e3c; transform: translateY(-5px); }
        .flower-name { font-size: 1.2rem; font-weight: bold; color: #2e7d32; margin-bottom: 0.5rem; }
        .flower-category { 
            background: linear-gradient(135deg, #2e7d32, #388e3c); 
            color: white; 
            padding: 0.2rem 0.8rem; 
            border-radius: 15px; 
            font-size: 0.8rem; 
            display: inline-block;
            margin-bottom: 0.5rem;
        }
        .flower-price { font-size: 1.4rem; font-weight: bold; color: #2e7d32; margin: 0.5rem 0; }
    </style>
</head>
<body>
    <!-- Header Section -->
    <div class="header">
        <div class="container">
            <h1>🌿 greenslife</h1>
            <p>Premium Flower Distribution Platform - Connecting wholesalers and florists with the world's finest fresh flowers since 1985</p>
        </div>
    </div>

    <div class="container">
        <!-- Landing Page -->
        <div class="card" id="loginSection">
            <h2>🌸 Welcome to greenslife Distribution</h2>
            <p style="font-size: 1.2rem; color: #555; margin-bottom: 2rem; text-align: center;">Choose your account type to access personalized pricing, exclusive catalogs, and professional tools tailored to your business needs.</p>
            
            <div class="grid">
                <div class="portal-card wholesaler">
                    <h3 style="color: #3498db;">👔 Wholesaler Portal</h3>
                    <p>Access bulk quantities with competitive wholesale pricing. Perfect for large-scale distribution and retail flower shops.</p>
                    <ul style="text-align: left; margin: 1rem 0; color: #666;">
                        <li>• Bulk order quantities (100+ stems)</li>
                        <li>• Wholesale pricing tiers</li>
                        <li>• Priority shipping options</li>
                        <li>• Dedicated account manager</li>
                    </ul>
                    <button class="btn btn-primary" id="wholesaler-login" data-email="wholesaler@test.com" data-password="password123" data-type="Wholesaler">
                        🏢 Enter Wholesaler Portal
                    </button>
                </div>
                
                <div class="portal-card florist">
                    <h3 style="color: #27ae60;">🌺 Florist Dashboard</h3>
                    <p>Individual stems and custom arrangements for boutique florists and wedding planners seeking premium quality.</p>
                    <ul style="text-align: left; margin: 1rem 0; color: #666;">
                        <li>• Individual stem purchases</li>
                        <li>• Artisan quality flowers</li>
                        <li>• Same-day delivery available</li>
                        <li>• Seasonal specialties</li>
                    </ul>
                    <button class="btn btn-success" id="florist-login" data-email="florist@test.com" data-password="password123" data-type="Florist">
                        🌸 Enter Florist Dashboard
                    </button>
                </div>
                
                <div class="portal-card admin">
                    <h3 style="color: #f39c12;">⚙️ Administrator Panel</h3>
                    <p>Complete system management with full access to inventory, pricing, user management, and analytics tools.</p>
                    <ul style="text-align: left; margin: 1rem 0; color: #666;">
                        <li>• Inventory management</li>
                        <li>• User & pricing control</li>
                        <li>• Analytics & reporting</li>
                        <li>• System configuration</li>
                    </ul>
                    <button class="btn btn-warning" id="admin-login" data-email="admin@test.com" data-password="admin123" data-type="Admin">
                        🛠️ Enter Admin Panel
                    </button>
                </div>
            </div>
            
            <!-- Features Section -->
            <div style="margin-top: 3rem; text-align: center;">
                <h3 style="color: #1e8449; margin-bottom: 1.5rem;">🌟 Why Choose greenslife?</h3>
                <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                    <div style="padding: 1.5rem; background: linear-gradient(135deg, #e8f8f5, #d1f2eb); border-radius: 12px;">
                        <h4 style="color: #27ae60; margin-bottom: 0.5rem;">🚚 Global Distribution</h4>
                        <p style="color: #666;">Fresh flowers delivered to over 35 countries worldwide with temperature-controlled logistics.</p>
                    </div>
                    <div style="padding: 1.5rem; background: linear-gradient(135deg, #e8f8f5, #d1f2eb); border-radius: 12px;">
                        <h4 style="color: #27ae60; margin-bottom: 0.5rem;">🌱 Premium Quality</h4>
                        <p style="color: #666;">Hand-selected flowers from certified growers ensuring maximum freshness and longevity.</p>
                    </div>
                    <div style="padding: 1.5rem; background: linear-gradient(135deg, #e8f8f5, #d1f2eb); border-radius: 12px;">
                        <h4 style="color: #27ae60; margin-bottom: 0.5rem;">📱 Digital Platform</h4>
                        <p style="color: #666;">Modern ordering system with real-time inventory, pricing, and delivery tracking.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Application (Home Page after login) -->
        <div class="auth-section" id="mainApp">
            <!-- User Welcome Header -->
            <div class="card" id="userWelcome">
                <div style="text-align: center; padding: 1rem;">
                    <h2 id="welcomeMessage">Welcome to greenslife!</h2>
                    <p id="userInfo" style="color: #666; margin-bottom: 1rem;"></p>
                    <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                        <span id="userRole" class="flower-category" style="margin: 0;"></span>
                        <button class="btn-logout" onclick="logout()" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Logout</button>
                    </div>
                </div>
            </div>

            <!-- Wholesaler Dashboard -->
            <div class="auth-section" id="wholesalerDashboard" style="display: none;">
                <div class="card">
                    <h2>📦 Wholesaler Dashboard</h2>
                    <p style="font-size: 1.1rem; color: #666; margin-bottom: 2rem;">Manage your bulk orders and access wholesale pricing for carnations and premium flowers.</p>
                    
                    <div class="grid" style="margin-bottom: 2rem;">
                        <div style="text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #e8f5e8, #dcedc8); border-radius: 12px;">
                            <h4 style="color: #2e7d32; margin-bottom: 0.5rem;">📈 Bulk Pricing</h4>
                            <p style="color: #666;">Access wholesale prices for box quantities (25 stems per box)</p>
                            <button class="btn btn-success" onclick="loadFlowers()" style="margin-top: 1rem;">View Wholesale Catalog</button>
                        </div>
                        <div style="text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #e8f5e8, #dcedc8); border-radius: 12px;">
                            <h4 style="color: #2e7d32; margin-bottom: 0.5rem;">📊 Volume Discounts</h4>
                            <p style="color: #666;">Tiered pricing based on order volume and frequency</p>
                            <button class="btn btn-primary" style="margin-top: 1rem;">View Pricing Tiers</button>
                        </div>
                    </div>
                    
                    <div id="flowersResult"></div>
                </div>
                
                <div class="card">
                    <h2>🎯 Wholesaler Tools</h2>
                    <div class="grid">
                        <div style="text-align: center; padding: 1.5rem;">
                            <h3 style="color: #2e7d32;">📦 Bulk Orders</h3>
                            <p>Place large volume orders with automatic volume discounts.</p>
                            <button class="btn btn-success" style="margin-top: 1rem;">Create Bulk Order</button>
                        </div>
                        <div style="text-align: center; padding: 1.5rem;">
                            <h3 style="color: #2e7d32;">🚚 Logistics Hub</h3>
                            <p>Track shipments, delivery schedules, and inventory levels.</p>
                            <button class="btn btn-primary" style="margin-top: 1rem;">Manage Logistics</button>
                        </div>
                        <div style="text-align: center; padding: 1.5rem;">
                            <h3 style="color: #2e7d32;">💼 Business Analytics</h3>
                            <p>Advanced reporting on purchasing patterns and profitability.</p>
                            <button class="btn btn-primary" style="margin-top: 1rem;">View Reports</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Florist Dashboard -->
            <div class="auth-section" id="floristDashboard" style="display: none;">
                <div class="card">
                    <h2>🌸 Florist Dashboard</h2>
                    <p style="font-size: 1.1rem; color: #666; margin-bottom: 2rem;">Create beautiful arrangements with our premium carnations. Perfect for bouquets, events, and retail.</p>
                    
                    <div class="grid" style="margin-bottom: 2rem;">
                        <div style="text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #fce4ec, #f8bbd9); border-radius: 12px;">
                            <h4 style="color: #ad1457; margin-bottom: 0.5rem;">🌹 Per Stem Pricing</h4>
                            <p style="color: #666;">Flexible quantities perfect for custom arrangements</p>
                            <button class="btn btn-success" onclick="loadFlowers()" style="margin-top: 1rem;">Browse Flowers</button>
                        </div>
                        <div style="text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #fce4ec, #f8bbd9); border-radius: 12px;">
                            <h4 style="color: #ad1457; margin-bottom: 0.5rem;">💐 Design Tools</h4>
                            <p style="color: #666;">Color matching and arrangement planning tools</p>
                            <button class="btn btn-primary" style="margin-top: 1rem;">Design Assistant</button>
                        </div>
                    </div>
                    
                    <div id="flowersResult"></div>
                </div>
                
                <div class="card">
                    <h2>🎯 Florist Tools</h2>
                    <div class="grid">
                        <div style="text-align: center; padding: 1.5rem;">
                            <h3 style="color: #ad1457;">💐 Quick Orders</h3>
                            <p>Fast ordering for same-day and next-day delivery needs.</p>
                            <button class="btn btn-success" style="margin-top: 1rem;">Quick Order</button>
                        </div>
                        <div style="text-align: center; padding: 1.5rem;">
                            <h3 style="color: #ad1457;">📅 Event Planning</h3>
                            <p>Schedule orders for weddings, events, and special occasions.</p>
                            <button class="btn btn-primary" style="margin-top: 1rem;">Plan Events</button>
                        </div>
                        <div style="text-align: center; padding: 1.5rem;">
                            <h3 style="color: #ad1457;">🎨 Color Palette</h3>
                            <p>Browse flowers by color to create perfect arrangements.</p>
                            <button class="btn btn-primary" style="margin-top: 1rem;">Color Guide</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Admin Dashboard -->
            <div class="auth-section" id="adminDashboard" style="display: none;">
                <div class="card">
                    <h2>⚙️ Admin Dashboard</h2>
                    <p style="font-size: 1.1rem; color: #666; margin-bottom: 2rem;">System administration and management tools for the greenslife platform.</p>
                    
                    <div class="grid" style="margin-bottom: 2rem;">
                        <div style="text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #e3f2fd, #bbdefb); border-radius: 12px;">
                            <h4 style="color: #1565c0; margin-bottom: 0.5rem;">👥 User Management</h4>
                            <p style="color: #666;">Manage wholesaler and florist accounts</p>
                            <button class="btn btn-primary" style="margin-top: 1rem;">Manage Users</button>
                        </div>
                        <div style="text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #e3f2fd, #bbdefb); border-radius: 12px;">
                            <h4 style="color: #1565c0; margin-bottom: 0.5rem;">📦 Inventory Control</h4>
                            <p style="color: #666;">Monitor stock levels and supplier management</p>
                            <button class="btn btn-success" onclick="loadFlowers()" style="margin-top: 1rem;">View Inventory</button>
                        </div>
                    </div>
                    
                    <div id="flowersResult"></div>
                </div>
                
                <div class="card">
                    <h2>🎯 Admin Tools</h2>
                    <div class="grid">
                        <div style="text-align: center; padding: 1.5rem;">
                            <h3 style="color: #1565c0;">📊 System Analytics</h3>
                            <p>Platform usage statistics, performance metrics, and reports.</p>
                            <button class="btn btn-primary" style="margin-top: 1rem;">View Analytics</button>
                        </div>
                        <div style="text-align: center; padding: 1.5rem;">
                            <h3 style="color: #1565c0;">💰 Financial Reports</h3>
                            <p>Revenue tracking, payment processing, and financial insights.</p>
                            <button class="btn btn-success" style="margin-top: 1rem;">Financial Dashboard</button>
                        </div>
                        <div style="text-align: center; padding: 1.5rem;">
                            <h3 style="color: #1565c0;">⚙️ System Settings</h3>
                            <p>Platform configuration, pricing rules, and system maintenance.</p>
                            <button class="btn btn-warning" style="margin-top: 1rem;">System Settings</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Status -->
        <div class="card">
            <h2>📊 System Status</h2>
            <div id="globalResult" class="info">🟢 All systems operational - Ready to serve your flower distribution needs</div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 2rem; color: #666; border-top: 1px solid #e0e0e0; margin-top: 2rem;">
            <p>© 2025 greenslife Distribution Platform | Serving the global flower industry since 1985</p>
            <p style="margin-top: 0.5rem;">🌍 Available in 35+ countries | 📞 24/7 Customer Support | 🚚 Temperature-Controlled Delivery</p>
        </div>
    </div>

    <script>
        let currentUser = null;
        let currentToken = null;

        function showDashboardForUserType(userType) {
            // Hide all dashboards first
            document.getElementById('wholesalerDashboard').style.display = 'none';
            document.getElementById('floristDashboard').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'none';
            
            // Show appropriate dashboard
            switch(userType) {
                case 'wholesaler':
                    document.getElementById('wholesalerDashboard').style.display = 'block';
                    break;
                case 'florist':
                    document.getElementById('floristDashboard').style.display = 'block';
                    break;
                case 'admin':
                    document.getElementById('adminDashboard').style.display = 'block';
                    break;
                default:
                    document.getElementById('wholesalerDashboard').style.display = 'block';
            }
        }

        function logout() {
            currentUser = null;
            currentToken = null;
            
            // Hide authenticated sections
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('wholesalerDashboard').style.display = 'none';
            document.getElementById('floristDashboard').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'none';
            
            // Show login section
            document.getElementById('loginSection').style.display = 'block';
            
            // Clear any results
            showResult('👋 Logged out successfully', 'info');
            
            // Clear form fields
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
        }

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

                // Hide login section and show appropriate dashboard
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                
                // Update welcome message and user info
                document.getElementById('welcomeMessage').textContent = 'Welcome ' + data.user.firstName + ' ' + data.user.lastName + '!';
                document.getElementById('userInfo').textContent = data.user.businessName + ' • ' + data.user.email;
                document.getElementById('userRole').textContent = data.user.userType.toUpperCase();
                
                // Show appropriate dashboard based on user type
                showDashboardForUserType(data.user.userType);
                
                showResult('✅ Welcome ' + data.user.businessName + '!\\n' + data.user.userType + ' login successful\\nEmail: ' + data.user.email, 'success');
            } catch (error) {
                showResult('❌ ' + userType + ' Login Failed: ' + error.message, 'error');
            }
        }

        let currentPage = 1;
        let totalPages = 1;
        let currentCategory = '';
        
        async function loadFlowers(page = 1, category = '', search = '') {
            try {
                showResult('Loading flowers...', 'info');
                const headers = {};
                if (currentToken) {
                    headers.Authorization = 'Bearer ' + currentToken;
                }

                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: '10'
                });
                if (category) params.append('category', category);
                if (search) params.append('search', search);

                const response = await fetch('/api/flowers?' + params.toString(), { headers });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + JSON.stringify(data));
                }

                currentPage = data.pagination?.currentPage || 1;
                totalPages = data.pagination?.totalPages || 1;
                currentCategory = category;
                
                displayFlowers(data.flowers || [], data.pagination, data.categories || []);
                showResult('✅ Loaded ' + (data.flowers ? data.flowers.length : 0) + ' flowers (Page ' + currentPage + ' of ' + totalPages + ')', 'success');
            } catch (error) {
                showResult('❌ Failed to load flowers: ' + error.message, 'error');
            }
        }

        function displayFlowers(flowers, pagination, categories) {
            const container = document.getElementById('flowersResult');
            
            if (!flowers.length) {
                container.innerHTML = '<div class="empty-catalog"><h3>🔍 No flowers found</h3><p>Try adjusting your search or category filter</p></div>';
                return;
            }

            let html = '';

            // Category filter
            if (categories && categories.length > 0) {
                html += '<div style="margin-bottom: 2rem;">';
                html += '<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Filter by Category:</label>';
                html += '<select id="categoryFilter" style="padding: 0.8rem; border-radius: 8px; border: 2px solid #e0e0e0; font-size: 1rem; margin-right: 1rem;">';
                html += '<option value="">All Categories</option>';
                categories.forEach(function(cat) {
                    const selected = cat.id === currentCategory ? 'selected' : '';
                    html += '<option value="' + cat.id + '" ' + selected + '>' + cat.name + '</option>';
                });
                html += '</select>';
                html += '<button onclick="filterByCategory()" class="btn btn-success" style="padding: 0.8rem 1.2rem;">Apply Filter</button>';
                if (currentCategory) {
                    html += '<button onclick="clearFilter()" class="btn btn-warning" style="padding: 0.8rem 1.2rem; margin-left: 0.5rem;">Clear Filter</button>';
                }
                html += '</div>';
            }

            html += '<div class="flowers-grid">';
            flowers.forEach(function(flower) {
                html += '<div class="flower-card">';
                html += '<div class="flower-category">' + (flower.category || 'CARNATIONS') + '</div>';
                
                // Handle both image formats (single image or images array)
                let imageUrl = null;
                if (flower.image) {
                    imageUrl = flower.image;
                } else if (flower.images && flower.images.length > 0) {
                    // Find primary image or use first one
                    const primaryImage = flower.images.find(img => img.isPrimary);
                    imageUrl = primaryImage ? primaryImage.url : flower.images[0].url;
                }
                
                if (imageUrl) {
                    html += '<img src="' + imageUrl + '" alt="' + flower.name + '" style="width: 100%; max-width: 200px; height: 200px; object-fit: contain; margin: 1rem 0; border-radius: 8px;">';
                }
                
                html += '<div class="flower-name">' + flower.name + '</div>';
                html += '<p>' + flower.description + '</p>';
                html += '<p><strong>Color:</strong> ' + flower.color + '</p>';
                
                // Handle both pricing formats
                let pricePerStem = 0;
                if (flower.pricing && flower.pricing.pricePerStem) {
                    pricePerStem = flower.pricing.pricePerStem;
                } else if (flower.pricePerStem) {
                    pricePerStem = flower.pricePerStem;
                }
                
                html += '<div class="flower-price">$' + pricePerStem.toFixed(2) + '</div>';
                html += '<p>per stem</p>';
                html += '</div>';
            });
            html += '</div>';

            // Add pagination controls
            if (pagination && pagination.totalPages > 1) {
                html += '<div style="text-align: center; margin-top: 3rem; padding: 2rem; background: linear-gradient(135deg, #f0f8f0, #e8f5e8); border-radius: 12px;">';
                html += '<div style="display: flex; justify-content: center; align-items: center; gap: 1rem; flex-wrap: wrap;">';
                
                // Previous button
                if (pagination.hasPrevPage) {
                    html += '<button onclick="loadFlowers(' + (pagination.currentPage - 1) + ', \'' + currentCategory + '\')" class="btn btn-primary">← Previous</button>';
                } else {
                    html += '<button disabled class="btn btn-primary" style="opacity: 0.5;">← Previous</button>';
                }
                
                // Page numbers
                html += '<div style="display: flex; gap: 0.5rem; align-items: center;">';
                for (let i = 1; i <= pagination.totalPages; i++) {
                    if (i === pagination.currentPage) {
                        html += '<button class="btn btn-success" style="font-weight: bold;">' + i + '</button>';
                    } else if (i === 1 || i === pagination.totalPages || Math.abs(i - pagination.currentPage) <= 1) {
                        html += '<button onclick="loadFlowers(' + i + ', \'' + currentCategory + '\')" class="btn" style="background: #f0f0f0; color: #333;">' + i + '</button>';
                    } else if (i === pagination.currentPage - 2 || i === pagination.currentPage + 2) {
                        html += '<span>...</span>';
                    }
                }
                html += '</div>';
                
                // Next button
                if (pagination.hasNextPage) {
                    html += '<button onclick="loadFlowers(' + (pagination.currentPage + 1) + ', \'' + currentCategory + '\')" class="btn btn-primary">Next →</button>';
                } else {
                    html += '<button disabled class="btn btn-primary" style="opacity: 0.5;">Next →</button>';
                }
                
                html += '</div>';
                html += '<div style="margin-top: 1rem; color: #666; font-size: 0.9rem;">Page ' + pagination.currentPage + ' of ' + pagination.totalPages + ' (' + pagination.totalItems + ' flowers)</div>';
                html += '</div>';
            }

            container.innerHTML = html;
        }

        function filterByCategory() {
            const categorySelect = document.getElementById('categoryFilter');
            const selectedCategory = categorySelect.value;
            currentCategory = selectedCategory;
            loadFlowers(1, selectedCategory);
        }

        function clearFilter() {
            currentCategory = '';
            loadFlowers(1, '');
        }

        function getDemoFlowers() {
            const imageHandler = new ImageHandler();
            return [
                {
                    name: 'Standard Carnations',
                    category: 'CARNATIONS',
                    description: 'Premium large-headed carnations with full, ruffled petals. Perfect for bouquets and arrangements.',
                    color: 'Various',
                    image: imageHandler.findBestImage('standard-carnations') || '/images/flowers/carnations/standard-carnations.svg',
                    pricing: { pricePerStem: 0.45 }
                },
                {
                    name: 'Spray Carnations',
                    category: 'CARNATIONS', 
                    description: 'Multi-headed carnations with smaller blooms. Excellent for filler and texture.',
                    color: 'Mixed',
                    image: imageHandler.findBestImage('spray-carnations') || '/images/flowers/carnations/spray-carnations.svg',
                    pricing: { pricePerStem: 0.38 }
                },
                {
                    name: 'Mini Carnations',
                    category: 'CARNATIONS',
                    description: 'Delicate small carnations perfect for corsages and boutonnières.',
                    color: 'Various',
                    image: imageHandler.findBestImage('mini-carnations') || '/images/flowers/carnations/mini-carnations.svg',
                    pricing: { pricePerStem: 0.28 }
                },
                {
                    name: 'Green Carnations',
                    category: 'CARNATIONS',
                    description: 'Unique green carnations for contemporary and eco-themed arrangements.',
                    color: 'Green',
                    image: imageHandler.findBestImage('green-carnations') || '/images/flowers/carnations/green-carnations.svg',
                    pricing: { pricePerStem: 0.52 }
                },
                {
                    name: 'Purple Carnations',
                    category: 'CARNATIONS',
                    description: 'Rich purple carnations symbolizing capriciousness and unpredictability.',
                    color: 'Purple',
                    image: imageHandler.findBestImage('purple-carnations') || '/images/flowers/carnations/purple-carnations.svg',
                    pricing: { pricePerStem: 0.48 }
                },
                {
                    name: 'Yellow Carnations',
                    category: 'CARNATIONS',
                    description: 'Bright yellow carnations bringing sunshine and cheerfulness to any arrangement.',
                    color: 'Yellow',
                    image: imageHandler.findBestImage('yellow-carnations') || '/images/flowers/carnations/yellow-carnations.svg',
                    pricing: { pricePerStem: 0.42 }
                },
                {
                    name: 'White Carnations',
                    category: 'CARNATIONS',
                    description: 'Pure white carnations perfect for weddings and sympathy arrangements.',
                    color: 'White',
                    image: imageHandler.findBestImage('white-carnations') || '/images/flowers/carnations/white-carnations.svg',
                    pricing: { pricePerStem: 0.40 }
                },
                {
                    name: 'Red Carnations',
                    category: 'CARNATIONS',
                    description: 'Classic red carnations perfect for romantic occasions and expressions of love.',
                    color: 'Red',
                    image: imageHandler.findBestImage('red-carnations') || '/images/flowers/carnations/red-carnations.svg',
                    pricing: { pricePerStem: 0.44 }
                },
                {
                    name: 'Pink Carnations',
                    category: 'CARNATIONS',
                    description: 'Soft pink carnations representing gratitude and motherly love.',
                    color: 'Pink',
                    image: imageHandler.findBestImage('pink-carnations') || '/images/flowers/carnations/pink-carnations.svg',
                    pricing: { pricePerStem: 0.41 }
                },
                {
                    name: 'Orange Carnations',
                    category: 'CARNATIONS',
                    description: 'Vibrant orange carnations for energetic and warm arrangements.',
                    color: 'Orange',
                    image: imageHandler.findBestImage('orange-carnations') || '/images/flowers/carnations/orange-carnations.svg',
                    pricing: { pricePerStem: 0.46 }
                },
                {
                    name: 'Bicolor Carnations',
                    category: 'CARNATIONS',
                    description: 'Stunning two-toned carnations with unique color combinations and patterns.',
                    color: 'Bicolor',
                    image: imageHandler.findBestImage('bicolor-carnations') || '/images/flowers/carnations/bicolor-carnations.svg',
                    pricing: { pricePerStem: 0.55 }
                }
            ];
        }

        function showResult(message, type) {
            const container = document.getElementById('globalResult');
            container.textContent = message;
            container.className = 'result ' + type;
        }

        // Add event listeners when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Login button event listeners
            document.getElementById('wholesaler-login').addEventListener('click', function() {
                const email = this.getAttribute('data-email');
                const password = this.getAttribute('data-password');
                const type = this.getAttribute('data-type');
                login(email, password, type);
            });

            document.getElementById('florist-login').addEventListener('click', function() {
                const email = this.getAttribute('data-email');
                const password = this.getAttribute('data-password');
                const type = this.getAttribute('data-type');
                login(email, password, type);
            });

            document.getElementById('admin-login').addEventListener('click', function() {
                const email = this.getAttribute('data-email');
                const password = this.getAttribute('data-password');
                const type = this.getAttribute('data-type');
                login(email, password, type);
            });

            // Load flowers button event listener
            document.getElementById('load-flowers').addEventListener('click', function() {
                loadFlowers();
            });
        });
    </script>
</body>
</html>`);
  });

  // Florist-specific login page
  app.get('/florist', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌸 greenslife - Florist Portal</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f3e8ff 100%);
            min-height: 100vh;
            color: #2e4a2e;
            line-height: 1.6;
        }
        .header { 
            background: linear-gradient(135deg, #be185d 0%, #db2777 50%, #ec4899 100%); 
            color: white; 
            padding: 3rem 0; 
            text-align: center;
            box-shadow: 0 8px 32px rgba(190, 24, 93, 0.3);
            position: relative;
            overflow: hidden;
            margin-bottom: 2rem;
        }
        .header::before {
            content: '🌸';
            position: absolute;
            font-size: 6rem;
            opacity: 0.1;
            animation: float 6s ease-in-out infinite;
            top: 20%;
            left: 10%;
        }
        .header::after {
            content: '💐';
            position: absolute;
            font-size: 4rem;
            opacity: 0.1;
            animation: float 8s ease-in-out infinite reverse;
            top: 60%;
            right: 15%;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        .header h1 { 
            font-size: 3.5rem; 
            margin-bottom: 1rem; 
            font-weight: 800; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p { 
            font-size: 1.4rem; 
            opacity: 0.95; 
            max-width: 600px; 
            margin: 0 auto;
        }
        .container { max-width: 500px; margin: 0 auto; padding: 2rem; }
        .login-card {
            background: linear-gradient(145deg, #ffffff, #fdf2f8); 
            border-radius: 20px; 
            padding: 3rem; 
            box-shadow: 
                0 20px 60px rgba(190, 24, 93, 0.1),
                0 8px 16px rgba(0,0,0,0.05),
                inset 0 1px 0 rgba(255,255,255,0.8);
            border: 1px solid rgba(219, 39, 119, 0.15);
            position: relative;
            overflow: hidden;
            text-align: center;
        }
        .login-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #be185d, #db2777, #ec4899);
        }
        .login-card h2 {
            color: #be185d; 
            margin-bottom: 0.5rem; 
            font-size: 2.2rem; 
            font-weight: 700;
        }
        .login-card p {
            color: #666;
            margin-bottom: 2rem;
            font-size: 1.1rem;
        }
        .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
        }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #2c3e50;
        }
        .form-group input {
            width: 100%;
            padding: 1rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }
        .form-group input:focus {
            outline: none;
            border-color: #db2777;
        }
        .btn {
            padding: 16px 32px;
            border: none;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.4s ease;
            width: 100%;
            margin-top: 1rem;
        }
        .btn-florist {
            background: linear-gradient(135deg, #db2777, #be185d);
            color: white;
            box-shadow: 0 8px 24px rgba(219, 39, 119, 0.4);
        }
        .btn-florist:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 16px 40px rgba(219, 39, 119, 0.3);
        }
        .demo-credentials {
            margin-top: 2rem;
            padding: 1rem;
            background: #fdf2f8;
            border-radius: 8px;
            text-align: left;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        .demo-credentials:hover {
            background: #fce7f3;
        }
        .demo-credentials h4 {
            color: #be185d;
            margin-bottom: 0.5rem;
        }
        .demo-credentials p {
            margin: 0.25rem 0;
            color: #666;
            font-size: 0.9rem;
        }
        .features {
            margin-top: 3rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
        }
        .feature-card {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(190, 24, 93, 0.1);
            border: 1px solid rgba(219, 39, 119, 0.1);
        }
        .feature-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        .feature-title {
            color: #be185d;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        .error-message {
            background: #fee2e2;
            color: #dc2626;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
            text-align: center;
            border: 1px solid #fca5a5;
        }
        .success-message {
            background: #dcfce7;
            color: #166534;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
            text-align: center;
            border: 1px solid #86efac;
        }
        .back-link {
            display: inline-block;
            margin-top: 2rem;
            color: #db2777;
            text-decoration: none;
            font-weight: 600;
        }
        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌸 greenslife Florist Portal</h1>
        <p>Your trusted partner for fresh, beautiful flowers - designed specifically for florists</p>
    </div>

    <div class="container">
        <div class="login-card">
            <h2>Welcome Back, Florist!</h2>
            <p>Access your personalized flower catalog with per-stem pricing</p>
            
            <form id="floristLoginForm">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="btn btn-florist">Login to Florist Portal</button>
            </form>
            
            <div id="loginResult"></div>
            
            <div class="demo-credentials" onclick="fillDemoCredentials()">
                <h4>🌺 Demo Florist Account</h4>
                <p><strong>Email:</strong> florist@test.com</p>
                <p><strong>Password:</strong> password123</p>
                <p><em>Click here to auto-fill demo credentials</em></p>
            </div>
        </div>
        
        <div class="features">
            <div class="feature-card">
                <div class="feature-icon">🌹</div>
                <div class="feature-title">Per-Stem Pricing</div>
                <p>Perfect for small orders and boutique arrangements</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">💐</div>
                <div class="feature-title">Flexible Quantities</div>
                <p>Order exactly what you need for your arrangements</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🚚</div>
                <div class="feature-title">Fresh Delivery</div>
                <p>Premium flowers delivered fresh to your shop</p>
            </div>
        </div>
        
        <a href="/" class="back-link">← Back to Main Portal</a>
    </div>

    <script>
        function fillDemoCredentials() {
            document.getElementById('email').value = 'florist@test.com';
            document.getElementById('password').value = 'password123';
        }

        document.getElementById('floristLoginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password')
            };
            
            const resultDiv = document.getElementById('loginResult');
            resultDiv.innerHTML = '';
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Store token and user info
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    
                    // Check if user is actually a florist
                    if (result.user.userType !== 'florist') {
                        resultDiv.innerHTML = '<div class="error-message">This account is not registered as a florist. Please use the appropriate login portal for ' + result.user.userType + ' accounts.</div>';
                        return;
                    }
                    
                    resultDiv.innerHTML = '<div class="success-message">🌸 Login successful! Redirecting to your florist dashboard...</div>';
                    
                    // Redirect to React client for florists
                    setTimeout(() => {
                        window.location.href = 'http://localhost:3000';
                    }, 1500);
                } else {
                    resultDiv.innerHTML = '<div class="error-message">' + result.message + '</div>';
                }
            } catch (error) {
                console.error('Login error:', error);
                resultDiv.innerHTML = '<div class="error-message">Login failed. Please try again.</div>';
            }
        });
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

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'connected',
        email: 'initialized'
      }
    });
  });

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/flowers', require('./routes/flowers'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/payments', require('./routes/payments'));
  app.use('/api/admin', require('./routes/admin'));

  // Serve static files from public directory (images, etc.)
  app.use(express.static(path.join(__dirname, 'public')));

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