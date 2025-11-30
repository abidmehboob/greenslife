// MongoDB initialization script
// This script runs when MongoDB container starts for the first time

// Switch to flower-catalog database
db = db.getSiblingDB('flower-catalog');

// Create collections with proper indexes
db.createCollection('flowers');
db.createCollection('categories');

// Create indexes for flowers collection
db.flowers.createIndex({ "active": 1, "availability.inStock": 1 });
db.flowers.createIndex({ "type": 1, "color": 1 });
db.flowers.createIndex({ "featured": 1, "active": 1 });
db.flowers.createIndex({ "tags": 1 });
db.flowers.createIndex({ "name": "text", "variety": "text", "description": "text" });

// Create indexes for categories collection
db.categories.createIndex({ "slug": 1, "active": 1 });
db.categories.createIndex({ "parentCategory": 1, "active": 1 });
db.categories.createIndex({ "featured": 1, "active": 1 });

// Insert default categories
db.categories.insertMany([
  {
    name: "Standard Carnations",
    slug: "standard-carnations",
    description: "Large-headed premium carnations with full, ruffled petals",
    image: {
      url: "/images/categories/standard-carnations.svg",
      alt: "Standard Carnations"
    },
    parentCategory: null,
    displayOrder: 1,
    active: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Spray Carnations",
    slug: "spray-carnations", 
    description: "Multi-headed carnations with smaller blooms, perfect for texture",
    image: {
      url: "/images/categories/spray-carnations.svg",
      alt: "Spray Carnations"
    },
    parentCategory: null,
    displayOrder: 2,
    active: true,
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Mini Carnations",
    slug: "mini-carnations",
    description: "Delicate small carnations ideal for corsages and boutonnières", 
    image: {
      url: "/images/categories/mini-carnations.svg",
      alt: "Mini Carnations"
    },
    parentCategory: null,
    displayOrder: 3,
    active: true,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Specialty Carnations",
    slug: "specialty-carnations",
    description: "Unique varieties including bi-color and novelty carnations",
    image: {
      url: "/images/categories/specialty-carnations.svg", 
      alt: "Specialty Carnations"
    },
    parentCategory: null,
    displayOrder: 4,
    active: true,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Insert sample flowers
db.flowers.insertMany([
  {
    name: "Antica",
    variety: "Standard",
    type: "carnation",
    color: "Pink",
    origin: "Colombia",
    description: "Classic pink carnation with excellent vase life and full, ruffled blooms. Perfect for bouquets and arrangements.",
    images: [{
      url: "/images/flowers/carnations/pink-carnations.svg",
      alt: "Antica Pink Carnation",
      isPrimary: true
    }],
    availability: {
      inStock: true,
      stockQuantity: 500,
      seasonality: {
        available: true,
        seasons: ["spring", "summer", "autumn", "winter"]
      }
    },
    pricing: {
      wholesaler: {
        boxQuantity: 25,
        pricePerBox: 18.75,
        currency: "PLN"
      },
      florist: {
        pricePerStem: 0.85,
        minimumQuantity: 10,
        currency: "PLN"
      }
    },
    specifications: {
      stemLength: {
        min: 50,
        max: 60,
        unit: "cm"
      },
      bloomSize: "medium",
      petalCount: "double",
      fragrance: "light"
    },
    careInstructions: {
      waterTemperature: "Cool water",
      stemCutting: "Cut 2cm at 45° angle", 
      preservatives: "Use flower food",
      storage: "Cool, dark place",
      lifespan: {
        days: 7,
        conditions: "Proper care"
      }
    },
    tags: ["carnation", "pink", "standard", "classic"],
    featured: true,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "White Sim",
    variety: "Standard", 
    type: "carnation",
    color: "White",
    origin: "Netherlands",
    description: "Pure white carnations with strong stems and long-lasting blooms. Ideal for weddings and formal arrangements.",
    images: [{
      url: "/images/flowers/carnations/white-carnations.svg",
      alt: "White Sim Carnation",
      isPrimary: true
    }],
    availability: {
      inStock: true,
      stockQuantity: 300,
      seasonality: {
        available: true,
        seasons: ["spring", "summer", "autumn", "winter"] 
      }
    },
    pricing: {
      wholesaler: {
        boxQuantity: 25,
        pricePerBox: 22.50,
        currency: "PLN"
      },
      florist: {
        pricePerStem: 0.95,
        minimumQuantity: 10,
        currency: "PLN"
      }
    },
    specifications: {
      stemLength: {
        min: 55,
        max: 65,
        unit: "cm"
      },
      bloomSize: "large",
      petalCount: "double",
      fragrance: "light"
    },
    careInstructions: {
      waterTemperature: "Cool water",
      stemCutting: "Cut 2cm at 45° angle",
      preservatives: "Use flower food", 
      storage: "Cool, dark place",
      lifespan: {
        days: 10,
        conditions: "Proper care"
      }
    },
    tags: ["carnation", "white", "standard", "wedding"],
    featured: true,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Red Barbara",
    variety: "Standard",
    type: "carnation", 
    color: "Red",
    origin: "Colombia",
    description: "Vibrant red carnations with exceptional color retention and sturdy stems. Perfect for romantic bouquets.",
    images: [{
      url: "/images/flowers/carnations/red-carnations.svg",
      alt: "Red Barbara Carnation",
      isPrimary: true
    }],
    availability: {
      inStock: true,
      stockQuantity: 400,
      seasonality: {
        available: true,
        seasons: ["spring", "summer", "autumn", "winter"]
      }
    },
    pricing: {
      wholesaler: {
        boxQuantity: 25,
        pricePerBox: 20.00,
        currency: "PLN"
      },
      florist: {
        pricePerStem: 0.90,
        minimumQuantity: 10,
        currency: "PLN"
      }
    },
    specifications: {
      stemLength: {
        min: 50,
        max: 60,
        unit: "cm"
      },
      bloomSize: "medium",
      petalCount: "double", 
      fragrance: "moderate"
    },
    careInstructions: {
      waterTemperature: "Cool water",
      stemCutting: "Cut 2cm at 45° angle",
      preservatives: "Use flower food",
      storage: "Cool, dark place",
      lifespan: {
        days: 8,
        conditions: "Proper care"
      }
    },
    tags: ["carnation", "red", "standard", "romantic"],
    featured: false,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("MongoDB initialization completed successfully!");
print("Created collections: flowers, categories");
print("Inserted sample data for testing");