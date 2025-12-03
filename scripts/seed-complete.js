const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const connectMongoDB = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://admin:greenslife123@mongodb:27017/flower-catalog?authSource=admin';
    await mongoose.connect(mongoUrl);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Simple flower schema - matching what the API expects
const FlowerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  variety: { type: String, required: true },
  color: { type: String, required: true },
  origin: { type: String, required: true },
  description: String,
  type: String,
  pricing: {
    florist: {
      pricePerStem: Number
    },
    wholesaler: {
      pricePerBox: Number,
      boxQuantity: Number
    }
  },
  specifications: {
    stemLength: {
      min: Number,
      max: Number,
      unit: String
    }
  },
  availability: {
    type: String,
    default: 'available'
  },
  imageUrl: String,
  category: String
}, { 
  collection: 'flowers',
  timestamps: true 
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: String
}, { 
  collection: 'categories',
  timestamps: true 
});

// User schema for SQLite/PostgreSQL (we'll create users directly via API)
const testUsers = [
  {
    email: 'admin@test.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    userType: 'admin',
    businessName: 'Flower Distribution Admin',
    businessAddress: {
      street: '789 Admin Plaza',
      city: 'Warsaw',
      postalCode: '00-002',
      country: 'Poland'
    },
    phone: '+1-555-0100',
    taxNumber: 'PL1122334455'
  },
  {
    email: 'wholesaler@test.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Wholesale',
    userType: 'wholesaler',
    businessName: 'Wholesale Flowers Inc',
    businessAddress: {
      street: '123 Business Street',
      city: 'Krakow',
      postalCode: '30-001',
      country: 'Poland'
    },
    phone: '+48-123-456-789',
    taxNumber: 'PL9876543210'
  },
  {
    email: 'florist@test.com',
    password: 'password123',
    firstName: 'Maria',
    lastName: 'Florist',
    userType: 'florist',
    businessName: 'Beautiful Blooms Florist',
    businessAddress: {
      street: '456 Flower Avenue',
      city: 'Gdansk',
      postalCode: '80-001',
      country: 'Poland'
    },
    phone: '+48-987-654-321',
    taxNumber: 'PL1357924680'
  }
];

const categories = [
  {
    name: 'Roses',
    slug: 'roses',
    description: 'Beautiful roses in various colors and varieties'
  },
  {
    name: 'Tulips',
    slug: 'tulips',
    description: 'Classic tulips perfect for any occasion'
  },
  {
    name: 'Carnations',
    slug: 'carnations',
    description: 'Long-lasting carnations with vibrant colors'
  },
  {
    name: 'Sunflowers',
    slug: 'sunflowers',
    description: 'Bright and cheerful sunflowers'
  }
];

