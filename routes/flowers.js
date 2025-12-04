const express = require('express');
const router = express.Router();
const Flower = require('../models/mongo/Flower');
const Category = require('../models/mongo/Category');
const { authenticateToken, authorizeRoles, optionalAuthenticate } = require('../middleware/auth');
const { categories, flowers: carnationFlowers } = require('../data/carnationCatalog');

// Get all flowers with pagination and category filtering
router.get('/', optionalAuthenticate, async (req, res) => {
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
    
    try {
      // For now, force fallback to carnation catalog since MongoDB flowers have incorrect pricing structure
      throw new Error('Forcing carnation catalog fallback for proper pricing');
      
      // Try to get flowers from MongoDB
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
    
    } catch (mongoError) {
      console.log('MongoDB unavailable, using carnation catalog:', mongoError.message);
      
      // Use carnation flowers as fallback
      let filteredFlowers = carnationFlowers;
      console.log(`Using ${filteredFlowers.length} carnation flowers as fallback`);
      
      // Apply category filter
      if (category) {
        filteredFlowers = filteredFlowers.filter(flower => 
          flower.categoryId === category || flower.category.toLowerCase().includes(category.toLowerCase())
        );
      }
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filteredFlowers = filteredFlowers.filter(flower =>
          flower.name.toLowerCase().includes(searchLower) ||
          flower.description.toLowerCase().includes(searchLower) ||
          flower.color.toLowerCase().includes(searchLower) ||
          flower.category.toLowerCase().includes(searchLower)
        );
      }
      
      totalCount = filteredFlowers.length;
      
      // Apply pagination
      const startIndex = skip;
      const endIndex = skip + limit;
      flowers = filteredFlowers.slice(startIndex, endIndex);
    }

    // Calculate pagination
    const totalFlowers = totalCount;
    const totalPages = Math.ceil(totalFlowers / limit);

    // Apply user-specific pricing if authenticated
    let processedFlowers = flowers;
    if (req.user) {
      const userType = req.user.userType;
      console.log(`Processing flowers for user type: ${userType}, total flowers: ${flowers.length}`);
      if (flowers.length > 0) {
        console.log(`Raw MongoDB flower pricing structure:`, JSON.stringify(flowers[0].pricing, null, 2));
      }
      processedFlowers = flowers.map(flower => {
        const flowerCopy = { ...flower };
        
        if (userType === 'wholesaler') {
          // Wholesaler sees box pricing with emphasis on bulk purchases
          const wholesalerPrice = flower.pricing.wholesaler || {};
          const boxSize = wholesalerPrice.boxSize || 25;
          const pricePerBox = wholesalerPrice.pricePerBox || (flower.pricing.pricePerStem * boxSize);
          const pricePerStem = wholesalerPrice.pricePerStem || flower.pricing.pricePerStem;
          
          flowerCopy.pricing = {
            pricePerBox: pricePerBox,
            boxQuantity: boxSize,
            pricePerStem: pricePerStem,
            minQuantity: boxSize,
            displayUnit: 'box',
            displayPrice: pricePerBox,
            displayText: `€${pricePerBox} per box (${boxSize} stems)`,
            currency: 'EUR'
          };
        } else if (userType === 'florist') {
          // Florist sees per-stem pricing
          const floristPrice = flower.pricing.florist || {};
          const pricePerStem = floristPrice.pricePerStem || flower.pricing.pricePerStem;
          const minQuantity = floristPrice.minQuantity || 1;
          
          flowerCopy.pricing = {
            pricePerStem: pricePerStem,
            minQuantity: minQuantity,
            displayUnit: 'stem',
            displayPrice: pricePerStem,
            displayText: `€${pricePerStem} per stem`,
            currency: 'EUR'
          };
        } else if (userType === 'admin') {
          // Admin sees both pricing structures for management
          const wholesalerPrice = flower.pricing.wholesaler || {};
          const floristPrice = flower.pricing.florist || {};
          const boxSize = wholesalerPrice.boxSize || 25;
          const pricePerBox = wholesalerPrice.pricePerBox || (flower.pricing.pricePerStem * boxSize);
          const wholesalePricePerStem = wholesalerPrice.pricePerStem || flower.pricing.pricePerStem;
          const floristPricePerStem = floristPrice.pricePerStem || flower.pricing.pricePerStem;
          
          flowerCopy.pricing = {
            wholesaler: {
              pricePerBox: pricePerBox,
              boxQuantity: boxSize,
              pricePerStem: wholesalePricePerStem
            },
            florist: {
              pricePerStem: floristPricePerStem,
              minQuantity: floristPrice.minQuantity || 1
            },
            displayUnit: 'both',
            displayText: `Wholesale: €${pricePerBox}/box | Retail: €${floristPricePerStem}/stem`,
            currency: 'EUR'
          };
        } else {
          // Default florist pricing for other roles
          const floristPrice = flower.pricing.florist || {};
          const pricePerStem = floristPrice.pricePerStem || flower.pricing.pricePerStem;
          const minQuantity = floristPrice.minQuantity || 1;
          
          flowerCopy.pricing = {
            pricePerStem: pricePerStem,
            minQuantity: minQuantity,
            displayUnit: 'stem',
            displayPrice: pricePerStem,
            displayText: `€${pricePerStem} per stem`,
            currency: 'EUR'
          };
        }
        
        return flowerCopy;
      });
    } else {
      // Default to florist pricing for unauthenticated users
      processedFlowers = flowers.map(flower => {
        const flowerCopy = { ...flower };
        const floristPrice = flower.pricing.florist || {};
        const pricePerStem = floristPrice.pricePerStem || flower.pricing.pricePerStem;
        const minQuantity = floristPrice.minQuantity || 1;
        
        flowerCopy.pricing = {
          pricePerStem: pricePerStem,
          minQuantity: minQuantity,
          displayUnit: 'stem',
          displayPrice: pricePerStem,
          displayText: `€${pricePerStem} per stem`,
          currency: 'EUR'
        };
        return flowerCopy;
      });
    }

    // Get categories from MongoDB or use fallback
    let availableCategories;
    try {
      const mongoCategories = await Category.find({ active: true })
        .sort({ displayOrder: 1, name: 1 });
      availableCategories = mongoCategories.map(cat => ({ id: cat._id, name: cat.name, slug: cat.slug }));
    } catch (categoryError) {
      // Use carnation categories as fallback
      availableCategories = categories.map(cat => ({ id: cat.id, name: cat.name, slug: cat.id }));
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
      categories: availableCategories,
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

// Get user's purchase history (last 1 year)
router.get('/purchase-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const { Order } = require('../models/postgres');
    const orders = await Order.findAll({
      where: {
        userId: userId,
        createdAt: {
          [require('sequelize').Op.gte]: oneYearAgo
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    
    // Process orders to include flower details
    const processedOrders = await Promise.all(orders.map(async (order) => {
      const orderData = order.toJSON();
      
      // Get flower details for each item
      if (orderData.items && orderData.items.length > 0) {
        const itemsWithDetails = await Promise.all(orderData.items.map(async (item) => {
          try {
            const flower = await Flower.findById(item.flowerId);
            return {
              ...item,
              flowerDetails: flower ? {
                name: flower.name,
                variety: flower.variety,
                color: flower.color,
                image: flower.images?.[0]?.url
              } : null
            };
          } catch (error) {
            return item;
          }
        }));
        orderData.items = itemsWithDetails;
      }
      
      return orderData;
    }));
    
    res.json({
      success: true,
      orders: processedOrders,
      totalOrders: orders.length,
      timeframe: 'Last 12 months'
    });
    
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase history',
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

// Admin-only endpoints for flower management

// Create new flower (Admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const flowerData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'variety', 'color', 'type'];
    for (const field of requiredFields) {
      if (!flowerData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }
    
    // Validate pricing structure
    if (!flowerData.pricing || 
        !flowerData.pricing.wholesaler || 
        !flowerData.pricing.florist) {
      return res.status(400).json({
        success: false,
        message: 'Both wholesaler and florist pricing are required'
      });
    }
    
    // Create new flower
    const newFlower = new Flower({
      name: flowerData.name,
      variety: flowerData.variety,
      type: flowerData.type || 'carnation',
      color: flowerData.color,
      origin: flowerData.origin || 'Netherlands',
      description: flowerData.description || '',
      images: flowerData.images || [{
        url: `/images/flowers/${flowerData.type}/${flowerData.color.toLowerCase()}-${flowerData.type}.svg`,
        alt: `${flowerData.variety} ${flowerData.name} - ${flowerData.color}`,
        isPrimary: true
      }],
      availability: {
        inStock: flowerData.availability?.inStock !== false,
        stockQuantity: flowerData.availability?.stockQuantity || 100,
        seasonality: {
          available: true,
          seasons: ['spring', 'summer', 'autumn', 'winter']
        }
      },
      pricing: {
        wholesaler: {
          boxQuantity: parseInt(flowerData.pricing.wholesaler.boxQuantity) || 25,
          pricePerBox: parseFloat(flowerData.pricing.wholesaler.pricePerBox),
          pricePerStem: parseFloat(flowerData.pricing.wholesaler.pricePerBox) / (parseInt(flowerData.pricing.wholesaler.boxQuantity) || 25),
          currency: 'PLN'
        },
        florist: {
          pricePerStem: parseFloat(flowerData.pricing.florist.pricePerStem),
          minimumQuantity: parseInt(flowerData.pricing.florist.minimumQuantity) || 1,
          currency: 'PLN'
        }
      },
      specifications: flowerData.specifications || {
        stemLength: '40-50cm',
        headSize: 'Standard',
        petalCount: 'Multiple'
      },
      tags: flowerData.tags || [],
      featured: flowerData.featured || false,
      active: true
    });
    
    const savedFlower = await newFlower.save();
    
    res.status(201).json({
      success: true,
      message: 'Flower created successfully',
      flower: savedFlower
    });
    
  } catch (error) {
    console.error('Error creating flower:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create flower',
      error: error.message
    });
  }
});

// Update flower (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const flowerId = req.params.id;
    const updateData = req.body;
    
    const updatedFlower = await Flower.findByIdAndUpdate(
      flowerId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedFlower) {
      return res.status(404).json({
        success: false,
        message: 'Flower not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Flower updated successfully',
      flower: updatedFlower
    });
    
  } catch (error) {
    console.error('Error updating flower:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update flower',
      error: error.message
    });
  }
});

// Delete flower (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const flowerId = req.params.id;
    
    const deletedFlower = await Flower.findByIdAndUpdate(
      flowerId,
      { active: false },
      { new: true }
    );
    
    if (!deletedFlower) {
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
    console.error('Error deleting flower:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete flower',
      error: error.message
    });
  }
});

module.exports = router;