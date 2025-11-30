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

  // Main frontend application
  app.get('/app', (req, res) => {
    res.send(`
    <!DOCTYPE html>
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
                position: relative;
                overflow: hidden;
            }
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="80" fill="%23ffffff10">🌸</text></svg>') repeat;
                opacity: 0.1;
            }
            .header h1 {
                font-size: 3rem;
                margin-bottom: 0.5rem;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                position: relative;
                z-index: 1;
            }
            .header p {
                font-size: 1.2rem;
                opacity: 0.9;
                position: relative;
                z-index: 1;
            }
            .card { 
                background: white; 
                border-radius: 15px; 
                padding: 2rem; 
                margin-bottom: 2rem; 
                box-shadow: 0 5px 25px rgba(0,0,0,0.1);
                border: 1px solid #e8f5e8;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 35px rgba(0,0,0,0.15);
            }
            .btn { 
                padding: 14px 28px; 
                border: none; 
                border-radius: 8px; 
                cursor: pointer; 
                font-weight: 600; 
                margin: 8px; 
                transition: all 0.3s ease;
                font-size: 1rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .btn-primary { background: linear-gradient(135deg, #007bff, #0056b3); color: white; }
            .btn-success { background: linear-gradient(135deg, #28a745, #1e7e34); color: white; }
            .btn-warning { background: linear-gradient(135deg, #ffc107, #e0a800); color: #212529; }
            .btn-danger { background: linear-gradient(135deg, #dc3545, #c82333); color: white; }
            .btn:hover { 
                transform: translateY(-3px); 
                box-shadow: 0 6px 20px rgba(0,0,0,0.25);
            }
            .btn:active {
                transform: translateY(-1px);
                box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            }
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
                position: relative;
                overflow: hidden;
            }
            .flower-card:hover {
                border-color: #28a745;
                transform: translateY(-5px);
                box-shadow: 0 8px 25px rgba(40, 167, 69, 0.2);
            }
            .flower-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(40, 167, 69, 0.1), transparent);
                transition: left 0.5s;
            }
            .flower-card:hover::before {
                left: 100%;
            }
            .flower-card img { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem; }
            .flower-price { font-size: 1.4rem; font-weight: bold; color: #28a745; margin: 0.5rem 0; }
            .flower-name { font-size: 1.2rem; font-weight: bold; color: #2d5016; margin-bottom: 0.5rem; }
            .flower-category { 
                background: linear-gradient(135deg, #28a745, #20c997); 
                color: white; 
                padding: 0.2rem 0.8rem; 
                border-radius: 15px; 
                font-size: 0.8rem; 
                font-weight: 600;
                display: inline-block;
                margin-bottom: 0.5rem;
            }
            .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 2px solid #e8f5e8; background: #f8f9fa; margin-bottom: 0.5rem; border-radius: 8px; }
            .navbar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; }
            .user-info { 
                background: rgba(255,255,255,0.3); 
                padding: 0.8rem 1.5rem; 
                border-radius: 25px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            }
            .logo {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.5rem;
                font-weight: bold;
            }
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            .feature-item {
                text-align: center;
                padding: 1rem;
                border-radius: 10px;
                background: rgba(255,255,255,0.7);
                transition: all 0.3s ease;
            }
            .feature-item:hover {
                background: white;
                transform: translateY(-3px);
            }
            .feature-icon {
                font-size: 2rem;
                margin-bottom: 0.5rem;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="container">
                <div class="navbar">
                    <div class="logo">
                        <span>🌸</span>
                        <span>greenslife</span>
                    </div>
                    <div class="user-info" id="userInfo" style="display: none;">
                        <span id="userType"></span> | <span id="userBusiness"></span>
                        <button class="btn btn-danger" onclick="logout()" style="margin-left: 10px;">Logout</button>
                    </div>
                </div>
                <h1>Professional Flower Distribution Platform</h1>
                <p>Connecting wholesalers and florists with premium fresh flowers worldwide</p>
                <div class="features-grid">
                    <div class="feature-item">
                        <div class="feature-icon">🌹</div>
                        <h4>Premium Quality</h4>
                        <p>Fresh cut flowers from certified growers</p>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🚚</div>
                        <h4>Fast Delivery</h4>
                        <p>Express shipping to maintain freshness</p>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">💼</div>
                        <h4>B2B Platform</h4>
                        <p>Tailored pricing for business customers</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="container">
            <!-- Login Section -->
            <div class="card" id="loginSection">
                <h2>🔐 Welcome to greenslife</h2>
                <p style="font-size: 1.1rem; margin-bottom: 2rem; color: #666;">Choose your account type to access personalized pricing and features:</p>
                <div class="grid">
                    <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 1.5rem; border-radius: 12px; border: 2px solid #2196f3;">
                        <h3 style="color: #1976d2; margin-bottom: 1rem;">👔 Wholesaler Portal</h3>
                        <p style="margin-bottom: 1.5rem; color: #555;">Bulk quantities (25+ stems) with wholesale pricing<br><strong>Perfect for:</strong> Distributors, Large florists, Event planners</p>
                        <button class="btn btn-primary" onclick="login('wholesaler@test.com', 'password123', 'Wholesaler')">
                            🏢 Enter Wholesaler Portal
                        </button>
                    </div>
                    <div style="background: linear-gradient(135deg, #e8f5e8, #f1f8e9); padding: 1.5rem; border-radius: 12px; border: 2px solid #4caf50;">
                        <h3 style="color: #2e7d32; margin-bottom: 1rem;">🌺 Florist Dashboard</h3>
                        <p style="margin-bottom: 1.5rem; color: #555;">Individual stems and small quantities<br><strong>Perfect for:</strong> Retail florists, Boutique shops, Designers</p>
                        <button class="btn btn-success" onclick="login('florist@test.com', 'password123', 'Florist')">
                            🌸 Enter Florist Dashboard
                        </button>
                    </div>
                    <div style="background: linear-gradient(135deg, #fff3e0, #fce4ec); padding: 1.5rem; border-radius: 12px; border: 2px solid #ff9800;">
                        <h3 style="color: #f57c00; margin-bottom: 1rem;">⚙️ Administrator Panel</h3>
                        <p style="margin-bottom: 1.5rem; color: #555;">Full system access and management<br><strong>Perfect for:</strong> System administrators, Platform managers</p>
                        <button class="btn btn-warning" onclick="login('admin@test.com', 'password123', 'Admin')">
                            🛠️ Enter Admin Panel
                        </button>
                    </div>
                </div>
                <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; text-align: center;">
                    <p style="color: #666; margin: 0;"><strong>Demo Credentials:</strong> All passwords are 'password123' for testing purposes</p>
                </div>
            </div>

            <!-- Main Application -->
            <div class="auth-section" id="mainApp">
                <!-- Flowers Catalog -->
                <div class="card">
                    <h2>🌸 Premium Flower Catalog</h2>
                    <p style="font-size: 1.1rem; color: #666; margin-bottom: 1.5rem;">Discover our premium carnation collection with role-based pricing</p>
                    <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <p style="margin: 0; color: #495057;"><strong>Pricing Note:</strong> 
                            <span id="pricingInfo">Login to see personalized pricing for your business type</span>
                        </p>
                    </div>
                    <button class="btn btn-primary" onclick="loadFlowers()" style="font-size: 1.1rem; padding: 1rem 2rem;">
                        🌹 Browse Carnation Collection
                    </button>
                    <div id="flowersResult"></div>
                </div>

                <!-- Shopping Cart -->
                <div class="card">
                    <h2>🛒 Shopping Cart</h2>
                    <div id="cartItems">Cart is empty</div>
                    <div id="cartTotal" style="margin-top: 1rem; font-weight: bold;"></div>
                    <button class="btn btn-success" onclick="checkout()" id="checkoutBtn" style="display: none;">
                        Proceed to Checkout
                    </button>
                </div>

                <!-- Order Management -->
                <div class="card">
                    <h2>📦 Order Management</h2>
                    <button class="btn btn-primary" onclick="loadOrders()">Load My Orders</button>
                    <div id="ordersResult"></div>
                </div>
            </div>

            <!-- Results Display -->
            <div class="card">
                <h2>📊 System Status & Results</h2>
                <div id="globalResult" class="info">
                    Ready to test greenslife functionality...
                </div>
            </div>
        </div>

        <script>
            let currentUser = null;
            let currentToken = null;
            let cart = [];

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

                    // Update UI
                    document.getElementById('loginSection').style.display = 'none';
                    document.getElementById('mainApp').style.display = 'block';
                    document.getElementById('userInfo').style.display = 'block';
                    document.getElementById('userType').textContent = data.user.userType.toUpperCase();
                    document.getElementById('userBusiness').textContent = data.user.businessName;
                    
                    // Update pricing info based on user type
                    const pricingInfo = document.getElementById('pricingInfo');
                    if (data.user.userType === 'wholesaler') {
                        pricingInfo.textContent = 'Wholesaler pricing: Bulk quantities (25+ stems per box) with volume discounts';
                        pricingInfo.style.color = '#1976d2';
                    } else if (data.user.userType === 'florist') {
                        pricingInfo.textContent = 'Florist pricing: Individual stems perfect for retail arrangements';
                        pricingInfo.style.color = '#2e7d32';
                    } else {
                        pricingInfo.textContent = 'Administrator view: All pricing and inventory management';
                        pricingInfo.style.color = '#f57c00';
                    }

                    showResult('✅ Welcome ' + data.user.businessName + '!\n' + userType + ' login successful\nEmail: ' + data.user.email + '\nAccess Level: ' + data.user.userType.toUpperCase() + '\n\nYou can now browse our premium flower catalog with personalized pricing.', 'success');
                } catch (error) {
                    showResult('❌ ' + userType + ' Login Failed: ' + error.message, 'error');
                }
            }

            function logout() {
                currentUser = null;
                currentToken = null;
                cart = [];
                document.getElementById('loginSection').style.display = 'block';
                document.getElementById('mainApp').style.display = 'none';
                document.getElementById('userInfo').style.display = 'none';
                updateCart();
                showResult('Logged out successfully', 'info');
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
                    showResult('✅ Loaded ' + (data.flowers?.length || 0) + ' flowers for ' + (currentUser?.userType || 'guest') + ' pricing', 'success');
                } catch (error) {
                    showResult('❌ Failed to load flowers: ' + error.message, 'error');
                }
            }

            function displayFlowers(flowers) {
                const container = document.getElementById('flowersResult');
                
                // If no flowers from API, show demo carnation varieties
                if (!flowers.length) {
                    flowers = getDemoCarnations();
                }

                const html = \`
                    <div class="flowers-grid">
                        \${flowers.map(flower => \`
                            <div class="flower-card">
                                <div class="flower-category">\${flower.category || 'CARNATIONS'}</div>
                                <div class="flower-name">\${flower.name}</div>
                                <p style="color: #666; margin-bottom: 1rem;">\${flower.description}</p>
                                <p><strong>Color:</strong> \${flower.color}</p>
                                <p><strong>Stem Length:</strong> \${flower.stemLength || '40-60cm'}</p>
                                <div class="flower-price">$\${flower.price}</div>
                                <p style="color: #888; font-size: 0.9rem;">per \${flower.unit}</p>
                                <button class="btn btn-success" onclick="addToCart('\${flower._id || flower.id}', '\${flower.name}', \${flower.price}, '\${flower.unit}')" style="margin-top: 1rem;">
                                    🛍️ Add to Cart
                                </button>
                            </div>
                        \`).join('')}
                    </div>
                \`;
                container.innerHTML = html;
            }
            
            function getDemoCarnations() {
                return [
                    {
                        id: 'carn-antica',
                        name: 'Antigua',
                        category: 'CARNATIONS',
                        description: 'Classic white carnations with excellent vase life',
                        color: 'Pure White',
                        stemLength: '50-60cm',
                        price: currentUser?.userType === 'wholesaler' ? 1.25 : 2.50,
                        unit: currentUser?.userType === 'wholesaler' ? 'stem (box of 25)' : 'stem'
                    },
                    {
                        id: 'carn-bach',
                        name: 'Bach',
                        category: 'CARNATIONS', 
                        description: 'Elegant pink carnations perfect for arrangements',
                        color: 'Soft Pink',
                        stemLength: '40-50cm',
                        price: currentUser?.userType === 'wholesaler' ? 1.30 : 2.60,
                        unit: currentUser?.userType === 'wholesaler' ? 'stem (box of 25)' : 'stem'
                    },
                    {
                        id: 'carn-bernard',
                        name: 'Bernard',
                        category: 'CARNATIONS',
                        description: 'Deep red carnations with strong fragrance',
                        color: 'Deep Red',
                        stemLength: '50-60cm', 
                        price: currentUser?.userType === 'wholesaler' ? 1.40 : 2.80,
                        unit: currentUser?.userType === 'wholesaler' ? 'stem (box of 25)' : 'stem'
                    },
                    {
                        id: 'carn-bizet',
                        name: 'Bizet',
                        category: 'CARNATIONS',
                        description: 'Striped carnations with unique patterns',
                        color: 'Pink & White Striped',
                        stemLength: '45-55cm',
                        price: currentUser?.userType === 'wholesaler' ? 1.50 : 3.00,
                        unit: currentUser?.userType === 'wholesaler' ? 'stem (box of 25)' : 'stem' 
                    },
                    {
                        id: 'carn-brut',
                        name: 'Brut',
                        category: 'CARNATIONS',
                        description: 'Cream colored carnations with ruffled edges',
                        color: 'Cream',
                        stemLength: '50-60cm',
                        price: currentUser?.userType === 'wholesaler' ? 1.35 : 2.70,
                        unit: currentUser?.userType === 'wholesaler' ? 'stem (box of 25)' : 'stem'
                    },
                    {
                        id: 'carn-caroline',
                        name: 'Caroline',
                        category: 'CARNATIONS', 
                        description: 'Lavender carnations with delicate petals',
                        color: 'Lavender',
                        stemLength: '40-50cm',
                        price: currentUser?.userType === 'wholesaler' ? 1.45 : 2.90,
                        unit: currentUser?.userType === 'wholesaler' ? 'stem (box of 25)' : 'stem'
                    },
                    {
                        id: 'carn-damascus',
                        name: 'Damascus',
                        category: 'CARNATIONS',
                        description: 'Premium burgundy carnations',
                        color: 'Burgundy',
                        stemLength: '55-65cm',
                        price: currentUser?.userType === 'wholesaler' ? 1.60 : 3.20,
                        unit: currentUser?.userType === 'wholesaler' ? 'stem (box of 25)' : 'stem'
                    },
                    {
                        id: 'carn-damascus-purple',
                        name: 'Damascus Purple',
                        category: 'CARNATIONS',
                        description: 'Rich purple carnations, premium variety',
                        color: 'Deep Purple', 
                        stemLength: '55-65cm',
                        price: currentUser?.userType === 'wholesaler' ? 1.65 : 3.30,
                        unit: currentUser?.userType === 'wholesaler' ? 'stem (box of 25)' : 'stem'
                    },
                    {
                        id: 'carn-golem',
                        name: 'Golem',
                        category: 'CARNATIONS',
                        description: 'Large headed yellow carnations',
                        color: 'Bright Yellow',
                        stemLength: '50-60cm',
                        price: currentUser?.userType === 'wholesaler' ? 1.55 : 3.10,
                        unit: currentUser?.userType === 'wholesaler' ? 'stem (box of 25)' : 'stem'
                    },
                    {
                        id: 'carn-hermes',
                        name: 'Hermes',
                        category: 'CARNATIONS',
                        description: 'Orange carnations with excellent longevity',
                        color: 'Vibrant Orange',
                        stemLength: '45-55cm',
                        price: currentUser?.userType === 'wholesaler' ? 1.50 : 3.00,
                        unit: currentUser?.userType === 'wholesaler' ? 'stem (box of 25)' : 'stem'
                    },
                    {
                        id: 'carn-komachi',
                        name: 'Komachi',
                        category: 'CARNATIONS',
                        description: 'Bi-color carnations with pink edges',
                        color: 'White with Pink Edges',
                        stemLength: '40-50cm',
                        price: currentUser?.userType === 'wholesaler' ? 1.70 : 3.40,
                        unit: currentUser?.userType === 'wholesaler' ? 'stem (box of 25)' : 'stem'
                    }
                ];
            }

            function addToCart(id, name, price, unit) {
                const existing = cart.find(item => item.id === id);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    cart.push({ id, name, price, unit, quantity: 1 });
                }
                updateCart();
                showResult(\`Added \${name} to cart\`, 'success');
            }

            function removeFromCart(id) {
                cart = cart.filter(item => item.id !== id);
                updateCart();
            }

            function updateCart() {
                const container = document.getElementById('cartItems');
                const totalContainer = document.getElementById('cartTotal');
                const checkoutBtn = document.getElementById('checkoutBtn');

                if (!cart.length) {
                    container.innerHTML = 'Cart is empty';
                    totalContainer.innerHTML = '';
                    checkoutBtn.style.display = 'none';
                    return;
                }

                const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                
                container.innerHTML = cart.map(item => \`
                    <div class="cart-item">
                        <div>
                            <strong>\${item.name}</strong><br>
                            $\${item.price} x \${item.quantity} = $\${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button class="btn btn-danger" onclick="removeFromCart('\${item.id}')">Remove</button>
                    </div>
                \`).join('');

                totalContainer.innerHTML = \`<strong>Total: $\${total.toFixed(2)}</strong>\`;
                checkoutBtn.style.display = 'block';
            }

            async function checkout() {
                if (!cart.length || !currentToken) {
                    showResult('❌ Cannot checkout: Cart empty or not logged in', 'error');
                    return;
                }

                try {
                    showResult('Processing checkout...', 'info');
                    const orderData = {
                        items: cart.map(item => ({
                            flowerId: item.id,
                            quantity: item.quantity,
                            price: item.price
                        })),
                        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                        deliveryAddress: {
                            street: '123 Test Street',
                            city: 'Test City',
                            postalCode: '12345',
                            country: 'Test Country'
                        }
                    };

                    const response = await fetch('/api/orders', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': \`Bearer \${currentToken}\`
                        },
                        body: JSON.stringify(orderData)
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(\`HTTP \${response.status}: \${JSON.stringify(data)}\`);
                    }

                    // Clear cart on successful order
                    cart = [];
                    updateCart();
                    showResult(\`✅ Order Created Successfully!\\nOrder ID: \${data.order?.id || 'N/A'}\\nTotal: $\${data.order?.totalAmount || 'N/A'}\\nStatus: \${data.order?.status || 'N/A'}\`, 'success');
                } catch (error) {
                    showResult(\`❌ Checkout Failed: \${error.message}\`, 'error');
                }
            }

            async function loadOrders() {
                if (!currentToken) {
                    showResult('❌ Please login to view orders', 'error');
                    return;
                }

                try {
                    showResult('Loading orders...', 'info');
                    const response = await fetch('/api/orders', {
                        headers: { 'Authorization': \`Bearer \${currentToken}\` }
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(\`HTTP \${response.status}: \${JSON.stringify(data)}\`);
                    }

                    const ordersHtml = (data.orders || []).map(order => \`
                        <div class="cart-item">
                            <div>
                                <strong>Order #\${order.id}</strong><br>
                                Total: $\${order.totalAmount}<br>
                                Status: \${order.status}<br>
                                Date: \${new Date(order.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    \`).join('');

                    document.getElementById('ordersResult').innerHTML = ordersHtml || '<p>No orders found</p>';
                    showResult(\`✅ Loaded \${data.orders?.length || 0} orders\`, 'success');
                } catch (error) {
                    showResult(\`❌ Failed to load orders: \${error.message}\`, 'error');
                }
            }

            function showResult(message, type = 'info') {
                const container = document.getElementById('globalResult');
                container.textContent = message;
                container.className = \`result \${type}\`;
            }

            // Auto-test server health on page load
            window.onload = function() {
                showResult('🌸 greenslife Platform Ready - Please login to continue', 'info');
            };
        </script>
    </body>
    </html>
    `);
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