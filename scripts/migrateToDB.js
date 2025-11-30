#!/usr/bin/env node

const mongoose = require('mongoose');
const Flower = require('../models/mongo/Flower');
const Category = require('../models/mongo/Category');
const { categories, flowers: carnationFlowers } = require('../data/carnationCatalog');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flower-catalog', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Migrate categories
async function migrateCategories() {
  console.log('\n🏷️  Migrating categories...');
  
  try {
    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing categories');
    
    // Create category documents
    const categoryDocs = categories.map(cat => ({
      name: cat.name,
      description: cat.description,
      image: {
        url: cat.image,
        alt: `${cat.name} category`
      },
      parentCategory: null,
      displayOrder: categories.indexOf(cat),
      active: true,
      featured: false
    }));
    
    const savedCategories = await Category.insertMany(categoryDocs);
    console.log(`✅ Created ${savedCategories.length} categories`);
    
    return savedCategories;
  } catch (error) {
    console.error('❌ Error migrating categories:', error);
    throw error;
  }
}

// Migrate flowers
async function migrateFlowers() {
  console.log('\n🌸 Migrating flowers...');
  
  try {
    // Clear existing flowers
    await Flower.deleteMany({});
    console.log('🗑️  Cleared existing flowers');
    
    // Create flower documents
    const flowerDocs = carnationFlowers.map(flower => ({
      name: flower.name,
      variety: flower.variety || flower.name,
      type: flower.categoryId || 'carnation',
      color: flower.color,
      origin: flower.origin || 'Netherlands',
      description: flower.description,
      images: [{
        url: flower.image,
        alt: `${flower.name} - ${flower.color}`,
        isPrimary: true
      }],
      availability: {
        inStock: flower.availability?.inStock !== false,
        stockQuantity: flower.availability?.stockQuantity || 100,
        seasonality: {
          available: !flower.availability?.seasonal,
          seasons: flower.availability?.availableMonths ? 
            getSeasonFromMonths(flower.availability.availableMonths) : 
            ['spring', 'summer', 'autumn', 'winter']
        }
      },
      pricing: {
        wholesaler: {
          boxQuantity: flower.pricing?.wholesaler?.boxSize || 25,
          pricePerBox: flower.pricing?.wholesaler?.pricePerBox || 
                      (flower.pricing?.wholesaler?.pricePerStem * (flower.pricing?.wholesaler?.boxSize || 25)) || 50,
          currency: 'PLN'
        },
        florist: {
          pricePerStem: flower.pricing?.florist?.pricePerStem || 2.5,
          minimumQuantity: flower.pricing?.florist?.minQuantity || 1,
          currency: 'PLN'
        }
      },
      specifications: {
        stemLength: {
          min: flower.specifications?.stemLength ? parseInt(flower.specifications.stemLength.split('-')[0]) : 50,
          max: flower.specifications?.stemLength ? parseInt(flower.specifications.stemLength.split('-')[1]) : 60,
          unit: 'cm'
        },
        bloomSize: 'medium',
        petalCount: 'double',
        fragrance: 'light'
      },
      careInstructions: {
        waterTemperature: 'Cool water',
        stemCutting: 'Cut 2cm at 45° angle',
        preservatives: 'Use flower food',
        storage: 'Cool, dark place',
        lifespan: {
          days: flower.specifications?.vaseLife ? parseInt(flower.specifications.vaseLife.split('-')[0]) : 7,
          conditions: 'Proper care'
        }
      },
      tags: [flower.categoryId || 'carnation', flower.color, flower.name],
      featured: flower.isNew || false,
      active: flower.isActive !== false
    }));
    
    const savedFlowers = await Flower.insertMany(flowerDocs);
    console.log(`✅ Created ${savedFlowers.length} flowers`);
    
    return savedFlowers;
  } catch (error) {
    console.error('❌ Error migrating flowers:', error);
    throw error;
  }
}

// Helper function to convert months to seasons
function getSeasonFromMonths(months) {
  const seasons = [];
  const spring = [3, 4, 5];
  const summer = [6, 7, 8];
  const autumn = [9, 10, 11];
  const winter = [12, 1, 2];
  
  if (months.some(m => spring.includes(m))) seasons.push('spring');
  if (months.some(m => summer.includes(m))) seasons.push('summer');  
  if (months.some(m => autumn.includes(m))) seasons.push('autumn');
  if (months.some(m => winter.includes(m))) seasons.push('winter');
  
  return seasons.length > 0 ? seasons : ['spring', 'summer', 'autumn', 'winter'];
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting data migration to MongoDB...');
  
  try {
    await connectDB();
    
    const categories = await migrateCategories();
    const flowers = await migrateFlowers();
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Flowers: ${flowers.length}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };