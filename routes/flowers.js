const express = require('express');
const router = express.Router();
const Flower = require('../models/mongo/Flower');
const Category = require('../models/mongo/Category');
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

    let flowers, totalCount;

    // Try MongoDB first
    let query = { active: true };
    
    // Apply category filter
    if (category) {
      query.type = category;
    }
    
    // Apply search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { variety: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Get flowers from MongoDB
    const mongoFlowers = await Flower.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ featured: -1, createdAt: -1 });
    
    totalCount = await Flower.countDocuments(query);
    
    // Transform MongoDB data for API response  
    flowers = mongoFlowers.map(flower => ({
      _id: flower._id,
      id: flower._id,
      name: flower.name,
      variety: flower.variety,
      category: flower.type,
      categoryId: flower.type,
      description: flower.description,
      color: flower.color,
      origin: flower.origin,
      season: flower.availability?.seasonality?.seasons?.join(', ') || 'All year',
      images: flower.images,
      availability: flower.availability,
      pricing: flower.pricing,
      specifications: flower.specifications,
      tags: flower.tags,
      featured: flower.featured,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Calculate pagination
    const totalFlowers = totalCount;
    const totalPages = Math.ceil(totalFlowers / limit);

    // Apply user-specific pricing if authenticated
    let processedFlowers = flowers;
    if (req.user) {
      const userType = req.user.userType;
      processedFlowers = flowers.map(flower => {
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
      processedFlowers = flowers.map(flower => {
        const flowerCopy = { ...flower };
        flowerCopy.pricing = {
          pricePerStem: flower.pricing.florist.pricePerStem,
          minQuantity: flower.pricing.florist.minQuantity,
          displayUnit: 'stem'
        };
        return flowerCopy;
      });
    }

    // Get categories from MongoDB
    const mongoCategories = await Category.find({ active: true })
      .sort({ displayOrder: 1, name: 1 });

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
      categories: mongoCategories.map(cat => ({ id: cat._id, name: cat.name, slug: cat.slug })),
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
    const categories = await Category.find({ active: true })
      .sort({ displayOrder: 1, name: 1 });
    
    res.json({
      success: true,
      categories: categories.map(cat => ({
        id: cat._id,
        name: cat.name,
        description: cat.description,
        image: cat.image?.url,
        slug: cat.slug
      }))
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