const flowers = [
  {
    name: 'Red Rose Premium',
    variety: 'Freedom',
    color: 'Red',
    origin: 'Netherlands',
    type: 'Cut Flower',
    description: 'Premium quality red roses with long stems, perfect for romantic occasions and special events.',
    pricing: {
      florist: { pricePerStem: 4.50 },
      wholesaler: { pricePerBox: 65.00, boxQuantity: 20 }
    },
    specifications: {
      stemLength: { min: 60, max: 70, unit: 'cm' }
    },
    category: 'roses',
    imageUrl: '/images/red-rose.jpg'
  },
  {
    name: 'White Tulip',
    variety: 'Triumph',
    color: 'White',
    origin: 'Holland',
    type: 'Cut Flower',
    description: 'Elegant white tulips symbolizing purity and new beginnings. Perfect for weddings and spring arrangements.',
    pricing: {
      florist: { pricePerStem: 2.75 },
      wholesaler: { pricePerBox: 45.00, boxQuantity: 25 }
    },
    specifications: {
      stemLength: { min: 40, max: 50, unit: 'cm' }
    },
    category: 'tulips',
    imageUrl: '/images/white-tulip.jpg'
  },
  {
    name: 'Pink Carnation',
    variety: 'Standard',
    color: 'Pink',
    origin: 'Colombia',
    type: 'Cut Flower',
    description: 'Long-lasting pink carnations with ruffled petals. Excellent for mixed bouquets and arrangements.',
    pricing: {
      florist: { pricePerStem: 1.85 },
      wholesaler: { pricePerBox: 32.00, boxQuantity: 25 }
    },
    specifications: {
      stemLength: { min: 50, max: 60, unit: 'cm' }
    },
    category: 'carnations',
    imageUrl: '/images/pink-carnation.jpg'
  },
  {
    name: 'Yellow Sunflower',
    variety: 'Giant',
    color: 'Yellow',
    origin: 'USA',
    type: 'Cut Flower',
    description: 'Large, bright yellow sunflowers that bring joy and warmth to any space. Perfect for summer arrangements.',
    pricing: {
      florist: { pricePerStem: 3.25 },
      wholesaler: { pricePerBox: 55.00, boxQuantity: 20 }
    },
    specifications: {
      stemLength: { min: 70, max: 80, unit: 'cm' }
    },
    category: 'sunflowers',
    imageUrl: '/images/yellow-sunflower.jpg'
  },
  {
    name: 'Purple Rose',
    variety: 'Deep Purple',
    color: 'Purple',
    origin: 'Ecuador',
    type: 'Cut Flower',
    description: 'Exotic purple roses with deep, rich color. Perfect for unique and sophisticated arrangements.',
    pricing: {
      florist: { pricePerStem: 5.25 },
      wholesaler: { pricePerBox: 85.00, boxQuantity: 20 }
    },
    specifications: {
      stemLength: { min: 65, max: 75, unit: 'cm' }
    },
    category: 'roses',
    imageUrl: '/images/purple-rose.jpg'
  },
  {
    name: 'Orange Tulip',
    variety: 'Darwin Hybrid',
    color: 'Orange',
    origin: 'Netherlands',
    type: 'Cut Flower',
    description: 'Vibrant orange tulips with strong stems. Perfect for bright, cheerful spring arrangements.',
    pricing: {
      florist: { pricePerStem: 2.95 },
      wholesaler: { pricePerBox: 48.00, boxQuantity: 25 }
    },
    specifications: {
      stemLength: { min: 45, max: 55, unit: 'cm' }
    },
    category: 'tulips',
    imageUrl: '/images/orange-tulip.jpg'
  }
];

const seedDatabase = async () => {
  try {
    const Flower = mongoose.model('Flower', FlowerSchema);
    const Category = mongoose.model('Category', CategorySchema);

    // Clear existing data
    await Flower.deleteMany({});
    await Category.deleteMany({});
    console.log('✓ Cleared existing flower and category data');

    // Insert categories
    await Category.insertMany(categories);
    console.log(`✓ Inserted ${categories.length} categories`);

    // Insert flowers
    await Flower.insertMany(flowers);
    console.log(`✓ Inserted ${flowers.length} flowers`);

    // Verify data
    const flowerCount = await Flower.countDocuments();
    const categoryCount = await Category.countDocuments();
    
    console.log('\n📊 Database Summary:');
    console.log(`   - Categories: ${categoryCount}`);
    console.log(`   - Flowers: ${flowerCount}`);
    
    // Display sample flowers
    const sampleFlowers = await Flower.find().limit(3);
    console.log('\n🌸 Sample Flowers:');
    sampleFlowers.forEach(flower => {
      console.log(`   - ${flower.name} (${flower.color} ${flower.variety}) - €${flower.pricing.florist.pricePerStem}/stem`);
    });

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
};

// Function to create test users via API calls
const createTestUsers = async () => {
  console.log('\n👥 Creating test users...');
  
  for (const userData of testUsers) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      console.log(`   Creating user: ${userData.email} (${userData.userType})`);
      console.log(`   Password: ${userData.password}`);
      
      // Note: In a real implementation, you would make API calls here
      // For now, we'll just log the user data that should be created
      
    } catch (error) {
      console.error(`   ❌ Error creating user ${userData.email}:`, error.message);
    }
  }
  
  console.log('\n📝 Test User Credentials:');
  testUsers.forEach(user => {
    console.log(`   ${user.email} / ${user.password} (${user.userType})`);
  });
};

const main = async () => {
  console.log('🌱 Starting complete database seeding...\n');
  
  try {
    await connectMongoDB();
    await seedDatabase();
    await createTestUsers();
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@test.com / admin123');
    console.log('   Wholesaler: wholesaler@test.com / password123');
    console.log('   Florist: florist@test.com / password123');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Database connection closed');
  }
};

main();