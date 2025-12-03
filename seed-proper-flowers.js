const mongoose = require('mongoose');
const Flower = require('./models/mongo/Flower');

// MongoDB connection
const connectMongoDB = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://admin:greenslife123@mongodb:27017/flower-catalog?authSource=admin';
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const sampleFlowers = [
  {
    name: 'Red Carnation Premium',
    type: 'carnation',
    variety: 'Standard',
    color: 'Red',
    origin: 'Netherlands',
    description: 'Premium red carnations with excellent vase life',
    images: [{
      url: '/images/flowers/red-carnation.jpg',
      alt: 'Red Carnation',
      isPrimary: true
    }],
    pricing: {
      wholesaler: {
        boxQuantity: 25,
        pricePerBox: 18.50,
        currency: 'EUR'
      },
      florist: {
        pricePerStem: 0.85,
        minimumQuantity: 1,
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
      stemLength: '60-70cm',
      headSize: 'Large',
      vaseLife: '7-10 days'
    },
    tags: ['carnation', 'red', 'premium', 'wedding'],
    featured: true,
    active: true
  },
  {
    name: 'White Carnation Classic',
    type: 'carnation', 
    variety: 'Standard',
    color: 'White',
    origin: 'Netherlands',
    description: 'Classic white carnations perfect for elegant arrangements',
    images: [{
      url: '/images/flowers/white-carnation.jpg',
      alt: 'White Carnation',
      isPrimary: true
    }],
    pricing: {
      wholesaler: {
        boxQuantity: 25,
        pricePerBox: 16.25,
        currency: 'EUR'
      },
      florist: {
        pricePerStem: 0.75,
        minimumQuantity: 1,
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
      stemLength: '60-70cm',
      headSize: 'Large',
      vaseLife: '7-10 days'
    },
    tags: ['carnation', 'white', 'classic', 'wedding'],
    featured: true,
    active: true
  },
  {
    name: 'Pink Carnation Spray',
    type: 'spray-carnation',
    variety: 'Mini',
    color: 'Pink',
    origin: 'Kenya',
    description: 'Delicate pink spray carnations with multiple blooms per stem',
    images: [{
      url: '/images/flowers/pink-spray-carnation.jpg',
      alt: 'Pink Spray Carnation',
      isPrimary: true
    }],
    pricing: {
      wholesaler: {
        boxQuantity: 20,
        pricePerBox: 22.00,
        currency: 'EUR'
      },
      florist: {
        pricePerStem: 1.25,
        minimumQuantity: 1,
        currency: 'EUR'
      }
    },
    availability: {
      inStock: true,
      stockQuantity: 300,
      seasonality: {
        available: true,
        seasons: ['spring', 'summer', 'autumn']
      }
    },
    specifications: {
      stemLength: '50-60cm',
      headSize: 'Small',
      vaseLife: '5-7 days'
    },
    tags: ['spray-carnation', 'pink', 'delicate', 'texture'],
    featured: true,
    active: true
  }
];

const seedFlowers = async () => {
  try {
    await connectMongoDB();
    
    // Clear existing flowers
    await Flower.deleteMany({});
    console.log('✓ Cleared existing flowers');
    
    // Insert new flowers with proper pricing structure
    const insertedFlowers = await Flower.insertMany(sampleFlowers);
    console.log(`✓ Inserted ${insertedFlowers.length} flowers with proper pricing`);
    
    // Verify the pricing structure
    const sampleFlower = await Flower.findOne({ name: 'Red Carnation Premium' });
    console.log('Sample flower pricing structure:');
    console.log(JSON.stringify(sampleFlower.pricing, null, 2));
    
    console.log('✓ Flower seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding flowers:', error);
    process.exit(1);
  }
};

seedFlowers();