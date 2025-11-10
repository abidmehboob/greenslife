const express = require('express');
const router = express.Router();
const { Flower, Category } = require('../models/mongo');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all flowers with user-type specific pricing
router.get('/', async (req, res) => {
  try {
    // Complete catalog with organized image paths
    const mockFlowers = [
      // CARNATIONS
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Red Carnation',
        category: 'carnations',
        variety: 'Standard',
        color: 'red',
        description: 'Classic red carnations perfect for romantic bouquets and special occasions',
        images: [
          {
            url: '/images/flowers/red-carnation.jpg',
            alt: 'Red Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 25.00,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439013',
        name: 'Pink Carnation',
        category: 'carnations',
        variety: 'Standard',
        color: 'pink',
        description: 'Soft pink carnations ideal for gentle expressions of love and appreciation',
        images: [
          {
            url: '/images/flowers/pink-carnation.jpg',
            alt: 'Pink Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 24.00,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439014',
        name: 'White Carnation',
        category: 'carnations',
        variety: 'Standard',
        color: 'white',
        description: 'Pure white carnations symbolizing pure love and good luck',
        images: [
          {
            url: '/images/flowers/white-carnation.jpg',
            alt: 'White Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 23.00,
          pricePerStem: 0.32,
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
          vaseLife: '8-12 days',
          origin: 'Netherlands'
        },
        tags: ['carnation', 'white', 'pure', 'wedding'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439015',
        name: 'Yellow Carnation',
        category: 'carnations',
        variety: 'Standard',
        color: 'yellow',
        description: 'Bright yellow carnations bringing sunshine and joy to any arrangement',
        images: [
          {
            url: '/images/flowers/yellow-carnation.jpg',
            alt: 'Yellow Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 26.00,
          pricePerStem: 0.36,
          minQuantity: 1,
          boxEquivalent: 100
        },
        availability: {
          inStock: true,
          stockQuantity: 350,
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
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439016',
        name: 'Purple Carnation',
        category: 'carnations',
        variety: 'Standard',
        color: 'purple',
        description: 'Rich purple carnations for sophisticated and elegant arrangements',
        images: [
          {
            url: '/images/flowers/purple-carnation.jpg',
            alt: 'Purple Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 28.00,
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
          origin: 'Ecuador'
        },
        tags: ['carnation', 'purple', 'elegant', 'sophisticated'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // SPRAY CARNATIONS
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'White Spray Carnation',
        category: 'spray-carnations',
        variety: 'Spray',
        color: 'white',
        description: 'Elegant white spray carnations perfect for wedding arrangements and bouquets',
        images: [
          {
            url: '/images/flowers/white-spray-carnation.jpg',
            alt: 'White Spray Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 30.00,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439017',
        name: 'Pink Spray Carnation',
        category: 'spray-carnations',
        variety: 'Spray',
        color: 'pink',
        description: 'Delicate pink spray carnations with multiple blooms per stem',
        images: [
          {
            url: '/images/flowers/pink-spray-carnation.jpg',
            alt: 'Pink Spray Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 32.00,
          pricePerStem: 0.47,
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
        tags: ['spray-carnation', 'pink', 'delicate', 'multi-bloom'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439018',
        name: 'Red Spray Carnation',
        category: 'spray-carnations',
        variety: 'Spray',
        color: 'red',
        description: 'Vibrant red spray carnations adding richness to floral displays',
        images: [
          {
            url: '/images/flowers/red-spray-carnation.jpg',
            alt: 'Red Spray Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 33.00,
          pricePerStem: 0.48,
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
          origin: 'Colombia'
        },
        tags: ['spray-carnation', 'red', 'vibrant', 'rich'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439019',
        name: 'Yellow Spray Carnation',
        category: 'spray-carnations',
        variety: 'Spray',
        color: 'yellow',
        description: 'Cheerful yellow spray carnations bringing brightness to arrangements',
        images: [
          {
            url: '/images/flowers/yellow-spray-carnation.jpg',
            alt: 'Yellow Spray Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 31.00,
          pricePerStem: 0.46,
          minQuantity: 1,
          boxEquivalent: 100
        },
        availability: {
          inStock: true,
          stockQuantity: 240,
          seasonal: false,
          availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
        },
        specifications: {
          stemLength: '40-50cm',
          headSize: '3-4cm',
          vaseLife: '8-12 days',
          origin: 'Colombia'
        },
        tags: ['spray-carnation', 'yellow', 'cheerful', 'bright'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439020',
        name: 'Orange Spray Carnation',
        category: 'spray-carnations',
        variety: 'Spray',
        color: 'orange',
        description: 'Warm orange spray carnations perfect for autumn arrangements',
        images: [
          {
            url: '/images/flowers/orange-spray-carnation.jpg',
            alt: 'Orange Spray Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 34.00,
          pricePerStem: 0.49,
          minQuantity: 1,
          boxEquivalent: 100
        },
        availability: {
          inStock: true,
          stockQuantity: 200,
          seasonal: true,
          availableMonths: [9,10,11,12,1,2]
        },
        specifications: {
          stemLength: '40-50cm',
          headSize: '3-4cm',
          vaseLife: '8-12 days',
          origin: 'Netherlands'
        },
        tags: ['spray-carnation', 'orange', 'warm', 'autumn'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    console.log('Returning mock flower data (MongoDB not connected)');
    
    res.json({
      flowers: mockFlowers,
      pagination: {
        current: 1,
        pages: 1,
        total: mockFlowers.length,
        limit: 20
      }
    });

  } catch (error) {
    console.error('Error fetching flowers:', error);
    res.status(500).json({ message: 'Failed to fetch flowers' });
  }
});

// Get single flower by ID
router.get('/:id', async (req, res) => {
  try {
    const flower = await Flower.findOne({ 
      _id: req.params.id, 
      active: true 
    });

    if (!flower) {
      return res.status(404).json({ message: 'Flower not found' });
    }

    res.json(flower);
  } catch (error) {
    console.error('Error fetching flower:', error);
    res.status(500).json({ message: 'Failed to fetch flower' });
  }
});

// Get flower pricing for user type
router.get('/:id/pricing', authenticateToken, async (req, res) => {
  try {
    const flower = await Flower.findOne({ 
      _id: req.params.id, 
      active: true 
    });

    if (!flower) {
      return res.status(404).json({ message: 'Flower not found' });
    }

    const pricing = flower.getPriceForUserType(req.user.userType);
    res.json({ pricing });
  } catch (error) {
    console.error('Error fetching flower pricing:', error);
    res.status(500).json({ message: 'Failed to fetch flower pricing' });
  }
});

// Get featured flowers
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    // Featured flowers selection
    const featuredFlowers = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Red Carnation',
        category: 'carnations',
        variety: 'Standard',
        color: 'red',
        description: 'Classic red carnations perfect for romantic bouquets and special occasions',
        images: [
          {
            url: '/images/flowers/red-carnation.jpg',
            alt: 'Red Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 25.00,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'White Spray Carnation',
        category: 'spray-carnations',
        variety: 'Spray',
        color: 'white',
        description: 'Elegant white spray carnations perfect for wedding arrangements and bouquets',
        images: [
          {
            url: '/images/flowers/white-spray-carnation.jpg',
            alt: 'White Spray Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 30.00,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439013',
        name: 'Pink Carnation',
        category: 'carnations',
        variety: 'Standard',
        color: 'pink',
        description: 'Soft pink carnations ideal for gentle expressions of love and appreciation',
        images: [
          {
            url: '/images/flowers/pink-carnation.jpg',
            alt: 'Pink Carnation',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 24.00,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    console.log('Returning mock featured flowers');
    res.json(featuredFlowers.slice(0, parseInt(limit)));
  } catch (error) {
    console.error('Error fetching featured flowers:', error);
    res.status(500).json({ message: 'Failed to fetch featured flowers' });
  }
});

// Get flowers by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // First, check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const filters = {
      active: true,
      // Add category filtering logic here based on your flower-category relationship
    };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const flowers = await Flower.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Flower.countDocuments(filters);

    res.json({
      flowers,
      category,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching flowers by category:', error);
    res.status(500).json({ message: 'Failed to fetch flowers by category' });
  }
});

// Get flower types and colors for filters
router.get('/filters/options', async (req, res) => {
  try {
    const types = await Flower.distinct('type', { active: true });
    const colors = await Flower.distinct('color', { active: true });

    res.json({
      types,
      colors: colors.sort()
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ message: 'Failed to fetch filter options' });
  }
});

// Admin routes for managing flowers
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const flower = new Flower(req.body);
    await flower.save();
    res.status(201).json({ message: 'Flower created successfully', flower });
  } catch (error) {
    console.error('Flower creation error:', error);
    res.status(500).json({ message: 'Failed to create flower' });
  }
});

router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const flower = await Flower.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!flower) {
      return res.status(404).json({ message: 'Flower not found' });
    }

    res.json({ message: 'Flower updated successfully', flower });
  } catch (error) {
    console.error('Flower update error:', error);
    res.status(500).json({ message: 'Failed to update flower' });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const flower = await Flower.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    
    if (!flower) {
      return res.status(404).json({ message: 'Flower not found' });
    }

    res.json({ message: 'Flower deactivated successfully' });
  } catch (error) {
    console.error('Flower deletion error:', error);
    res.status(500).json({ message: 'Failed to delete flower' });
  }
});

module.exports = router;