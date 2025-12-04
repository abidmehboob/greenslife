const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const Flower = require('../models/mongo/Flower');
const Category = require('../models/mongo/Category');
const { Order, User } = require('../models/postgres');
const fs = require('fs').promises;
const path = require('path');

// Middleware to ensure only admin can access these routes
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get basic counts
    const [totalUsers, totalOrders, totalFlowers] = await Promise.all([
      User.count(),
      Order.count(),
      // For now use static flower count since we're using fallback data
      Promise.resolve(16) // Carnation catalog count
    ]);

    // Get order statistics
    const orders = await Order.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    // Calculate stats
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalValue || 0), 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const deliveredOrders = orders.filter(order => order.status === 'delivered').length;

    // Get user type breakdown
    const usersByType = await User.findAll({
      attributes: [
        'userType',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['userType']
    });

    const userTypeStats = usersByType.reduce((acc, user) => {
      acc[user.userType] = parseInt(user.dataValues.count);
      return acc;
    }, {});

    res.json({
      success: true,
      stats: {
        overview: {
          totalUsers,
          totalOrders,
          totalFlowers,
          totalRevenue: Math.round(totalRevenue * 100) / 100
        },
        orders: {
          pending: pendingOrders,
          completed: completedOrders,
          delivered: deliveredOrders,
          total: orders.length
        },
        users: userTypeStats,
        revenue: {
          monthly: Math.round(totalRevenue * 100) / 100,
          currency: 'EUR'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Get all products for admin management
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    // Build MongoDB query
    let query = {};
    
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
        { color: { $regex: search, $options: 'i' } }
      ];
    }

    // Get products from MongoDB
    const allProducts = await Flower.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const totalProducts = await Flower.countDocuments(query);
    
    // Transform for admin interface
    const products = allProducts.map(flower => ({
      id: flower._id,
      name: flower.name,
      variety: flower.variety,
      type: flower.type,
      category: flower.type,
      categoryId: flower.type,
      description: flower.description,
      color: flower.color,
      image: flower.images && flower.images[0] ? flower.images[0].url : null,
      availability: flower.availability,
      pricing: flower.pricing,
      specifications: flower.specifications,
      tags: flower.tags,
      featured: flower.featured,
      isActive: flower.active,
      createdAt: flower.createdAt,
      updatedAt: flower.updatedAt
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalProducts / limit);

    // Get categories from MongoDB
    const mongoCategories = await Category.find({ active: true })
      .sort({ displayOrder: 1, name: 1 });

    res.json({
      success: true,
      products: products,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalProducts,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      categories: mongoCategories.map(cat => ({ id: cat._id, name: cat.name, slug: cat.slug }))
    });

  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// Get single product for editing
router.get('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const product = carnationFlowers.find(f => f.id === productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        categoryId: product.categoryId,
        description: product.description,
        color: product.color,
        colors: product.colors,
        image: product.image,
        availability: product.availability,
        pricing: product.pricing,
        specifications: product.specifications,
        isNew: product.isNew || false,
        isActive: product.isActive !== false
      }
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

// Create new product
router.post('/products', async (req, res) => {
  try {
    const productData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'variety', 'type', 'color', 'description'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

    // Validate pricing structure
    if (!productData.pricing || 
        !productData.pricing.wholesaler || 
        !productData.pricing.florist) {
      return res.status(400).json({
        success: false,
        message: 'Both wholesaler and florist pricing are required'
      });
    }

    // Create new flower document
    const newFlower = new Flower({
      name: productData.name,
      variety: productData.variety,
      type: productData.type || 'carnation',
      color: productData.color,
      origin: productData.origin || 'Netherlands',
      description: productData.description,
      images: productData.images || [{
        url: productData.image || `/images/flowers/carnations/${productData.color.toLowerCase()}-carnations.svg`,
        alt: `${productData.variety} ${productData.name} - ${productData.color}`,
        isPrimary: true
      }],
      availability: {
        inStock: productData.availability?.inStock !== false,
        stockQuantity: productData.availability?.stockQuantity || 100,
        seasonality: {
          available: productData.availability?.seasonal !== true,
          seasons: productData.availability?.seasons || ['spring', 'summer', 'autumn', 'winter']
        }
      },
      pricing: {
        wholesaler: {
          boxQuantity: parseInt(productData.pricing.wholesaler.boxSize) || 25,
          pricePerBox: parseFloat(productData.pricing.wholesaler.pricePerBox),
          currency: 'PLN'
        },
        florist: {
          pricePerStem: parseFloat(productData.pricing.florist.pricePerStem),
          minimumQuantity: parseInt(productData.pricing.florist.minQuantity) || 1,
          currency: 'PLN'
        }
      },
      specifications: {
        stemLength: {
          min: parseInt(productData.specifications?.stemLength?.min) || 50,
          max: parseInt(productData.specifications?.stemLength?.max) || 60,
          unit: 'cm'
        },
        bloomSize: productData.specifications?.bloomSize || 'medium',
        petalCount: productData.specifications?.petalCount || 'double',
        fragrance: productData.specifications?.fragrance || 'light'
      },
      careInstructions: {
        waterTemperature: 'Cool water',
        stemCutting: 'Cut 2cm at 45° angle',
        preservatives: 'Use flower food',
        storage: 'Cool, dark place',
        lifespan: {
          days: parseInt(productData.vaseLife) || 7,
          conditions: 'Proper care'
        }
      },
      tags: productData.tags || [productData.type, productData.color, productData.variety],
      featured: productData.featured || false,
      active: productData.isActive !== false
    });

    // Save to MongoDB
    const savedFlower = await newFlower.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: {
        id: savedFlower._id,
        name: savedFlower.name,
        variety: savedFlower.variety,
        type: savedFlower.type,
        color: savedFlower.color,
        description: savedFlower.description,
        pricing: savedFlower.pricing,
        availability: savedFlower.availability,
        active: savedFlower.active,
        createdAt: savedFlower.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// Update existing product
router.put('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;
    
    const productIndex = carnationFlowers.findIndex(f => f.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update the product
    const currentProduct = carnationFlowers[productIndex];
    const updatedProduct = {
      ...currentProduct,
      ...updateData,
      id: productId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    // Validate pricing if provided
    if (updateData.pricing) {
      if (updateData.pricing.wholesaler && updateData.pricing.wholesaler.pricePerBox && updateData.pricing.wholesaler.boxSize) {
        updatedProduct.pricing.wholesaler.pricePerStem = 
          parseFloat(updateData.pricing.wholesaler.pricePerBox) / parseInt(updateData.pricing.wholesaler.boxSize);
      }
    }

    carnationFlowers[productIndex] = updatedProduct;

    // TODO: Persist to file or database
    await updateCarnationCatalogFile();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    const productIndex = carnationFlowers.findIndex(f => f.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const deletedProduct = carnationFlowers.splice(productIndex, 1)[0];

    // TODO: Persist to file or database
    await updateCarnationCatalogFile();

    res.json({
      success: true,
      message: 'Product deleted successfully',
      product: deletedProduct
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

// Get categories for product forms
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
        image: cat.image,
        slug: cat.slug,
        parentCategory: cat.parentCategory,
        displayOrder: cat.displayOrder,
        active: cat.active,
        featured: cat.featured
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

// Create new category
router.post('/categories', async (req, res) => {
  try {
    const { name, description, image, parentCategory, displayOrder } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    // Create new category document
    const newCategory = new Category({
      name: name.trim(),
      description: description || `${name} flowers and arrangements`,
      image: {
        url: image || `/images/categories/${name.toLowerCase().replace(/\s+/g, '-')}.svg`,
        alt: `${name} category`
      },
      parentCategory: parentCategory || null,
      displayOrder: displayOrder || 0,
      active: true,
      featured: false
    });

    // Save to MongoDB
    const savedCategory = await newCategory.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        id: savedCategory._id,
        name: savedCategory.name,
        description: savedCategory.description,
        image: savedCategory.image,
        slug: savedCategory.slug,
        parentCategory: savedCategory.parentCategory,
        displayOrder: savedCategory.displayOrder,
        active: savedCategory.active,
        featured: savedCategory.featured
      }
    });

  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

// Update existing category
router.put('/categories/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const updateData = req.body;
    
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Update the category
    const currentCategory = categories[categoryIndex];
    const updatedCategory = {
      ...currentCategory,
      ...updateData,
      id: categoryId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    categories[categoryIndex] = updatedCategory;

    // Update catalog file
    await updateCarnationCatalogFile();

    res.json({
      success: true,
      message: 'Category updated successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    
    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if any products use this category
    const productsInCategory = carnationFlowers.filter(flower => 
      flower.categoryId === categoryId
    );
    
    if (productsInCategory.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productsInCategory.length} products are using this category.`
      });
    }

    const deletedCategory = categories.splice(categoryIndex, 1)[0];

    // Update catalog file
    await updateCarnationCatalogFile();

    res.json({
      success: true,
      message: 'Category deleted successfully',
      category: deletedCategory
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
});

// User Management Routes
const { User } = require('../models/postgres');
const { Order } = require('../models/postgres');
const { Op } = require('sequelize');

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const userType = req.query.userType;
    const search = req.query.search;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    if (userType) {
      whereClause.userType = userType;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { businessName: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      users: users,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Update user status (activate/deactivate)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ isActive });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: { ...user.toJSON(), password: undefined }
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// Get user details with order history
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's order history
    const orders = await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      user: user,
      orderHistory: orders
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
});

// Transaction/Order Management Routes

// Get all orders/transactions
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['firstName', 'lastName', 'email', 'businessName', 'userType']
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    // Calculate summary statistics
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      transactions: orders,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      summary: {
        totalRevenue,
        statusCounts
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Update order status
router.patch('/transactions/:id/status', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, notes } = req.body;
    
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.update({ 
      status,
      notes: notes || order.notes,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

// Helper function to update catalog file
async function updateCarnationCatalogFile() {
  try {
    const catalogPath = path.join(__dirname, '../data/carnationCatalog.js');
    const catalogContent = `// Auto-generated carnation catalog
const categories = ${JSON.stringify(categories, null, 2)};

const flowers = ${JSON.stringify(carnationFlowers, null, 2)};

module.exports = {
  categories,
  flowers
};
`;
    
    await fs.writeFile(catalogPath, catalogContent, 'utf8');
    console.log('✓ Carnation catalog updated');
  } catch (error) {
    console.error('Error updating catalog file:', error);
  }
}

// Get all transactions (Admin only)
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const { Order, Payment, User } = require('../models/postgres');
    
    // Get orders with user details
    const orders = await Order.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email', 'userType', 'businessName']
      }, {
        model: Payment,
        as: 'payments'
      }],
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: skip
    });
    
    const totalCount = await Order.count();
    
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
                color: flower.color
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
      transactions: processedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit
      }
    });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Update user status (Admin only)
router.put('/users/:id/status', async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;
    
    const { User } = require('../models/postgres');
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isActive = isActive;
    await user.save();
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive
      }
    });
    
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// Create new user (Admin only)
router.post('/users', async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType, businessName } = req.body;
    
    // Validation
    if (!email || !password || !firstName || !lastName || !userType || !businessName) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }
    
    const { User } = require('../models/postgres');
    const bcrypt = require('bcryptjs');
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      userType,
      businessName,
      isActive: true,
      emailVerified: true,
      registrationDate: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        userType: newUser.userType,
        businessName: newUser.businessName,
        isActive: newUser.isActive
      }
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

module.exports = router;