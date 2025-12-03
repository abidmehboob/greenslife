const mongoose = require('mongoose');

// Import models (make sure the path is correct)
const Flower = require('../models/mongo/Flower');
const Category = require('../models/mongo/Category');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:greenslife123@localhost:27017/greenslife?authSource=admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Categories data
const categories = [
  {
    name: 'Carnations',
    slug: 'carnations',
    description: 'Beautiful carnation flowers in various colors',
    displayOrder: 1,
    active: true
  },
  {
    name: 'Spray Carnations',
    slug: 'spray-carnations', 
    description: 'Multi-headed spray carnation varieties',
    displayOrder: 2,
    active: true
  }
];

// Sample flowers data that matches the schema
const flowers = [
  {
    name: 'Premium Red',
    type: 'carnation',
    variety: 'Standard',
    color: 'Red',
    origin: 'Netherlands',
    description: 'Premium quality red carnations with excellent vase life',
    images: [
      {
        url: '/images/flowers/red-carnation-1.jpg',
        alt: 'Premium Red Carnation',
        isPrimary: true
      }
    ],
    pricing: {
      wholesaler: {
        boxQuantity: 25,
        pricePerBox: 112.50, // €4.50 per stem * 25 stems
        currency: 'EUR'
      },
      florist: {
        pricePerStem: 4.50,
        minimumQuantity: 10,
        currency: 'EUR'
      }
    },
    availability: {
      inStock: true,
      stockQuantity: 500,
      seasonality: {
        available: true,
        seasons: ['spring', 'summer', 'autumn', 'winter']
      }
    },
    specifications: {
      stemLength: {
        min: 40,
        max: 60,
        unit: 'cm'
      },
      bloomSize: 'medium',
      petalCount: 'double',
      fragrance: 'light'
    },
    careInstructions: {
      waterTemperature: 'Cool (15-20°C)',
      stemCutting: 'Cut stems under running water at 45° angle',
      preservatives: 'Use flower food for best results',
      storage: 'Keep in cool place, change water every 2-3 days',
      lifespan: {
        days: 14,
        conditions: 'With proper care'
      }
    },
    tags: ['red', 'premium', 'long-lasting', 'classic'],
    featured: true,
    active: true
  },
  {
    name: 'Pure White',
    type: 'carnation',
    variety: 'Standard',
    color: 'White',
    origin: 'Netherlands',
    description: 'Elegant pure white carnations perfect for weddings and special events',
    images: [
      {
        url: '/images/flowers/white-carnation-1.jpg',
        alt: 'Pure White Carnation',
        isPrimary: true
      }
    ],
    pricing: {
      wholesaler: {
        boxQuantity: 25,
        pricePerBox: 87.50, // €3.50 per stem * 25 stems
        currency: 'EUR'
      },
      florist: {
        pricePerStem: 3.50,
        minimumQuantity: 10,
        currency: 'EUR'
      }
    },
    availability: {
      inStock: true,
      stockQuantity: 300,
      seasonality: {
        available: true,
        seasons: ['spring', 'summer', 'autumn', 'winter']
      }
    },
    specifications: {
      stemLength: {
        min: 50,
        max: 70,
        unit: 'cm'
      },
      bloomSize: 'large',
      petalCount: 'full',
      fragrance: 'moderate'
    },
    careInstructions: {
      waterTemperature: 'Cool (15-20°C)',
      stemCutting: 'Cut stems under running water at 45° angle',
      preservatives: 'Use flower food for best results',
      storage: 'Keep in cool place, change water every 2-3 days',
      lifespan: {
        days: 16,
        conditions: 'With proper care'
      }
    },
    tags: ['white', 'wedding', 'elegant', 'classic'],
    featured: true,
    active: true
  },
  {
    name: 'Pink Blush',
    type: 'carnation',
    variety: 'Standard',
    color: 'Pink',
    origin: 'Colombia',
    description: 'Soft pink carnations with delicate fragrance',
    images: [
      {
        url: '/images/flowers/pink-carnation-1.jpg',
        alt: 'Pink Blush Carnation',
        isPrimary: true
      }
    ],
    pricing: {
      wholesaler: {
        boxQuantity: 25,
        pricePerBox: 75.00, // €3.00 per stem * 25 stems
        currency: 'EUR'
      },
      florist: {
        pricePerStem: 3.00,
        minimumQuantity: 5,
        currency: 'EUR'
      }
    },
    availability: {
      inStock: true,
      stockQuantity: 400,
      seasonality: {
        available: true,
        seasons: ['spring', 'summer', 'autumn', 'winter']
      }
    },
    specifications: {
      stemLength: {
        min: 45,
        max: 65,
        unit: 'cm'
      },
      bloomSize: 'medium',
      petalCount: 'double',
      fragrance: 'moderate'
    },
    careInstructions: {
      waterTemperature: 'Cool (15-20°C)',
      stemCutting: 'Cut stems under running water at 45° angle',
      preservatives: 'Use flower food for best results',
      storage: 'Keep in cool place, change water every 2-3 days',
      lifespan: {
        days: 12,
        conditions: 'With proper care'
      }
    },
    tags: ['pink', 'romantic', 'soft', 'fragrant'],
    featured: false,
    active: true
  },
  {
    name: 'Sunny Yellow',
    type: 'spray-carnation',
    variety: 'Mini',
    color: 'Yellow',
    origin: 'Netherlands',
    description: 'Bright yellow spray carnations with multiple blooms per stem',
    images: [
      {
        url: '/images/flowers/yellow-spray-carnation-1.jpg',
        alt: 'Sunny Yellow Spray Carnation',
        isPrimary: true
      }
    ],
    pricing: {
      wholesaler: {
        boxQuantity: 20,
        pricePerBox: 60.00, // €3.00 per stem * 20 stems
        currency: 'EUR'
      },
      florist: {
        pricePerStem: 3.00,
        minimumQuantity: 5,
        currency: 'EUR'
      }
    },
    availability: {
      inStock: true,
      stockQuantity: 250,
      seasonality: {
        available: true,
        seasons: ['spring', 'summer', 'autumn']
      }
    },
    specifications: {
      stemLength: {
        min: 40,
        max: 55,
        unit: 'cm'
      },
      bloomSize: 'small',
      petalCount: 'double',
      fragrance: 'light'
    },
    careInstructions: {
      waterTemperature: 'Cool (15-20°C)',
      stemCutting: 'Cut stems under running water at 45° angle',
      preservatives: 'Use flower food for best results',
      storage: 'Keep in cool place, change water every 2-3 days',
      lifespan: {
        days: 10,
        conditions: 'With proper care'
      }
    },
    tags: ['yellow', 'spray', 'cheerful', 'multi-bloom'],
    featured: false,
    active: true
  },
  {
    name: 'Purple Passion',
    type: 'carnation',
    variety: 'Standard',
    color: 'Purple',
    origin: 'Ecuador',
    description: 'Deep purple carnations with rich color and strong stems',
    images: [
      {
        url: '/images/flowers/purple-carnation-1.jpg',
        alt: 'Purple Passion Carnation',
        isPrimary: true
      }
    ],
    pricing: {
      wholesaler: {
        boxQuantity: 25,
        pricePerBox: 100.00, // €4.00 per stem * 25 stems
        currency: 'EUR'
      },
      florist: {
        pricePerStem: 4.00,
        minimumQuantity: 10,
        currency: 'EUR'
      }
    },
    availability: {
      inStock: true,
      stockQuantity: 200,
      seasonality: {
        available: true,
        seasons: ['autumn', 'winter', 'spring']
      }
    },
    specifications: {
      stemLength: {
        min: 50,
        max: 70,
        unit: 'cm'
      },
      bloomSize: 'large',
      petalCount: 'full',
      fragrance: 'strong'
    },
    careInstructions: {
      waterTemperature: 'Cool (15-20°C)',
      stemCutting: 'Cut stems under running water at 45° angle',
      preservatives: 'Use flower food for best results',
      storage: 'Keep in cool place, change water every 2-3 days',
      lifespan: {
        days: 15,
        conditions: 'With proper care'
      }
    },
    tags: ['purple', 'unique', 'dramatic', 'premium'],
    featured: true,
    active: true
  },
  {
    name: 'Orange Delight',
    type: 'spray-carnation',
    variety: 'Mini',
    color: 'Orange',
    origin: 'Kenya',
    description: 'Vibrant orange spray carnations perfect for autumn arrangements',
    images: [
      {
        url: '/images/flowers/orange-spray-carnation-1.jpg',
        alt: 'Orange Delight Spray Carnation',
        isPrimary: true
      }
    ],
    pricing: {
      wholesaler: {
        boxQuantity: 20,
        pricePerBox: 55.00, // €2.75 per stem * 20 stems
        currency: 'EUR'
      },
      florist: {
        pricePerStem: 2.75,
        minimumQuantity: 5,
        currency: 'EUR'
      }
    },
    availability: {
      inStock: true,
      stockQuantity: 180,
      seasonality: {
        available: true,
        seasons: ['summer', 'autumn']
      }
    },
    specifications: {
      stemLength: {
        min: 35,
        max: 50,
        unit: 'cm'
      },
      bloomSize: 'small',
      petalCount: 'single',
      fragrance: 'light'
    },
    careInstructions: {
      waterTemperature: 'Cool (15-20°C)',
      stemCutting: 'Cut stems under running water at 45° angle',
      preservatives: 'Use flower food for best results',
      storage: 'Keep in cool place, change water every 2-3 days',
      lifespan: {
        days: 8,
        conditions: 'With proper care'
      }
    },
    tags: ['orange', 'spray', 'autumn', 'vibrant'],
    featured: false,
    active: true
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    console.log('Clearing existing data...');
    await Flower.deleteMany({});
    await Category.deleteMany({});
    
    // Insert categories
    console.log('Inserting categories...');
    const insertedCategories = await Category.insertMany(categories);
    console.log(`Inserted ${insertedCategories.length} categories`);
    
    // Insert flowers
    console.log('Inserting flowers...');
    const insertedFlowers = await Flower.insertMany(flowers);
    console.log(`Inserted ${insertedFlowers.length} flowers`);
    
    console.log('Database seeding completed successfully!');
    
    // Display summary
    console.log('\n=== SEEDING SUMMARY ===');
    console.log(`Categories: ${insertedCategories.length}`);
    console.log(`Flowers: ${insertedFlowers.length}`);
    
    console.log('\nFlowers by category:');
    const carnations = insertedFlowers.filter(f => f.type === 'carnation');
    const sprayCarnations = insertedFlowers.filter(f => f.type === 'spray-carnation');
    console.log(`- Carnations: ${carnations.length}`);
    console.log(`- Spray Carnations: ${sprayCarnations.length}`);
    
    console.log('\nFeatured flowers:');
    const featured = insertedFlowers.filter(f => f.featured);
    featured.forEach(f => {
      console.log(`- ${f.name} (${f.variety} ${f.color}): €${f.pricing.florist.pricePerStem}/stem`);
    });
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seeding
seedDatabase();