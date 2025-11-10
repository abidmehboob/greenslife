# GreenLife - Flower Distribution Ecommerce Platform

A complete MERN stack ecommerce application for flower distribution with hybrid database architecture and role-based interfaces for wholesalers and florists.

## 🌸 Features

### User Management
- **Two User Types**: Wholesaler and Florist accounts with different pricing structures
- **JWT Authentication**: Secure login and registration system
- **User Profiles**: Comprehensive business information management

### Product Management
- **Comprehensive Flower Catalog**: 10 varieties including carnations, spray carnations, roses, and lilies
- **Dual Pricing System**: Box quantities (25 stems) for wholesalers, individual stems for florists
- **Detailed Product Information**: Images, descriptions, colors, pricing, and specifications
- **Mock Data Integration**: Complete catalog with fallback system for reliable display

### Shopping Experience
- **Shopping Cart**: Add/remove items with quantity validation
- **Order Management**: Full order lifecycle from creation to delivery
- **Order History**: Track all previous orders with detailed information
- **Minimum Quantities**: Automatic validation based on user type

### Payment Integration
- **Multiple Payment Methods**: Stripe, PayU (Poland), Bank Transfer
- **Secure Processing**: PCI compliant payment handling
- **Order Tracking**: Real-time order status updates

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js framework
- **Hybrid Database Architecture**: MongoDB for catalog, SQLite for transactions
- **JWT Authentication** with bcrypt password hashing
- **Payment Integration**: Stripe and PayU (Poland) ready
- **Comprehensive API**: RESTful endpoints with validation
- **Security**: Helmet, CORS, rate limiting

### Frontend
- **React** with TypeScript
- **Material-UI v5** with responsive design
- **React Router** for client-side navigation
- **Context API** for state management
- **Axios** for HTTP requests
- **Form Validation** with comprehensive error handling

## 📁 Project Structure

```
flower/
├── server.js                 # Main server entry point
├── package.json             # Server dependencies
├── config/
│   └── database.js          # Hybrid database configuration
├── models/
│   ├── mongo/               # MongoDB models (Flower, Category)
│   └── postgres/            # SQLite models (User, Order, Payment)
├── routes/                  # API endpoints
│   ├── auth.js             # Authentication routes
│   ├── flowers.js          # Flower catalog API
│   ├── orders.js           # Order management
│   └── payments.js         # Payment processing
├── middleware/              # Authentication & validation
├── scripts/                 # Testing and utility scripts
├── storage/                 # In-memory data storage
├── client/                  # React frontend (TypeScript)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React Context providers
│   │   ├── pages/          # Route components
│   │   ├── services/       # API service layer
│   │   └── types/          # TypeScript definitions
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Git for version control
- npm or yarn package manager
- MongoDB (optional - uses mock data if unavailable)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abidmehboob/greenslife.git
   cd greenslife
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Configuration** (Optional)
   
   Create `.env` file in root directory for production:
   ```env
   NODE_ENV=development
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/flower-distribution
   JWT_SECRET=your_jwt_secret_key_here_make_it_very_long_and_random
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:3000
   
   # Payment Configuration (Optional)
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   PAYU_CLIENT_ID=your_payu_client_id
   PAYU_CLIENT_SECRET=your_payu_client_secret
   ```

   Create `client/.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5001/api
   ```

   **Note**: The application works without environment files using default settings.

5. **Quick Start**
   ```bash
   # Start the backend server
   npm start
   
   # In a new terminal, start the frontend
   cd client
   npm start
   ```

   **Note**: SQLite database and test users are created automatically on first run.

### Development

1. **Start backend server**
   ```bash
   npm start
   ```

2. **Start frontend development server** (in new terminal)
   ```bash
   cd client
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

### Test Users (Already Created)
- **Wholesaler**: `wholesaler@test.com` / `password123`
- **Florist**: `florist@test.com` / `password123`
- **Admin**: `admin@test.com` / `password123`

### Production Build

1. **Build the React app**
   ```bash
   cd client
   npm run build
   ```

2. **Test production build locally**
   ```bash
   cd ..
   npm start
   ```

## 🏪 User Types & Interfaces

