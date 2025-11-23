const express = require('express');
const router = express.Router();
const { Order, Payment, User } = require('../models/postgres');
const { Flower } = require('../models/mongo');
const { sequelize } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Create new order
router.post('/', authenticateToken, async (req, res) => {
   try {
    const { items, shippingAddress, deliveryDate, notes, paymentMethod = 'card' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' });
    }

    // Validate items and calculate totals using Mongo flower pricing
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const flower = await Flower.findById(item.flowerId).lean();
      if (!flower || !flower.isActive || !flower.availability?.inStock) {
        return res.status(400).json({ message: `Flower ${item.flowerId} is not available` });
      }

      // Determine unit price based on user type
      let unitPrice = 0;
      if (req.user.userType === 'wholesaler') {
        unitPrice = flower.pricing?.wholesaler?.pricePerBox ? (flower.pricing.wholesaler.pricePerBox / (flower.pricing.wholesaler.boxSize || 1)) : (flower.pricing?.florist?.pricePerStem || 0);
      } else {
        unitPrice = flower.pricing?.florist?.pricePerStem || (flower.pricing?.wholesaler?.pricePerBox ? (flower.pricing.wholesaler.pricePerBox / (flower.pricing.wholesaler.boxSize || 1)) : 0);
      }

      const qty = parseInt(item.quantity, 10) || 0;
      if (qty <= 0) return res.status(400).json({ message: 'Invalid quantity' });

      const itemTotal = parseFloat((unitPrice * qty).toFixed(2));
      subtotal = parseFloat((subtotal + itemTotal).toFixed(2));

      validatedItems.push({
        flowerId: item.flowerId,
        flowerName: flower.name,
        quantity: qty,
        unitPrice,
        totalPrice: itemTotal
      });
    }

    // Shipping and tax logic
    const shippingCost = subtotal > 200 ? 0 : 25; // Free shipping over 200 PLN
    const tax = parseFloat((subtotal * 0.23).toFixed(2)); // 23% VAT
    const total = parseFloat((subtotal + shippingCost + tax).toFixed(2));

    // Create transactional order in SQLite
    const newOrder = await Order.create({
      userId: req.user.id,
      orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      items: validatedItems,
      subtotal,
      shippingCost,
      tax,
      total,
      shippingAddress,
      deliveryDate,
      notes,
      paymentMethod
    });

    // Create a Payment placeholder record
    await Payment.create({
      orderId: newOrder.id,
      userId: req.user.id,
      amount: total,
      method: paymentMethod,
      status: 'pending',
      transactionId: null
    });

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
   } catch (error) {
     console.error('Error creating order:', error);
     res.status(500).json({ message: 'Failed to create order' });
   }
 });

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
   try {
     const { page = 1, limit = 10, status } = req.query;

     const whereClause = { userId: req.user.id };
     if (status) {
       whereClause.status = status;
     }

     const skip = (page - 1) * limit;

     const orders = await Order.findAndCountAll({
       where: whereClause,
       include: [{ model: Payment, as: 'payments' }],
       order: [['createdAt', 'DESC']],
       offset: skip,
       limit: parseInt(limit)
     });

     res.json({
       orders: orders.rows,
       pagination: {
         current: parseInt(page),
         pages: Math.ceil(orders.count / limit),
         total: orders.count,
         limit: parseInt(limit)
       }
     });
   } catch (error) {
     console.error('Error fetching orders:', error);
     res.status(500).json({ message: 'Failed to fetch orders' });
   }
 });

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
   try {
     const order = await Order.findOne({
       where: { id: req.params.id, userId: req.user.id },
       include: [{ model: Payment, as: 'payments' }]
     });

     if (!order) {
       return res.status(404).json({ message: 'Order not found' });
     }

     res.json(order);
   } catch (error) {
     console.error('Error fetching order:', error);
     res.status(500).json({ message: 'Failed to fetch order' });
   }
 });

// Update order status (admin or specific statuses for users)
router.patch('/:id/status', authenticateToken, async (req, res) => {
   try {
     const { status } = req.body;
     const validUserStatuses = ['cancelled']; // Users can only cancel orders

     const order = await Order.findOne({ where: { id: req.params.id, userId: req.user.id } });

     if (!order) {
       return res.status(404).json({ message: 'Order not found' });
     }

     // Check if user can update to this status
     if (!validUserStatuses.includes(status)) {
       return res.status(403).json({
         message: 'You can only cancel orders'
       });
     }

     // Check if order can be cancelled
     if (['shipped', 'delivered'].includes(order.status)) {
       return res.status(400).json({
         message: 'Cannot cancel shipped or delivered orders'
       });
     }

     await order.update({ status });

     res.json({
       message: 'Order status updated successfully',
       order
     });
   } catch (error) {
     console.error('Error updating order status:', error);
     res.status(500).json({ message: 'Failed to update order status' });
   }
 });

// Get order statuses for filters
router.get('/meta/statuses', authenticateToken, async (req, res) => {
   try {
     const statuses = [
       'pending',
       'confirmed',
       'processing',
       'shipped',
       'delivered',
       'cancelled'
     ];

     res.json(statuses);
   } catch (error) {
     console.error('Error fetching order statuses:', error);
     res.status(500).json({ message: 'Failed to fetch order statuses' });
   }
 });

 module.exports = router;
