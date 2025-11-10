const mongoose = require('mongoose');
const Flower = require('../models/mongo/Flower');
const Category = require('../models/mongo/Category');

// MongoDB connection
const connectMongoDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/flower-ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Flower categories
const categories = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Carnations',
    slug: 'carnations',
    description: 'Classic carnations perfect for any occasion',
    image: '/images/categories/carnations.jpg',
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Spray Carnations',
    slug: 'spray-carnations',
    description: 'Delicate spray carnations with multiple blooms per stem',
    image: '/images/categories/spray-carnations.jpg',
    isActive: true
  }
];

// Complete flower catalog
const flowers = [
  // Regular Carnations
  {
    name: 'Red Carnation',
    category: 'carnations',
    variety: 'Standard',
    color: 'red',
    description: 'Classic red carnations perfect for romantic bouquets and special occasions',
    images: [
      {
        url: '/images/flowers/carnations/red-carnation-1.jpg',
        alt: 'Red Carnation - Front view',
        isPrimary: true
      },
      {
        url: '/images/flowers/carnations/red-carnation-2.jpg',
        alt: 'Red Carnation - Side view',
        isPrimary: false
      },
      {
        url: '/images/flowers/carnations/red-carnation-bunch.jpg',
        alt: 'Red Carnation - Bunch',
        isPrimary: false
      }
    ],
    pricing: {
      boxSize: 100,
      pricePerBox: 35.00,
      pricePerStem: 0.35,
      minQuantity: 1,
      boxEquivalent: 100
    },
    availability: {
      inStock: true,
      stockQuantity: 500,
      seasonal: false,
      availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
    },
    specifications: {
      stemLength: '50-60cm',
      headSize: '4-5cm',
      vaseLife: '7-10 days',
      origin: 'Colombia'
    },
    tags: ['carnation', 'red', 'classic', 'romantic'],
    isActive: true,
    isFeatured: true
  },
  {
    name: 'Pink Carnation',
    category: 'carnations',
    variety: 'Standard',
    color: 'pink',
    description: 'Soft pink carnations ideal for gentle expressions of love and appreciation',
    images: [
      {
        url: '/images/flowers/carnations/pink-carnation-1.jpg',
        alt: 'Pink Carnation - Front view',
        isPrimary: true
      },
      {
        url: '/images/flowers/carnations/pink-carnation-2.jpg',
        alt: 'Pink Carnation - Side view',
        isPrimary: false
      }
    ],
    pricing: {
      boxSize: 100,
      pricePerBox: 33.00,
      pricePerStem: 0.33,
      minQuantity: 1,
      boxEquivalent: 100
    },
    availability: {
      inStock: true,
      stockQuantity: 450,
      seasonal: false,
      availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
    },
    specifications: {
      stemLength: '50-60cm',
      headSize: '4-5cm',
      vaseLife: '7-10 days',
      origin: 'Colombia'
    },
    tags: ['carnation', 'pink', 'soft', 'feminine'],
    isActive: true,
    isFeatured: true
  },
  {
    name: 'White Carnation',
    category: 'carnations',
    variety: 'Standard',
    color: 'white',
    description: 'Pure white carnations perfect for weddings and elegant arrangements',
    images: [
      {
        url: '/images/flowers/carnations/white-carnation-1.jpg',
        alt: 'White Carnation - Front view',
        isPrimary: true
      },
      {
        url: '/images/flowers/carnations/white-carnation-2.jpg',
        alt: 'White Carnation - Side view',
        isPrimary: false
      }
    ],
    pricing: {
      boxSize: 100,
      pricePerBox: 32.00,
      pricePerStem: 0.32,
      minQuantity: 1,
      boxEquivalent: 100
    },
    availability: {
      inStock: true,
      stockQuantity: 600,
      seasonal: false,
      availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
    },
    specifications: {
      stemLength: '50-60cm',
      headSize: '4-5cm',
      vaseLife: '7-10 days',
      origin: 'Colombia'
    },
    tags: ['carnation', 'white', 'pure', 'wedding'],
    isActive: true
  },
  {
    name: 'Yellow Carnation',
    category: 'carnations',
    variety: 'Standard',
    color: 'yellow',
    description: 'Bright yellow carnations that bring sunshine and joy to any arrangement',
    images: [
      {
        url: '/images/flowers/carnations/yellow-carnation-1.jpg',
        alt: 'Yellow Carnation - Front view',
        isPrimary: true
      },
      {
        url: '/images/flowers/carnations/yellow-carnation-2.jpg',
        alt: 'Yellow Carnation - Side view',
        isPrimary: false
      }
    ],
    pricing: {
      boxSize: 100,
      pricePerBox: 34.00,
      pricePerStem: 0.34,
      minQuantity: 1,
      boxEquivalent: 100
    },
    availability: {
      inStock: true,
      stockQuantity: 400,
      seasonal: false,
      availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
    },
    specifications: {
      stemLength: '50-60cm',
      headSize: '4-5cm',
      vaseLife: '7-10 days',
      origin: 'Colombia'
    },
    tags: ['carnation', 'yellow', 'bright', 'cheerful'],
    isActive: true
  },
  {
    name: 'Purple Carnation',
    category: 'carnations',
    variety: 'Standard',
    color: 'purple',
    description: 'Unique purple carnations for sophisticated and distinctive floral designs',
    images: [
      {
        url: '/images/flowers/carnations/purple-carnation-1.jpg',
        alt: 'Purple Carnation - Front view',
        isPrimary: true
      },
      {
        url: '/images/flowers/carnations/purple-carnation-2.jpg',
        alt: 'Purple Carnation - Side view',
        isPrimary: false
      }
    ],
    pricing: {
      boxSize: 100,
      pricePerBox: 38.00,
      pricePerStem: 0.38,
      minQuantity: 1,
      boxEquivalent: 100
    },
    availability: {
      inStock: true,
      stockQuantity: 250,
      seasonal: false,
      availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
    },
    specifications: {
      stemLength: '50-60cm',
      headSize: '4-5cm',
      vaseLife: '7-10 days',
      origin: 'Colombia'
    },
    tags: ['carnation', 'purple', 'unique', 'sophisticated'],
    isActive: true
  },
  // Spray Carnations
  {
    name: 'White Spray Carnation',
    category: 'spray-carnations',
    variety: 'Spray',
    color: 'white',
    description: 'Elegant white spray carnations perfect for wedding arrangements and delicate bouquets',
    images: [
      {
        url: '/images/flowers/spray-carnations/white-spray-carnation-1.jpg',
        alt: 'White Spray Carnation - Front view',
        isPrimary: true
      },
      {
        url: '/images/flowers/spray-carnations/white-spray-carnation-2.jpg',
        alt: 'White Spray Carnation - Side view',
        isPrimary: false
      },
      {
        url: '/images/flowers/spray-carnations/white-spray-carnation-bunch.jpg',
        alt: 'White Spray Carnation - Bunch',
        isPrimary: false
      }
    ],
    pricing: {
      boxSize: 100,
      pricePerBox: 45.00,
      pricePerStem: 0.45,
      minQuantity: 1,
      boxEquivalent: 100
    },
    availability: {
      inStock: true,
      stockQuantity: 300,
      seasonal: false,
      availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
    },
    specifications: {
      stemLength: '40-50cm',
      headSize: '3-4cm',
      vaseLife: '8-12 days',
      origin: 'Netherlands'
    },
    tags: ['spray-carnation', 'white', 'wedding', 'delicate'],
    isActive: true,
    isFeatured: true
  },
  {
    name: 'Pink Spray Carnation',
    category: 'spray-carnations',
    variety: 'Spray',
    color: 'pink',
    description: 'Delicate pink spray carnations with multiple small blooms per stem',
    images: [
      {
        url: '/images/flowers/spray-carnations/pink-spray-carnation-1.jpg',
        alt: 'Pink Spray Carnation - Front view',
        isPrimary: true
      },
      {
        url: '/images/flowers/spray-carnations/pink-spray-carnation-2.jpg',
        alt: 'Pink Spray Carnation - Side view',
        isPrimary: false
      }
    ],
    pricing: {
      boxSize: 100,
      pricePerBox: 43.00,
      pricePerStem: 0.43,
      minQuantity: 1,
      boxEquivalent: 100
    },
    availability: {
      inStock: true,
      stockQuantity: 280,
      seasonal: false,
      availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
    },
    specifications: {
      stemLength: '40-50cm',
      headSize: '3-4cm',
      vaseLife: '8-12 days',
      origin: 'Netherlands'
    },
    tags: ['spray-carnation', 'pink', 'delicate', 'beauty'],
    isActive: true
  },
  {
    name: 'Red Spray Carnation',
    category: 'spray-carnations',
    variety: 'Spray',
    color: 'red',
    description: 'Bold and vibrant red spray carnations for striking floral arrangements',
    images: [
      {
        url: '/images/flowers/spray-carnations/red-spray-carnation-1.jpg',
        alt: 'Red Spray Carnation - Front view',
        isPrimary: true
      },
      {
        url: '/images/flowers/spray-carnations/red-spray-carnation-2.jpg',
        alt: 'Red Spray Carnation - Side view',
        isPrimary: false
      }
    ],
    pricing: {
      boxSize: 100,
      pricePerBox: 46.00,
      pricePerStem: 0.46,
      minQuantity: 1,
      boxEquivalent: 100
    },
    availability: {
      inStock: true,
      stockQuantity: 320,
      seasonal: false,
      availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
    },
    specifications: {
      stemLength: '40-50cm',
      headSize: '3-4cm',
      vaseLife: '8-12 days',
      origin: 'Netherlands'
    },
    tags: ['spray-carnation', 'red', 'bold', 'vibrant'],
    isActive: true
  },
  {
    name: 'Yellow Spray Carnation',
    category: 'spray-carnations',
    variety: 'Spray',
    color: 'yellow',
    description: 'Sunny yellow spray carnations that brighten any floral display',
    images: [
      {
        url: '/images/flowers/spray-carnations/yellow-spray-carnation-1.jpg',
        alt: 'Yellow Spray Carnation - Front view',
        isPrimary: true
      },
      {
        url: '/images/flowers/spray-carnations/yellow-spray-carnation-2.jpg',
        alt: 'Yellow Spray Carnation - Side view',
        isPrimary: false
      }
    ],
    pricing: {
      boxSize: 100,
      pricePerBox: 42.00,
      pricePerStem: 0.42,
      minQuantity: 1,
      boxEquivalent: 100
    },
    availability: {
      inStock: true,
      stockQuantity: 260,
      seasonal: false,
      availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
    },
    specifications: {
      stemLength: '40-50cm',
      headSize: '3-4cm',
      vaseLife: '8-12 days',
      origin: 'Netherlands'
    },
    tags: ['spray-carnation', 'yellow', 'sunny', 'disposition'],
    isActive: true
  },
  {
    name: 'Orange Spray Carnation',
    category: 'spray-carnations',
    variety: 'Spray',
    color: 'orange',
    description: 'Warm and energetic orange spray carnations for vibrant floral creations',
    images: [
      {
        url: '/images/flowers/spray-carnations/orange-spray-carnation-1.jpg',
        alt: 'Orange Spray Carnation - Front view',
        isPrimary: true
      },
      {
        url: '/images/flowers/spray-carnations/orange-spray-carnation-2.jpg',
        alt: 'Orange Spray Carnation - Side view',
        isPrimary: false
      }
    ],
    pricing: {
      boxSize: 100,
      pricePerBox: 49.00,
      pricePerStem: 0.49,
      minQuantity: 1,
      boxEquivalent: 100
    },
    availability: {
      inStock: true,
      stockQuantity: 200,
      seasonal: false,
      availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
    },
    specifications: {
      stemLength: '40-50cm',
      headSize: '3-4cm',
      vaseLife: '8-12 days',
      origin: 'Netherlands'
    },
    tags: ['spray-carnation', 'orange', 'warm', 'energetic'],
    isActive: true
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Category.deleteMany({});
    await Flower.deleteMany({});
    console.log('✓ Cleared existing data');

    // Insert categories
    const insertedCategories = await Category.insertMany(categories);
    console.log(`✓ Inserted ${insertedCategories.length} categories`);

    // Insert flowers
    const insertedFlowers = await Flower.insertMany(flowers);
    console.log(`✓ Inserted ${insertedFlowers.length} flowers`);

    console.log('🎉 Database seeding completed successfully!');
    
    // Display summary
    console.log('\n📊 Seeding Summary:');
    console.log(`Categories: ${insertedCategories.length}`);
    console.log(`Flowers: ${insertedFlowers.length}`);
    console.log(`  - Carnations: ${flowers.filter(f => f.category === 'carnations').length}`);
    console.log(`  - Spray Carnations: ${flowers.filter(f => f.category === 'spray-carnations').length}`);
    console.log(`Featured Flowers: ${flowers.filter(f => f.isFeatured).length}`);

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
};

// Run seeder
if (require.main === module) {
  connectMongoDB().then(seedDatabase);
}

module.exports = { seedDatabase, connectMongoDB };