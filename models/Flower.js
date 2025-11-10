const mongoose = require('mongoose');

const flowerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['carnations', 'spray-carnations', 'roses', 'lilies', 'tulips', 'orchids', 'mixed']
  },
  variety: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  pricing: {
    wholesaler: {
      boxSize: { type: Number, required: true }, // stems per box
      pricePerBox: { type: Number, required: true },
      minQuantity: { type: Number, default: 1 }
    },
    florist: {
      pricePerStem: { type: Number, required: true },
      minQuantity: { type: Number, default: 10 }
    }
  },
  availability: {
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0 },
    seasonal: { type: Boolean, default: false },
    availableMonths: [{ type: Number, min: 1, max: 12 }] // 1-12 for Jan-Dec
  },
  specifications: {
    stemLength: String, // e.g., "40-50cm"
    headSize: String,   // e.g., "3-4cm"
    vaseLife: String,   // e.g., "7-10 days"
    origin: String      // Country of origin
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
flowerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search functionality
flowerSchema.index({ 
  name: 'text', 
  category: 'text', 
  color: 'text', 
  description: 'text' 
});

module.exports = mongoose.model('Flower', flowerSchema);