### Wholesaler Account
- **Box Pricing**: Products displayed in box quantities (25 stems per box)
- **Bulk Pricing**: Optimized pricing for large volume orders
- **Professional Interface**: Business-focused UI and features
- **Order Management**: Track large orders with detailed history

### Florist Account  
- **Individual Pricing**: Products shown per stem for retail flexibility
- **Small Quantity Orders**: Perfect for boutique flower shops
- **Flexible Quantities**: Order exactly what you need
- **Retail-Focused**: Interface designed for small business needs

## 🌍 Deployment

### Render.com (Free Hosting)

1. **Prepare for deployment**
   ```bash
   # Ensure production build works
   npm run build
   ```

2. **Deploy Backend to Render**
   - Connect GitHub repository: https://github.com/abidmehboob/greenslife
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Environment variables: Set `NODE_ENV=production`

3. **Deploy Frontend**
   - Deploy `client/` folder to Vercel or Netlify
   - Set build command: `npm run build`
   - Set build directory: `build`
   - Update API URL to point to your Render backend

### Environment Variables for Production
```env
NODE_ENV=production
JWT_SECRET=your_production_jwt_secret_very_long_and_random
CLIENT_URL=https://your-frontend-domain.vercel.app
PORT=5001

# Optional: For MongoDB (uses mock data if not provided)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/flower-distribution

# Optional: For payments
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
PAYU_CLIENT_ID=your_production_payu_id
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Flowers
- `GET /api/flowers` - Get flowers (with user-specific pricing)
- `GET /api/flowers/:id` - Get flower details
- `GET /api/flowers/meta/categories` - Get categories
- `GET /api/flowers/meta/colors` - Get colors

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/cancel` - Cancel order

### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe payment
- `POST /api/payments/payu/create-order` - Create PayU payment
- `GET /api/payments/methods` - Get available payment methods

## 🧪 Testing

The application includes comprehensive testing scripts:

```bash
# Test user creation and authentication
node scripts/testLogin.js

# Test flowers API endpoint
node scripts/testFlowersAPI.js

# Test end-to-end functionality
node scripts/testEndToEnd.js

# Create additional test users
node scripts/createTestUsers.js
```

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: API request throttling
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Joi schema validation
- **CORS Configuration**: Cross-origin request handling
- **Password Hashing**: bcrypt for secure password storage

## 🌟 Current Implementation Status

| Feature | Status | Description |
|---------|--------|-------------|
| User Authentication | ✅ Complete | JWT-based login/register system |
| Flower Catalog | ✅ Complete | 10 varieties with images and pricing |
| Role-based Pricing | ✅ Complete | Wholesaler (box) vs Florist (stem) pricing |
| Shopping Cart | ✅ Complete | Add/remove items with quantity validation |
| Order Management | ✅ Complete | Create and track orders |
| Payment Integration | 🔄 Ready | Stripe and PayU integration prepared |
| Responsive Design | ✅ Complete | Mobile-friendly Material-UI interface |
| Database Architecture | ✅ Complete | Hybrid MongoDB/SQLite system |

## 🛣 Future Enhancements

- [ ] Complete payment processing implementation
- [ ] Email notifications for order updates
- [ ] Admin panel for flower catalog management
- [ ] Inventory tracking and stock management
- [ ] Multi-language support (Polish/English)
- [ ] Mobile app version (React Native)
- [ ] Advanced analytics and reporting
- [ ] Customer loyalty program

## 📞 Support

For support or questions, create an issue in the GitHub repository: https://github.com/abidmehboob/greenslife/issues

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🗂️ Repository Structure

```
├── 📁 config/           # Database configuration (hybrid architecture)
├── 📁 middleware/       # Authentication and validation middleware  
├── 📁 models/           # Database models (MongoDB + SQLite)
├── 📁 routes/           # API endpoints (auth, flowers, orders, payments)
├── 📁 scripts/          # Testing and utility scripts
├── 📁 storage/          # In-memory data storage
├── 📁 client/           # React TypeScript frontend
├── 📄 server.js         # Main server entry point  
├── 📄 package.json      # Dependencies and scripts
└── 📄 README.md         # This documentation
```

---

Made with ❤️ for the flower distribution industry • **GreenLife** 🌱