const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userType: {
    type: DataTypes.ENUM('wholesaler', 'florist', 'admin'),
    allowNull: false
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  businessAddress: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  taxNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Polish company details
  nip: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9]{10}$/  // NIP format: 10 digits
    }
  },
  regon: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9]{9}([0-9]{5})?$/  // REGON format: 9 or 14 digits
    }
  },
  krs: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9]{10}$/  // KRS format: 10 digits
    }
  },
  companyType: {
    type: DataTypes.ENUM('sp_z_oo', 'sa', 'jednoosobowa', 'spolka_cywilna', 'spolka_jawna', 'spolka_komandytowa', 'spolka_partnerska', 'other'),
    allowNull: true
  },
  vatExempt: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Address details
  street: {
    type: DataTypes.STRING,
    allowNull: true
  },
  houseNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  apartmentNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9]{2}-[0-9]{3}$/  // Polish postal code format: XX-XXX
    }
  },
  voivodeship: {
    type: DataTypes.ENUM(
      'dolnoslaskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
      'lodzkie', 'malopolskie', 'mazowieckie', 'opolskie', 'podkarpackie',
      'podlaskie', 'pomorskie', 'slaskie', 'swietokrzyskie', 'warminsko-mazurskie',
      'wielkopolskie', 'zachodniopomorskie'
    ),
    allowNull: true
  },
  // Contact person (for companies)
  contactPersonName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPersonPosition: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPersonPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPersonEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  // Account status and verification
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false  // Changed to false - accounts start inactive
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  registrationDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  activationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

User.prototype.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = token;
  this.passwordResetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
  
  return token;
};

User.prototype.activateAccount = async function() {
  this.isActive = true;
  this.emailVerified = true;
  this.activationDate = new Date();
  this.emailVerificationToken = null;
  this.emailVerificationExpires = null;
  await this.save();
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.emailVerificationToken;
  delete values.passwordResetToken;
  return values;
};

module.exports = User;