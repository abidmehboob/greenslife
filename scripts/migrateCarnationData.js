#!/usr/bin/env node
/**
 * Migration script to import carnation catalog data into MongoDB
 * Run this script to populate the database with initial flower and category data
 */

const mongoose = require('mongoose');
const Flower = require('../models/mongo/Flower');
const Category = require('../models/mongo/Category');
const { categories, flowers } = require('../data/carnationCatalog');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:greenslife123@localhost:27017/flower-catalog?authSource=admin';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Make sure MongoDB is running with: docker-compose up -d');
    return false;
  }
};

// Transform category data for MongoDB
const transformCategoryData = (categoryData) => {
  // Generate slug from category name
  const slug = categoryData.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
    
  return {
    name: categoryData.name,
    slug: slug,
    description: categoryData.description,
    image: {
      url: categoryData.image,
      alt: `${categoryData.name} category`
    },
    parentCategory: null,
    displayOrder: 0,
    active: categoryData.isActive !== false,
    featured: false,
    metadata: {
      seoTitle: `${categoryData.name} - Premium Flowers`,
      seoDescription: categoryData.description,
      keywords: [categoryData.name.toLowerCase(), 'carnations', 'flowers']
    }
  };
};

// Transform flower data for MongoDB
const transformFlowerData = (flowerData) => {
  // Determine flower type from category
  let flowerType = 'carnation';
  if (flowerData.category.toLowerCase().includes('spray')) {
    flowerType = 'spray-carnation';
  }

  return {
    name: flowerData.name,
    type: flowerType,
    variety: flowerData.name,
    color: flowerData.color,
    origin: 'Netherlands', // Default origin
    description: flowerData.description,
    images: [{
      url: flowerData.image,
      alt: `${flowerData.name} ${flowerData.color} carnation`,
      isPrimary: true
    }],
    pricing: {
      wholesaler: {
        boxQuantity: flowerData.pricing.wholesaler.boxSize || 25,
        pricePerBox: flowerData.pricing.wholesaler.pricePerBox,
        currency: 'PLN'
      },
      florist: {
        pricePerStem: flowerData.pricing.florist.pricePerStem,
        minimumQuantity: flowerData.pricing.florist.minQuantity || 1,
        currency: 'PLN'
      }
    },
    availability: {
      inStock: flowerData.availability?.inStock !== false,
      stockQuantity: flowerData.availability?.stockLevel || 100,
      seasonality: {
        available: true,
        seasons: ['spring', 'summer', 'autumn', 'winter']
      }
    },
    specifications: {
      stemLength: {
        min: parseInt(flowerData.specifications?.stemLength?.split('-')[0]) || 50,
        max: parseInt(flowerData.specifications?.stemLength?.split('-')[1]) || 70,
        unit: 'cm'
      },
      bloomSize: flowerData.specifications?.headSize?.toLowerCase().includes('large') ? 'large' : 'medium',
      petalCount: 'double',
      fragrance: 'light'
    },
    careInstructions: {
      waterTemperature: 'Cool water',
      stemCutting: 'Cut 2cm at 45° angle',
      preservatives: 'Use flower food',
      storage: 'Cool, dark place',
      lifespan: {
        days: parseInt(flowerData.specifications?.vaseLife?.split('-')[0]) || 7,
        conditions: 'Proper care'
      }
    },
    tags: [
      flowerType.replace('-', ' '),
      flowerData.color.toLowerCase(),
      flowerData.name.toLowerCase(),
      'carnation',
      'premium'
    ],
    featured: flowerData.featured || false,
    active: flowerData.isActive !== false
  };
};

// Migrate categories
const migrateCategories = async () => {
  console.log('\n📁 Migrating categories...');
  
  try {
    // Clear existing categories
    await Category.deleteMany({});
    console.log('   Cleared existing categories');

    // Insert new categories
    const categoryDocs = categories.map(transformCategoryData);
    const savedCategories = await Category.insertMany(categoryDocs);
    
    console.log(`   ✅ Imported ${savedCategories.length} categories`);
    
    // Log imported categories
    savedCategories.forEach(cat => {
      console.log(`      - ${cat.name} (${cat.slug})`);
    });
    
    return savedCategories;
  } catch (error) {
    console.error('   ❌ Category migration failed:', error.message);
    throw error;
  }
};

// Migrate flowers
const migrateFlowers = async () => {
  console.log('\n🌸 Migrating flowers...');
  
  try {
    // Clear existing flowers
    await Flower.deleteMany({});
    console.log('   Cleared existing flowers');

    // Insert new flowers
    const flowerDocs = flowers.map(transformFlowerData);
    const savedFlowers = await Flower.insertMany(flowerDocs);
    
    console.log(`   ✅ Imported ${savedFlowers.length} flowers`);
    
    // Log sample of imported flowers
    const sampleFlowers = savedFlowers.slice(0, 5);
    sampleFlowers.forEach(flower => {
      console.log(`      - ${flower.name} (${flower.color}) - ${flower.type}`);
    });
    
    if (savedFlowers.length > 5) {
      console.log(`      ... and ${savedFlowers.length - 5} more flowers`);
    }
    
    return savedFlowers;
  } catch (error) {
    console.error('   ❌ Flower migration failed:', error.message);
    throw error;
  }
};

// Create indexes for better performance
const createIndexes = async () => {
  console.log('\n🔍 Creating database indexes...');
  
  try {
    // Category indexes
    await Category.collection.createIndex({ slug: 1, active: 1 });
    await Category.collection.createIndex({ featured: 1, active: 1 });
    
    // Flower indexes
    await Flower.collection.createIndex({ type: 1, color: 1 });
    await Flower.collection.createIndex({ active: 1, 'availability.inStock': 1 });
    await Flower.collection.createIndex({ featured: 1, active: 1 });
    await Flower.collection.createIndex({ tags: 1 });
    
    console.log('   ✅ Database indexes created');
  } catch (error) {
    console.error('   ❌ Index creation failed:', error.message);
    // Don't throw - indexes are optional
  }
};

// Main migration function
const runMigration = async () => {
  console.log('🚀 Starting carnation catalog migration...');
  console.log(`📊 Data to migrate: ${categories.length} categories, ${flowers.length} flowers`);
  
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }

    // Run migrations
    const savedCategories = await migrateCategories();
    const savedFlowers = await migrateFlowers();
    await createIndexes();

    // Summary
    console.log('\n✅ Migration completed successfully!');
    console.log(`📊 Final counts:`);
    console.log(`   - Categories: ${savedCategories.length}`);
    console.log(`   - Flowers: ${savedFlowers.length}`);
    console.log(`   - Total documents: ${savedCategories.length + savedFlowers.length}`);
    
    console.log('\n🌐 You can now use the MongoDB-backed API endpoints:');
    console.log('   - GET /api/flowers - List all flowers');
    console.log('   - GET /api/flowers/categories - List all categories');
    console.log('   - GET /admin/products - Admin product management');
    console.log('   - POST /admin/products - Create new products');
    console.log('   - POST /admin/categories - Create new categories');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Database connection closed');
    process.exit(0);
  }
};

// Run migration if called directly
if (require.main === module) {
  runMigration().catch(error => {
    console.error('Migration script error:', error);
    process.exit(1);
  });
}

module.exports = {
  runMigration,
  transformCategoryData,
  transformFlowerData
};