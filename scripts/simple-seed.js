const mongoose = require('mongoose');

// Simple flower schema
const FlowerSchema = new mongoose.Schema({
  name: String,
  variety: String, 
  color: String,
  origin: String,
  description: String
}, { collection: 'flowers' });

const Flower = mongoose.model('Flower', FlowerSchema);

const connectAndSeed = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://admin:greenslife123@mongodb:27017/flower-catalog?authSource=admin';
    await mongoose.connect(mongoUrl);
    console.log('✓ Connected to MongoDB');
    
    // Clear existing data
    await Flower.deleteMany({});
    
    // Insert simple flower data
    const flowers = [
      {
        name: 'Red Rose',
        variety: 'Premium',
        color: 'Red', 
        origin: 'Netherlands',
        description: 'Beautiful red roses perfect for romantic occasions'
      },
      {
        name: 'White Tulip',
        variety: 'Classic',
        color: 'White',
        origin: 'Holland',
        description: 'Elegant white tulips symbolizing purity and new beginnings'
      },
      {
        name: 'Yellow Sunflower',
        variety: 'Large',
        color: 'Yellow',
        origin: 'USA',
        description: 'Bright yellow sunflowers that bring joy and warmth'
      }
    ];
    
    await Flower.insertMany(flowers);
    console.log(`✓ Inserted ${flowers.length} flowers`);
    
    await mongoose.disconnect();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

connectAndSeed();