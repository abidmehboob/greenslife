const mongoose = require('mongoose');

const flowerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['carnation', 'spray-carnation'],
    index: true
  },
  variety: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  origin: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  pricing: {
    wholesaler: {
      boxQuantity: {
        type: Number,
        required: true,
        min: 1
      },
      pricePerBox: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: 'PLN'
      }
    },
    florist: {
      pricePerStem: {
        type: Number,
        required: true,
        min: 0
      },
      minimumQuantity: {
        type: Number,
        default: 1,
        min: 1
      },
      currency: {
        type: String,
        default: 'PLN'
      }
    }
  },
  availability: {
    inStock: {
      type: Boolean,
      default: true,
      index: true
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    seasonality: {
      available: {
        type: Boolean,
        default: true
      },
      seasons: [{
        type: String,
        enum: ['spring', 'summer', 'autumn', 'winter']
      }]
    }
  },
  specifications: {
    stemLength: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        default: 'cm'
      }
    },
    bloomSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'extra-large']
    },
    petalCount: {
      type: String,
      enum: ['single', 'double', 'full']
    },
    fragrance: {
      type: String,
      enum: ['none', 'light', 'moderate', 'strong']
    }
  },
  careInstructions: {
    waterTemperature: String,
    stemCutting: String,
    preservatives: String,
    storage: String,
    lifespan: {
      days: Number,
      conditions: String
    }
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true,
    index: true
  }],
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
flowerSchema.index({ type: 1, color: 1 });
flowerSchema.index({ active: 1, 'availability.inStock': 1 });
flowerSchema.index({ featured: 1, active: 1 });
flowerSchema.index({ tags: 1 });

// Virtual for primary image
flowerSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Virtual for display name
flowerSchema.virtual('displayName').get(function() {
  return `${this.variety} ${this.name} - ${this.color}`;
});

// Method to get price for user type
flowerSchema.methods.getPriceForUserType = function(userType) {
  if (userType === 'wholesaler') {
    return {
      type: 'box',
      quantity: this.pricing.wholesaler.boxQuantity,
      price: this.pricing.wholesaler.pricePerBox,
      currency: this.pricing.wholesaler.currency,
      unit: `${this.pricing.wholesaler.boxQuantity} stems/box`
    };
  } else {
    return {
      type: 'stem',
      quantity: 1,
      price: this.pricing.florist.pricePerStem,
      currency: this.pricing.florist.currency,
      unit: 'per stem',
      minimumQuantity: this.pricing.florist.minimumQuantity
    };
  }
};

// Static method to find available flowers
flowerSchema.statics.findAvailable = function(userType = null) {
  const query = {
    active: true,
    'availability.inStock': true
  };
  
  return this.find(query).sort({ featured: -1, createdAt: -1 });
};

// Static method to search flowers
flowerSchema.statics.search = function(searchTerm, filters = {}) {
  const query = {
    active: true,
    ...filters
  };

  if (searchTerm) {
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { variety: { $regex: searchTerm, $options: 'i' } },
      { color: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ];
  }

  return this.find(query).sort({ featured: -1, createdAt: -1 });
};

module.exports = mongoose.model('Flower', flowerSchema);