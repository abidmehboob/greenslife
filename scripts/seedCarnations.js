const { connectMongoDB } = require('../config/database');
const Flower = require('../models/mongo/Flower');

const carnations = [
    {
        name: 'Antigua',
        category: 'Carnations',
        description: 'Classic white carnations with excellent vase life and full, ruffled blooms',
        color: 'Pure White',
        stemLength: '50-60cm',
        availability: {
            inStock: true,
            seasonality: 'Year-round',
            lastUpdated: new Date()
        },
        pricing: {
            wholesaler: {
                pricePerBox: 31.25,
                boxSize: 25,
                pricePerStem: 1.25
            },
            florist: {
                pricePerStem: 2.50
            }
        },
        specifications: {
            bloomSize: 'Large',
            fragrance: 'Mild',
            vaseLife: '7-10 days',
            grade: 'Premium'
        },
        origin: 'Colombia',
        tags: ['wedding', 'classic', 'white', 'premium']
    },
    {
        name: 'Bach',
        category: 'Carnations',
        description: 'Elegant pink carnations perfect for romantic arrangements and bouquets',
        color: 'Soft Pink',
        stemLength: '40-50cm',
        availability: {
            inStock: true,
            seasonality: 'Year-round',
            lastUpdated: new Date()
        },
        pricing: {
            wholesaler: {
                pricePerBox: 32.50,
                boxSize: 25,
                pricePerStem: 1.30
            },
            florist: {
                pricePerStem: 2.60
            }
        },
        specifications: {
            bloomSize: 'Medium-Large',
            fragrance: 'Sweet',
            vaseLife: '8-12 days',
            grade: 'Premium'
        },
        origin: 'Colombia',
        tags: ['romantic', 'pink', 'sweet', 'bouquet']
    },
    {
        name: 'Bernard',
        category: 'Carnations',
        description: 'Deep red carnations with strong fragrance and vibrant color',
        color: 'Deep Red',
        stemLength: '50-60cm',
        availability: {
            inStock: true,
            seasonality: 'Year-round',
            lastUpdated: new Date()
        },
        pricing: {
            wholesaler: {
                pricePerBox: 35.00,
                boxSize: 25,
                pricePerStem: 1.40
            },
            florist: {
                pricePerStem: 2.80
            }
        },
        specifications: {
            bloomSize: 'Large',
            fragrance: 'Strong',
            vaseLife: '7-10 days',
            grade: 'Premium'
        },
        origin: 'Colombia',
        tags: ['red', 'passionate', 'strong fragrance', 'valentine']
    },
    {
        name: 'Bizet',
        category: 'Carnations',
        description: 'Unique striped carnations with pink and white patterns',
        color: 'Pink & White Striped',
        stemLength: '45-55cm',
        availability: {
            inStock: true,
            seasonality: 'Year-round',
            lastUpdated: new Date()
        },
        pricing: {
            wholesaler: {
                pricePerBox: 37.50,
                boxSize: 25,
                pricePerStem: 1.50
            },
            florist: {
                pricePerStem: 3.00
            }
        },
        specifications: {
            bloomSize: 'Medium',
            fragrance: 'Mild',
            vaseLife: '8-10 days',
            grade: 'Specialty'
        },
        origin: 'Colombia',
        tags: ['striped', 'unique', 'specialty', 'decorative']
    },
    {
        name: 'Brut',
        category: 'Carnations',
        description: 'Cream colored carnations with ruffled edges and elegant appearance',
        color: 'Cream',
        stemLength: '50-60cm',
        availability: {
            inStock: true,
            seasonality: 'Year-round',
            lastUpdated: new Date()
        },
        pricing: {
            wholesaler: {
                pricePerBox: 33.75,
                boxSize: 25,
                pricePerStem: 1.35
            },
            florist: {
                pricePerStem: 2.70
            }
        },
        specifications: {
            bloomSize: 'Large',
            fragrance: 'Mild',
            vaseLife: '7-12 days',
            grade: 'Premium'
        },
        origin: 'Colombia',
        tags: ['cream', 'elegant', 'ruffled', 'classic']
    },
    {
        name: 'Caroline',
        category: 'Carnations',
        description: 'Lavender carnations with delicate petals and subtle fragrance',
        color: 'Lavender',
        stemLength: '40-50cm',
        availability: {
            inStock: true,
            seasonality: 'Year-round',
            lastUpdated: new Date()
        },
        pricing: {
            wholesaler: {
                pricePerBox: 36.25,
                boxSize: 25,
                pricePerStem: 1.45
            },
            florist: {
                pricePerStem: 2.90
            }
        },
        specifications: {
            bloomSize: 'Medium',
            fragrance: 'Subtle',
            vaseLife: '8-11 days',
            grade: 'Premium'
        },
        origin: 'Colombia',
        tags: ['lavender', 'delicate', 'subtle', 'spring']
    },
    {
        name: 'Damascus',
        category: 'Carnations',
        description: 'Premium burgundy carnations with rich, deep color',
        color: 'Burgundy',
        stemLength: '55-65cm',
        availability: {
            inStock: true,
            seasonality: 'Year-round',
            lastUpdated: new Date()
        },
        pricing: {
            wholesaler: {
                pricePerBox: 40.00,
                boxSize: 25,
                pricePerStem: 1.60
            },
            florist: {
                pricePerStem: 3.20
            }
        },
        specifications: {
            bloomSize: 'Extra Large',
            fragrance: 'Strong',
            vaseLife: '10-14 days',
            grade: 'Premium+'
        },
        origin: 'Colombia',
        tags: ['burgundy', 'premium', 'long-lasting', 'luxury']
    },
    {
        name: 'Damascus Purple',
        category: 'Carnations',
        description: 'Rich purple carnations, premium variety with exceptional quality',
        color: 'Deep Purple',
        stemLength: '55-65cm',
        availability: {
            inStock: true,
            seasonality: 'Year-round',
            lastUpdated: new Date()
        },
        pricing: {
            wholesaler: {
                pricePerBox: 41.25,
                boxSize: 25,
                pricePerStem: 1.65
            },
            florist: {
                pricePerStem: 3.30
            }
        },
        specifications: {
            bloomSize: 'Extra Large',
            fragrance: 'Strong',
            vaseLife: '10-14 days',
            grade: 'Premium+'
        },
        origin: 'Colombia',
        tags: ['purple', 'premium', 'exceptional', 'luxury']
    },
    {
        name: 'Golem',
        category: 'Carnations',
        description: 'Large headed yellow carnations with bright, cheerful appearance',
        color: 'Bright Yellow',
        stemLength: '50-60cm',
        availability: {
            inStock: true,
            seasonality: 'Year-round',
            lastUpdated: new Date()
        },
        pricing: {
            wholesaler: {
                pricePerBox: 38.75,
                boxSize: 25,
                pricePerStem: 1.55
            },
            florist: {
                pricePerStem: 3.10
            }
        },
        specifications: {
            bloomSize: 'Extra Large', 
            fragrance: 'Mild',
            vaseLife: '8-12 days',
            grade: 'Premium'
        },
        origin: 'Colombia',
        tags: ['yellow', 'cheerful', 'large', 'sunny']
    },
    {
        name: 'Hermes',
        category: 'Carnations',
        description: 'Orange carnations with excellent longevity and vibrant color',
        color: 'Vibrant Orange',
        stemLength: '45-55cm',
        availability: {
            inStock: true,
            seasonality: 'Year-round',
            lastUpdated: new Date()
        },
        pricing: {
            wholesaler: {
                pricePerBox: 37.50,
                boxSize: 25,
                pricePerStem: 1.50
            },
            florist: {
                pricePerStem: 3.00
            }
        },
        specifications: {
            bloomSize: 'Large',
            fragrance: 'Mild',
            vaseLife: '9-13 days',
            grade: 'Premium'
        },
        origin: 'Colombia',
        tags: ['orange', 'vibrant', 'long-lasting', 'autumn']
    },
    {
        name: 'Komachi',
        category: 'Carnations',
        description: 'Bi-color carnations with white base and pink edges',
        color: 'White with Pink Edges',
        stemLength: '40-50cm',
        availability: {
            inStock: true,
            seasonality: 'Year-round',
            lastUpdated: new Date()
        },
        pricing: {
            wholesaler: {
                pricePerBox: 42.50,
                boxSize: 25,
                pricePerStem: 1.70
            },
            florist: {
                pricePerStem: 3.40
            }
        },
        specifications: {
            bloomSize: 'Medium-Large',
            fragrance: 'Sweet',
            vaseLife: '8-11 days',
            grade: 'Specialty'
        },
        origin: 'Colombia',
        tags: ['bi-color', 'specialty', 'unique', 'decorative']
    }
];

async function seedCarnations() {
    try {
        console.log('🌸 Starting carnation seed process...');
        
        // Connect to MongoDB
        await connectMongoDB();
        console.log('✓ Connected to MongoDB');

        // Clear existing carnations
        await Flower.deleteMany({ category: 'Carnations' });
        console.log('✓ Cleared existing carnations');

        // Insert new carnations
        const insertedFlowers = await Flower.insertMany(carnations);
        console.log(`✓ Inserted ${insertedFlowers.length} carnation varieties:`);
        
        insertedFlowers.forEach(flower => {
            console.log(`  - ${flower.name} (${flower.color})`);
        });

        console.log('\n🎉 Carnation seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding carnations:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedCarnations();
}

module.exports = { seedCarnations, carnations };