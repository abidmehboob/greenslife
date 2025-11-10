const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');

// Create payment intent for Stripe
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Find the order
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ message: 'Order payment already processed' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Convert to cents
      currency: 'pln', // Polish Złoty
      metadata: {
        orderId: order._id.toString(),
        customerId: req.user._id.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// Confirm payment
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        message: 'Payment not successful',
        status: paymentIntent.status 
      });
    }

    // Update order payment status
    const order = await Order.findOneAndUpdate(
      { 
        _id: orderId,
        customer: req.user._id 
      },
      {
        paymentStatus: 'paid',
        status: 'confirmed',
        'paymentDetails.transactionId': paymentIntentId,
        'paymentDetails.paymentProvider': 'stripe',
        'paymentDetails.paidAt': new Date()
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Payment confirmed successfully',
      order
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// PayU integration for Polish market
router.post('/payu/create-order', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Find the order
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id
    }).populate('customer');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ message: 'Order payment already processed' });
    }

    // PayU order data
    const payuOrderData = {
      notifyUrl: `${req.protocol}://${req.get('host')}/api/payments/payu/notify`,
      customerIp: req.ip,
      merchantPosId: process.env.PAYU_CLIENT_ID,
      description: `Flower order ${order.orderNumber}`,
      currencyCode: 'PLN',
      totalAmount: Math.round(order.totalAmount * 100), // PayU expects amount in grosze
      buyer: {
        email: order.customer.email,
        phone: order.customer.phone || order.shippingAddress.phone,
        firstName: order.customer.firstName,
        lastName: order.customer.lastName
      },
      products: [{
        name: `Flower order ${order.orderNumber}`,
        unitPrice: Math.round(order.totalAmount * 100),
        quantity: 1
      }]
    };

    // This is a simplified example - in production, you'd make actual API calls to PayU
    // For now, we'll simulate the response
    const payuResponse = {
      status: {
        statusCode: 'SUCCESS'
      },
      redirectUri: `https://secure.payu.com/pay/?token=example_token_${order._id}`,
      orderId: `PAYU_${Date.now()}`
    };

    res.json({
      redirectUri: payuResponse.redirectUri,
      payuOrderId: payuResponse.orderId
    });
  } catch (error) {
    console.error('PayU order creation error:', error);
    res.status(500).json({ message: 'Failed to create PayU order' });
  }
});

// PayU notification webhook
router.post('/payu/notify', async (req, res) => {
  try {
    // This would handle PayU payment notifications
    // In production, you'd verify the notification signature
    const { order } = req.body;
    
    if (order && order.status === 'COMPLETED') {
      // Find and update the order
      const dbOrder = await Order.findOne({
        'paymentDetails.transactionId': order.orderId
      });

      if (dbOrder) {
        dbOrder.paymentStatus = 'paid';
        dbOrder.status = 'confirmed';
        dbOrder.paymentDetails.paidAt = new Date();
        await dbOrder.save();
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('PayU notification error:', error);
    res.status(500).send('Error');
  }
});

// Get payment methods available
router.get('/methods', authenticateToken, (req, res) => {
  const methods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay with Visa, Mastercard, or other cards',
      provider: 'stripe',
      available: true
    },
    {
      id: 'payu',
      name: 'PayU',
      description: 'Popular payment method in Poland',
      provider: 'payu',
      available: true
    },
    {
      id: 'transfer',
      name: 'Bank Transfer',
      description: 'Direct bank transfer',
      provider: 'manual',
      available: true
    }
  ];

  res.json(methods);
});

// Get payment history for user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const payments = await Order.find({
      customer: req.user._id,
      paymentStatus: { $in: ['paid', 'failed', 'refunded'] }
    })
    .select('orderNumber totalAmount paymentStatus paymentMethod paymentDetails createdAt')
    .sort({ 'paymentDetails.paidAt': -1 });

    res.json(payments);
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

module.exports = router;