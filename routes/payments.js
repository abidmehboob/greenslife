const express = require('express');
const router = express.Router();
const stripeLib = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const { Order, Payment, User } = require('../models/postgres');
const { authenticateToken } = require('../middleware/auth');

// Helper: stubbed payment intent
const createStubPaymentIntent = async (amount) => {
  return {
    id: `pi_stub_${Date.now()}`,
    client_secret: `cs_stub_${Date.now()}`,
    amount
  };
};

// Create payment intent for Stripe (or stub)
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (order.paymentStatus !== 'pending') return res.status(400).json({ message: 'Order payment already processed' });

    const amountCents = Math.round(parseFloat(order.total) * 100);

    let paymentIntent;
    if (stripeLib) {
      paymentIntent = await stripeLib.paymentIntents.create({
        amount: amountCents,
        currency: 'pln',
        metadata: { orderId: orderId, userId: req.user.id },
        automatic_payment_methods: { enabled: true }
      });
    } else {
      paymentIntent = await createStubPaymentIntent(amountCents);
    }

    // Update Payment record with provider transaction id if exists
    const payment = await Payment.findOne({ where: { orderId: order.id } });
    if (payment) {
      await payment.update({ transactionId: paymentIntent.id, providerResponse: { client_secret: paymentIntent.client_secret || null } });
    }

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// Confirm payment (Stripe or stub)
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    let status = 'succeeded';
    if (stripeLib) {
      const pi = await stripeLib.paymentIntents.retrieve(paymentIntentId);
      status = pi.status;
    }

    if (status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful', status });
    }

    // Mark payment and order as paid
    const payment = await Payment.findOne({ where: { orderId: order.id } });
    if (payment) {
      await payment.update({ status: 'completed', transactionId: paymentIntentId, providerTransactionId: paymentIntentId });
    }

    await order.update({ paymentStatus: 'paid', status: 'confirmed' });

    res.json({ message: 'Payment confirmed successfully', order });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// PayU create-order (simulated) - creates provider info and returns redirect URI
router.post('/payu/create-order', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findByPk(orderId, { include: [] });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (order.paymentStatus !== 'pending') return res.status(400).json({ message: 'Order payment already processed' });

    // Simulate PayU response
    const payuOrderId = `PAYU_${Date.now()}`;
    const redirectUri = `https://secure.payu.com/pay/?token=simulated_${payuOrderId}`;

    // Update Payment with providerTransactionId
    const payment = await Payment.findOne({ where: { orderId: order.id } });
    if (payment) {
      await payment.update({ providerTransactionId: payuOrderId, providerResponse: { redirectUri }, method: 'payu' });
    }

    res.json({ redirectUri, payuOrderId });
  } catch (error) {
    console.error('PayU order creation error:', error);
    res.status(500).json({ message: 'Failed to create PayU order' });
  }
});

// PayU notification webhook (simulated) - accepts provider payload and updates payment
router.post('/payu/notify', async (req, res) => {
  try {
    const { orderId, status } = req.body; // simulated
    if (!orderId) return res.status(400).send('Missing orderId');

    const payment = await Payment.findOne({ where: { providerTransactionId: orderId } });
    if (!payment) return res.status(404).send('Payment not found');

    if (status === 'COMPLETED') {
      await payment.update({ status: 'completed' });
      const order = await Order.findByPk(payment.orderId);
      if (order) await order.update({ paymentStatus: 'paid', status: 'confirmed' });
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
    { id: 'card', name: 'Credit/Debit Card', description: 'Pay with Visa, Mastercard, or other cards', provider: 'stripe', available: true },
    { id: 'payu', name: 'PayU', description: 'Popular payment method in Poland', provider: 'payu', available: true },
    { id: 'transfer', name: 'Bank Transfer', description: 'Direct bank transfer', provider: 'manual', available: true }
  ];

  res.json(methods);
});

// Get payment history for user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json(payments);
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

module.exports = router;