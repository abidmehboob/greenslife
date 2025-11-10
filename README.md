# FlowerHub - Flower Distribution Ecommerce Platform

A MERN stack ecommerce application for flower distribution with two distinct user interfaces for wholesalers and florists.

## 🌸 Features

### User Management
- **Two User Types**: Wholesaler and Florist accounts with different pricing structures
- **JWT Authentication**: Secure login and registration system
- **User Profiles**: Comprehensive business information management

### Product Management
- **Flower Catalog**: Premium carnations and spray carnations from Netherlands
- **Dual Pricing**: Box quantities for wholesalers, individual stems for florists
- **Smart Filtering**: Search by category, color, and availability
- **Detailed Specifications**: Stem length, vase life, origin information

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
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Stripe** for payment processing
- **Helmet** for security
- **Rate limiting** for API protection

### Frontend
- **React** with TypeScript
- **Material-UI** for components
- **React Router** for navigation
- **React Hook Form** with Yup validation
- **Axios** for API calls
- **Context API** for state management

## 📁 Project Structure

```
flower/
├── backend files (server.js, models, routes, middleware)
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
├── seed.js
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flower
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

4. **Environment Configuration**
   
   Create `.env` file in root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/flower-distribution
   JWT_SECRET=your_jwt_secret_key_here_make_it_very_long_and_random
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:3000
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   
   # Payment Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   
   # Polish Payment Provider (PayU)
   PAYU_CLIENT_ID=your_payu_client_id
   PAYU_CLIENT_SECRET=your_payu_client_secret
   PAYU_ENVIRONMENT=sandbox
   ```

   Create `client/.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   ```

5. **Database Setup**
   ```bash
   # Make sure MongoDB is running
   # Seed the database with sample flowers
   npm run seed
   ```

### Development

1. **Start backend server**
   ```bash
   npm run dev
   ```

2. **Start frontend development server** (in new terminal)
   ```bash
   npm run client
   ```

3. **Start both simultaneously**
   ```bash
   npm run dev-full
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Build

1. **Build the React app**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🏪 User Types & Interfaces

### Wholesaler Account
- **Box Pricing**: Products shown in box quantities (25 stems per box)
- **Volume Discounts**: Special pricing for bulk orders
- **Minimum Orders**: 2 boxes minimum per flower type
- **Business Features**: Tax number, wholesale pricing tiers

### Florist Account
- **Individual Pricing**: Products shown per stem
- **Flexible Quantities**: Lower minimum order quantities
- **Retail Focus**: Pricing optimized for small businesses
- **Mixed Orders**: Easy ordering of different flower types

## 🌍 Deployment

### Render.com (Free Hosting)

1. **Prepare for deployment**
   ```bash
   # Ensure production build works
   npm run build
   ```

2. **Deploy to Render**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Add environment variables in Render dashboard

3. **MongoDB Atlas**
   - Create a free MongoDB Atlas account
   - Update `MONGODB_URI` in environment variables

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/flower-distribution
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://your-app.render.com
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

```bash
# Run backend tests
npm test

# Run frontend tests
cd client && npm test
```

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: API request throttling
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Joi schema validation
- **CORS Configuration**: Cross-origin request handling
- **Password Hashing**: bcrypt for secure password storage

## 🌟 Features by User Type

| Feature | Wholesaler | Florist |
|---------|------------|---------|
| Pricing Display | Per box (25 stems) | Per stem |
| Minimum Quantity | 2 boxes | 10 stems |
| Volume Discounts | ✅ | ❌ |
| Tax Information | Required | Optional |
| Priority Support | ✅ | Standard |

## 🛣 Roadmap

- [ ] Admin panel for flower management
- [ ] Inventory management system
- [ ] Email notifications for orders
- [ ] Mobile app (React Native)
- [ ] Multi-language support (Polish/English)
- [ ] Advanced analytics dashboard
- [ ] Loyalty program for repeat customers

## 📞 Support

For support, email support@flowerhub.pl or create an issue in the repository.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Made with ❤️ for the Polish flower distribution industry