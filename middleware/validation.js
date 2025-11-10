const Joi = require('joi');

const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    userType: Joi.string().valid('wholesaler', 'florist').required(),
    businessName: Joi.string().min(2).max(100).required(),
    businessAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().default('Poland')
    }).required(),
    phone: Joi.string().required(),
    taxNumber: Joi.string().allow('')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation error', 
      details: error.details[0].message 
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation error', 
      details: error.details[0].message 
    });
  }
  next();
};

const validateOrder = (req, res, next) => {
  const schema = Joi.object({
    items: Joi.array().items(
      Joi.object({
        flower: Joi.string().required(),
        quantity: Joi.number().min(1).required()
      })
    ).min(1).required(),
    paymentMethod: Joi.string().valid('card', 'transfer', 'cash', 'payu').required(),
    shippingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().default('Poland'),
      phone: Joi.string().allow('')
    }).required(),
    deliveryDate: Joi.date().min('now').required(),
    notes: Joi.string().allow('')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation error', 
      details: error.details[0].message 
    });
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateOrder
};