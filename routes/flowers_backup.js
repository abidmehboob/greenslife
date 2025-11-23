const express = require('express');
const router = express.Router();
const { Flower, Category } = require('../models/mongo');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { categories, flowers: carnationFlowers } = require('../data/carnationCatalog');

// Get all flowers with pagination and category filtering
router.get('/', async (req, res) => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    // Use our expanded carnation catalog
    let allFlowers = carnationFlowers.map(flower => ({
      _id: flower.id,
      id: flower.id,
      name: flower.name,
      category: flower.category,
      categoryId: flower.categoryId,
      description: flower.description,
      color: flower.color,
      colors: flower.colors,
      images: [{ url: flower.image, isPrimary: true, alt: flower.name }],
      availability: flower.availability,
      pricing: flower.pricing,
      specifications: flower.specifications,
      isNew: flower.isNew || false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Apply category filter
    if (category) {
      allFlowers = allFlowers.filter(flower => 
        flower.categoryId === category || 
        flower.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      allFlowers = allFlowers.filter(flower =>
        flower.name.toLowerCase().includes(searchLower) ||
        flower.description.toLowerCase().includes(searchLower) ||
        flower.color.toLowerCase().includes(searchLower) ||
        flower.category.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const totalFlowers = allFlowers.length;
    const totalPages = Math.ceil(totalFlowers / limit);
    const paginatedFlowers = allFlowers.slice(skip, skip + limit);

    // Apply user-specific pricing if authenticated
    if (req.user) {
      const userType = req.user.userType;
      processedFlowers = processedFlowers.map(flower => {
        const flowerCopy = { ...flower };
        
        if (userType === 'wholesaler') {
          // Wholesaler sees box pricing
          flowerCopy.pricing = {
            pricePerBox: flower.pricing.wholesaler.pricePerBox,
            boxSize: flower.pricing.wholesaler.boxSize,
            pricePerStem: flower.pricing.wholesaler.pricePerStem,
            minQuantity: flower.pricing.wholesaler.boxSize,
            displayUnit: 'box'
          };
        } else {
          // Florist and others see per-stem pricing
          flowerCopy.pricing = {
            pricePerStem: flower.pricing.florist.pricePerStem,
            minQuantity: flower.pricing.florist.minQuantity,
            displayUnit: 'stem'
          };
        }
        
        return flowerCopy;
      });
    } else {
      // Default to florist pricing for unauthenticated users
      processedFlowers = processedFlowers.map(flower => {
        const flowerCopy = { ...flower };
        flowerCopy.pricing = {
          pricePerStem: flower.pricing.florist.pricePerStem,
          minQuantity: flower.pricing.florist.minQuantity,
          displayUnit: 'stem'
        };
        return flowerCopy;
      });
    }

    // Return paginated response
    res.json({
      success: true,
      flowers: processedFlowers,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalFlowers,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      categories: categories,
      filters: {
        category: category || null,
        search: search || null
      }
    });

  } catch (error) {
    console.error('Error fetching flowers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flowers',
      error: error.message
    });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Get flower by ID
router.get('/:id', async (req, res) => {
  try {
    const flowerId = req.params.id;
    
    // Find flower in our catalog
    const flower = carnationFlowers.find(f => f.id === flowerId);
    
    if (!flower) {
      return res.status(404).json({
        success: false,
        message: 'Flower not found'
      });
    }

    // Format flower data
    const formattedFlower = {
      _id: flower.id,
      id: flower.id,
      name: flower.name,
      category: flower.category,
      categoryId: flower.categoryId,
      description: flower.description,
      color: flower.color,
      colors: flower.colors,
      images: [{ url: flower.image, isPrimary: true, alt: flower.name }],
      availability: flower.availability,
      specifications: flower.specifications,
      isNew: flower.isNew || false,
      isActive: true
    };

    // Apply user-specific pricing
    if (req.user && req.user.userType === 'wholesaler') {
      formattedFlower.pricing = flower.pricing.wholesaler;
    } else {
      formattedFlower.pricing = flower.pricing.florist;
    }

    res.json({
      success: true,
      flower: formattedFlower
    });

  } catch (error) {
    console.error('Error fetching flower:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flower',
      error: error.message
    });
  }
});

// Get flowers by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter flowers by category
    let categoryFlowers = carnationFlowers.filter(flower => 
      flower.categoryId === categoryId
    );

    // Apply pagination
    const totalFlowers = categoryFlowers.length;
    const totalPages = Math.ceil(totalFlowers / limit);
    const paginatedFlowers = categoryFlowers.slice(skip, skip + limit);

    // Format response
    const processedFlowers = paginatedFlowers.map(flower => ({
      _id: flower.id,
      id: flower.id,
      name: flower.name,
      category: flower.category,
      categoryId: flower.categoryId,
      description: flower.description,
      color: flower.color,
      colors: flower.colors,
      images: [{ url: flower.image, isPrimary: true, alt: flower.name }],
      availability: flower.availability,
      pricing: req.user && req.user.userType === 'wholesaler' 
        ? flower.pricing.wholesaler 
        : flower.pricing.florist,
      specifications: flower.specifications,
      isNew: flower.isNew || false,
      isActive: true
    }));

    res.json({
      success: true,
      flowers: processedFlowers,
      category: categories.find(c => c.id === categoryId),
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalFlowers,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching category flowers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category flowers',
      error: error.message
    });
  }
});

module.exports = router;
        images: [
          {
            url: '/images/flowers/carnations/red-carnations.svg',
            alt: 'Red Carnations',
            isPrimary: true
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
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439013',
        name: 'Pink Carnations',
        category: 'carnations',
        variety: 'Standard',
        color: 'pink',
        description: 'Soft pink carnations ideal for gentle expressions of love and appreciation',
        images: [
          {
            url: '/images/flowers/carnations/pink-carnations.svg',
            alt: 'Pink Carnations',
            isPrimary: true
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
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439014',
        name: 'White Carnations',
        category: 'carnations',
        variety: 'Standard',
        color: 'white',
        description: 'Pure white carnations perfect for weddings and elegant arrangements',
        images: [
          {
            url: '/images/flowers/carnations/white-carnations.svg',
            alt: 'White Carnations',
            isPrimary: true
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
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439015',
        name: 'Yellow Carnations',
        category: 'carnations',
        variety: 'Standard',
        color: 'yellow',
        description: 'Bright yellow carnations that bring sunshine and joy to any arrangement',
        images: [
          {
            url: '/images/flowers/carnations/yellow-carnations.svg',
            alt: 'Yellow Carnations',
            isPrimary: true
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
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439016',
        name: 'Purple Carnations',
        category: 'carnations',
        variety: 'Standard',
        color: 'purple',
        description: 'Unique purple carnations for sophisticated and distinctive floral designs',
        images: [
          {
            url: '/images/flowers/carnations/purple-carnations.svg',
            alt: 'Purple Carnations',
            isPrimary: true
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
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439017',
        name: 'Standard Carnations',
        category: 'carnations',
        variety: 'Standard',
        color: 'various',
        description: 'Premium large-headed carnations with full, ruffled petals. Perfect for bouquets and arrangements.',
        images: [
          {
            url: '/images/flowers/carnations/standard-carnations.svg',
            alt: 'Standard Carnations',
            isPrimary: true
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
          stockQuantity: 400,
          seasonal: false,
          availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
        },
        specifications: {
          stemLength: '50-60cm',
          headSize: '5-6cm',
          vaseLife: '7-10 days',
          origin: 'Colombia'
        },
        tags: ['carnation', 'standard', 'premium', 'large'],
        isActive: true,
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439018',
        name: 'Mini Carnations',
        category: 'carnations',
        variety: 'Mini',
        color: 'various',
        description: 'Delicate small carnations perfect for corsages and boutonnières.',
        images: [
          {
            url: '/images/flowers/carnations/mini-carnations.svg',
            alt: 'Mini Carnations',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 28.00,
          pricePerStem: 0.28,
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
          stemLength: '35-45cm',
          headSize: '2-3cm',
          vaseLife: '7-10 days',
          origin: 'Colombia'
        },
        tags: ['carnation', 'mini', 'small', 'delicate'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439019',
        name: 'Green Carnations',
        category: 'carnations',
        variety: 'Standard',
        color: 'green',
        description: 'Unique green carnations for contemporary and eco-themed arrangements.',
        images: [
          {
            url: '/images/flowers/carnations/green-carnations.svg',
            alt: 'Green Carnations',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 52.00,
          pricePerStem: 0.52,
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
          stemLength: '50-60cm',
          headSize: '4-5cm',
          vaseLife: '7-10 days',
          origin: 'Netherlands'
        },
        tags: ['carnation', 'green', 'unique', 'contemporary'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439020',
        name: 'Orange Carnations',
        category: 'carnations',
        variety: 'Standard',
        color: 'orange',
        description: 'Vibrant orange carnations for energetic and warm arrangements.',
        images: [
          {
            url: '/images/flowers/carnations/orange-carnations.svg',
            alt: 'Orange Carnations',
            isPrimary: true
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
          stockQuantity: 280,
          seasonal: false,
          availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
        },
        specifications: {
          stemLength: '50-60cm',
          headSize: '4-5cm',
          vaseLife: '7-10 days',
          origin: 'Colombia'
        },
        tags: ['carnation', 'orange', 'vibrant', 'warm'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439027',
        name: 'Bicolor Carnations',
        category: 'carnations',
        variety: 'Standard',
        color: 'bicolor',
        description: 'Stunning two-toned carnations with unique color combinations and patterns.',
        images: [
          {
            url: '/images/flowers/carnations/bicolor-carnations.svg',
            alt: 'Bicolor Carnations',
            isPrimary: true
          }
        ],
        pricing: {
          boxSize: 100,
          pricePerBox: 55.00,
          pricePerStem: 0.55,
          minQuantity: 1,
          boxEquivalent: 100
        },
        availability: {
          inStock: true,
          stockQuantity: 150,
          seasonal: false,
          availableMonths: [1,2,3,4,5,6,7,8,9,10,11,12]
        },
        specifications: {
          stemLength: '50-60cm',
          headSize: '4-5cm',
          vaseLife: '7-10 days',
          origin: 'Netherlands'
        },
        tags: ['carnation', 'bicolor', 'unique', 'patterns'],
        isActive: true,
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // SPRAY CARNATIONS
      {
        _id: '507f1f77bcf86cd799439021',
        name: 'Spray Carnations',
        category: 'carnations',
        variety: 'Spray',
        color: 'mixed',
        description: 'Multi-headed carnations with smaller blooms. Excellent for filler and texture.',
        images: [
          {
            url: '/images/flowers/carnations/spray-carnations.svg',
            alt: 'Spray Carnations',
            isPrimary: true
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
        tags: ['spray-carnation', 'multi-headed', 'texture', 'filler'],
        isActive: true,
        isFeatured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

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
            url: '/images/flowers/carnations/red-carnation-1.svg',
            alt: 'Red Carnation - Front view',
            isPrimary: true
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '507f1f77bcf86cd799439021',
        name: 'White Spray Carnation',
        category: 'spray-carnations',
        variety: 'Spray',
        color: 'white',
        description: 'Elegant white spray carnations perfect for wedding arrangements and bouquets',
        images: [
          {
            url: '/images/flowers/spray-carnations/white-spray-carnation-1.svg',
            alt: 'White Spray Carnation - Front view',
            isPrimary: true
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
            url: '/images/flowers/carnations/pink-carnation-1.svg',
            alt: 'Pink Carnation - Front view',
            isPrimary: true
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    try {
      // Try to get flowers from MongoDB
      const flowers = await Flower.find({ isActive: true })
        .populate('category')
        .sort({ name: 1 });
      
      if (flowers.length > 0) {
        console.log('✓ Using MongoDB data');
        // Format response to match React frontend expectations
        const response = {
          flowers: flowers,
          pagination: {
            current: 1,
            limit: 12,
            total: flowers.length,
            pages: Math.ceil(flowers.length / 12)
          }
        };
        res.json(response);
      } else {
        throw new Error('No flowers found in MongoDB');
      }
    } catch (mongoError) {
      console.log('⚠ MongoDB unavailable, using mock data');
      // Format mock response to match React frontend expectations
      const response = {
        flowers: mockFlowers,
        pagination: {
          current: 1,
          limit: 12,
          total: mockFlowers.length,
          pages: Math.ceil(mockFlowers.length / 12)
        }
      };
      res.json(response);
    }

  } catch (error) {
    console.error('Flowers API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch flowers',
      error: error.message 
    });
  }
});

// Get featured flowers
router.get('/featured', async (req, res) => {
  try {
    try {
      // Try to get featured flowers from MongoDB
      const flowers = await Flower.find({ isActive: true, isFeatured: true })
        .populate('category')
        .sort({ name: 1 });
      
      if (flowers.length > 0) {
        console.log('✓ Using MongoDB featured data');
        res.json({ success: true, data: flowers });
      } else {
        throw new Error('No featured flowers found in MongoDB');
      }
    } catch (mongoError) {
      console.log('⚠ MongoDB unavailable for featured, using mock data');
      // Mock featured flowers
      const mockFeatured = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Red Carnation',
          category: 'carnations',
          description: 'Classic red carnations perfect for romantic occasions',
          images: [{ url: '/images/flowers/carnations/red-carnation-1.svg', alt: 'Red Carnation', isPrimary: true }],
          pricing: { pricePerStem: 0.35, pricePerBox: 35.00 },
          isActive: true
        },
        {
          _id: '507f1f77bcf86cd799439021',
          name: 'White Spray Carnation',
          category: 'spray-carnations',
          description: 'Elegant white spray carnations for weddings',
          images: [{ url: '/images/flowers/spray-carnations/white-spray-carnation-1.svg', alt: 'White Spray Carnation', isPrimary: true }],
          pricing: { pricePerStem: 0.45, pricePerBox: 45.00 },
          isActive: true
        },
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'Pink Carnation',
          category: 'carnations',
          description: 'Soft pink carnations for gentle expressions',
          images: [{ url: '/images/flowers/carnations/pink-carnation-1.svg', alt: 'Pink Carnation', isPrimary: true }],
          pricing: { pricePerStem: 0.33, pricePerBox: 33.00 },
          isActive: true
        }
      ];
      res.json({ success: true, data: mockFeatured });
    }
  } catch (error) {
    console.error('Featured flowers API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch featured flowers',
      error: error.message 
    });
  }
});

// Get flower by ID
router.get('/:id', async (req, res) => {
  try {
    const flowerId = req.params.id;
    
    try {
      // Try MongoDB first
      const flower = await Flower.findById(flowerId).populate('category');
      if (flower) {
        console.log('✓ Using MongoDB flower data');
        res.json({ success: true, data: flower });
        return;
      }
    } catch (mongoError) {
      console.log('⚠ MongoDB unavailable, searching mock data');
    }

    // Fallback to mock data
    const mockFlowers = [
      // Include the same mockFlowers array as above for single flower lookup
      // (truncated for brevity - would include full array)
    ];
    
    const flower = mockFlowers.find(f => f._id === flowerId);
    if (flower) {
      res.json({ success: true, data: flower });
    } else {
      res.status(404).json({ success: false, message: 'Flower not found' });
    }

  } catch (error) {
    console.error('Single flower API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch flower',
      error: error.message 
    });
  }
});

// Get flowers by category
router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    
    try {
      // Try MongoDB first
      const flowers = await Flower.find({ 
        category: category, 
        isActive: true 
      }).populate('category');
      
      if (flowers.length > 0) {
        console.log('✓ Using MongoDB category data');
        res.json({ success: true, data: flowers });
        return;
      }
    } catch (mongoError) {
      console.log('⚠ MongoDB unavailable, filtering mock data');
    }

    // Fallback to mock data filtering
    const mockFlowers = [
      // Include the same mockFlowers array as above
      // (truncated for brevity - would include full array)
    ];
    
    const categoryFlowers = mockFlowers.filter(f => f.category === category && f.isActive);
    res.json({ success: true, data: categoryFlowers });

  } catch (error) {
    console.error('Category flowers API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch category flowers',
      error: error.message 
    });
  }
});

// Admin routes for flower management
router.post('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const flower = new Flower(req.body);
    await flower.save();
    res.status(201).json({ 
      success: true, 
      message: 'Flower created successfully',
      data: flower 
    });
  } catch (error) {
    console.error('Create flower error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to create flower',
      error: error.message 
    });
  }
});

router.put('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const flower = await Flower.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!flower) {
      return res.status(404).json({ 
        success: false, 
        message: 'Flower not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Flower updated successfully',
      data: flower 
    });
  } catch (error) {
    console.error('Update flower error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to update flower',
      error: error.message 
    });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const flower = await Flower.findByIdAndDelete(req.params.id);
    
    if (!flower) {
      return res.status(404).json({ 
        success: false, 
        message: 'Flower not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Flower deleted successfully' 
    });
  } catch (error) {
    console.error('Delete flower error:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to delete flower',
      error: error.message 
    });
  }
});

module.exports = router;
