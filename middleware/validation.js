const Joi = require('joi');

const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    // Personal details
    firstName: Joi.string().min(2).max(50).required()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'any.required': 'First name is required'
      }),
    lastName: Joi.string().min(2).max(50).required()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'any.required': 'Last name is required'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    // Account details
    userType: Joi.string().valid('wholesaler', 'florist').required()
      .messages({
        'any.only': 'User type must be either wholesaler or florist',
        'any.required': 'User type is required'
      }),
    
    // Business details
    businessName: Joi.string().min(2).max(100).required()
      .messages({
        'string.min': 'Business name must be at least 2 characters long',
        'any.required': 'Business name is required'
      }),
    
    // Polish company identifiers
    nip: Joi.string().pattern(/^[0-9]{10}$/).required()
      .messages({
        'string.pattern.base': 'NIP must be exactly 10 digits',
        'any.required': 'NIP (Tax Identification Number) is required'
      }),
    regon: Joi.string().pattern(/^[0-9]{9}([0-9]{5})?$/).allow('')
      .messages({
        'string.pattern.base': 'REGON must be 9 or 14 digits'
      }),
    krs: Joi.string().pattern(/^[0-9]{10}$/).allow('')
      .messages({
        'string.pattern.base': 'KRS must be exactly 10 digits'
      }),
    
    // Company type and VAT
    companyType: Joi.string().valid(
      'sp_z_oo', 'sa', 'jednoosobowa', 'spolka_cywilna', 
      'spolka_jawna', 'spolka_komandytowa', 'spolka_partnerska', 'other'
    ).required()
      .messages({
        'any.only': 'Please select a valid company type',
        'any.required': 'Company type is required'
      }),
    vatExempt: Joi.boolean().default(false),
    
    // Address details
    street: Joi.string().min(2).max(100).required()
      .messages({
        'string.min': 'Street address must be at least 2 characters long',
        'any.required': 'Street address is required'
      }),
    houseNumber: Joi.string().min(1).max(20).required()
      .messages({
        'any.required': 'House number is required'
      }),
    apartmentNumber: Joi.string().max(20).allow(''),
    city: Joi.string().min(2).max(50).required()
      .messages({
        'string.min': 'City name must be at least 2 characters long',
        'any.required': 'City is required'
      }),
    postalCode: Joi.string().pattern(/^[0-9]{2}-[0-9]{3}$/).required()
      .messages({
        'string.pattern.base': 'Postal code must be in format XX-XXX (e.g., 00-001)',
        'any.required': 'Postal code is required'
      }),
    voivodeship: Joi.string().valid(
      'dolnoslaskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
      'lodzkie', 'malopolskie', 'mazowieckie', 'opolskie', 'podkarpackie',
      'podlaskie', 'pomorskie', 'slaskie', 'swietokrzyskie', 'warminsko-mazurskie',
      'wielkopolskie', 'zachodniopomorskie'
    ).required()
      .messages({
        'any.only': 'Please select a valid voivodeship',
        'any.required': 'Voivodeship is required'
      }),
    
    // Contact details
    phone: Joi.string().pattern(/^(\+48\s?)?[0-9]{9}$/).required()
      .messages({
        'string.pattern.base': 'Phone number must be a valid Polish number (9 digits, optionally with +48)',
        'any.required': 'Phone number is required'
      }),
    
    // Contact person (optional for companies)
    contactPersonName: Joi.string().min(2).max(100).allow(''),
    contactPersonPosition: Joi.string().max(50).allow(''),
    contactPersonPhone: Joi.string().pattern(/^(\+48\s?)?[0-9]{9}$/).allow('')
      .messages({
        'string.pattern.base': 'Contact person phone must be a valid Polish number'
      }),
    contactPersonEmail: Joi.string().email().allow('')
      .messages({
        'string.email': 'Contact person email must be a valid email address'
      }),
    
    // Legacy fields (for backward compatibility)
    taxNumber: Joi.string().allow(''),
    businessAddress: Joi.object().allow('')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error', 
      details: error.details[0].message,
      field: error.details[0].path[0]
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