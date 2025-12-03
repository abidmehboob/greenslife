# SQLite Transactional Database Setup

This document explains how transactional data (orders, payments, users) is stored in SQLite for optimal performance and reliability.

## Database Architecture

The application uses a **hybrid database architecture**:

- **MongoDB**: Product catalog data (flowers, categories) - optimized for flexible schema
- **SQLite**: Transactional data (users, orders, payments) - ACID compliant for financial data

## Why SQLite for Transactions?

1. **ACID Compliance**: Ensures data integrity for financial transactions
2. **Performance**: Faster for relational queries and transactions
3. **Reliability**: File-based storage with automatic backups
4. **Development**: No additional server setup required
5. **Production**: Easy migration to PostgreSQL if needed

## Database Setup

### Automatic Initialization

The SQLite database is automatically created when the server starts:

```javascript
// config/database.js
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/flower_ecommerce.db',
  logging: false
});
```

### Manual Database Operations

```bash
# Initialize SQLite database with test data
npm run db:init

# Test transactional functionality
npm run db:test

# View database statistics
npm run db:stats
```

## Data Models

### User Model (SQLite)
```javascript
// Stores user accounts with business information
{
  id: UUID,
  email: String (unique),
  userType: 'wholesaler' | 'florist' | 'admin',
  businessName: String,
  businessAddress: JSON,
  // Polish business fields
  nip: String,
  regon: String,
  krs: String,
  verified: Boolean,
  isActive: Boolean
}
```

### Order Model (SQLite)
```javascript
// Stores all order transactions
{
  id: UUID,
  userId: UUID,
  orderNumber: String (unique),
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered',
  items: JSON, // Array of ordered flowers
  subtotal: Decimal,
  shippingCost: Decimal,
  tax: Decimal,
  total: Decimal,
  shippingAddress: JSON,
  paymentStatus: 'pending' | 'paid' | 'failed'
}
```

### Payment Model (SQLite)
```javascript
// Stores payment transactions
{
  id: UUID,
  orderId: UUID,
  userId: UUID,
  amount: Decimal,
  currency: String,
  method: 'card' | 'transfer' | 'payu',
  status: 'pending' | 'completed' | 'failed',
  transactionId: String (unique),
  providerResponse: JSON,
  refundAmount: Decimal
}
```

## Relationships

The SQLite models maintain proper foreign key relationships:

- **User → Orders**: One-to-many (user can have multiple orders)
- **User → Payments**: One-to-many (user can have multiple payments)
- **Order → Payments**: One-to-many (order can have multiple payment attempts)

## Migration from PostgreSQL

The models were migrated from PostgreSQL with these key changes:

1. **JSONB → JSON**: PostgreSQL-specific JSONB replaced with standard JSON
2. **UUID Support**: Maintained UUID primary keys for consistency
3. **Enum Types**: Preserved enum constraints for data validation
4. **Relationships**: Maintained all foreign key relationships

## Testing the Setup

Run the test script to verify everything works:

```bash
node scripts/testSQLiteTransactions.js
```

This will:
1. Initialize the database
2. Create test users, orders, and payments
3. Verify all relationships work correctly
4. Display database statistics

## File Location

The SQLite database file is stored at:
```
./database/flower_ecommerce.db
```

This file contains all transactional data and should be backed up regularly in production.

## API Endpoints Using SQLite

All transactional endpoints use the SQLite models:

- `POST /api/auth/register` - Creates new users
- `POST /api/auth/login` - Authenticates users
- `GET /api/orders` - Retrieves user orders
- `POST /api/orders` - Creates new orders
- `GET /api/payments` - Retrieves payment history
- `POST /api/payments` - Processes payments

## Production Considerations

1. **Backups**: Regularly backup the SQLite file
2. **Scaling**: Consider PostgreSQL migration for high-traffic applications
3. **Monitoring**: Monitor database file size and performance
4. **Security**: Ensure proper file permissions on the database file

## Troubleshooting

### Database Not Found
```bash
# Recreate the database
npm run db:init
```

### Foreign Key Errors
```bash
# Check relationships and run sync
npm run db:test
```

### Performance Issues
- Check database file size
- Consider adding indexes for frequently queried fields
- Monitor query performance in application logs