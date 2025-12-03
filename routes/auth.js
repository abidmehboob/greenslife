const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { User } = require('../models/postgres');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const emailService = require('../services/emailService');

// Helper function to generate random password
function generateRandomPassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Generate random password
    const randomPassword = generateRandomPassword();
    
    // Create new user with generated password and inactive status
    const userData = {
      ...req.body,
      password: randomPassword,
      isActive: false,
      emailVerified: false
    };

    const user = await User.create(userData);
    
    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send welcome email with credentials and verification link
    const emailResult = await emailService.sendWelcomeEmail(user, randomPassword, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        userType: user.userType,
        isActive: user.isActive,
        emailVerified: user.emailVerified
      },
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with matching token and unexpired verification
    const user = await User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Activate the account
    await user.activateAccount();

    // Send activation confirmation email
    await emailService.sendAccountActivatedEmail(user);

    res.json({
      success: true,
      message: 'Email verified successfully! Your account is now active.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        userType: user.userType,
        isActive: user.isActive,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    const emailResult = await emailService.sendWelcomeEmail(user, '[Use your current password]', verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(user, resetToken);

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find user with matching token and unexpired reset token
    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log(`Login failed: User not found for ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    console.log(`User found: ${email}, isActive: ${user.isActive}, emailVerified: ${user.emailVerified}`);

    if (!user.isActive) {
      console.log(`Login failed: Account not active for ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Account is not active. Please verify your email.',
        needsVerification: !user.emailVerified
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    console.log(`Password validation for ${email}: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log(`Login failed: Invalid password for ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user.id);
    const { password: userPassword, ...userWithoutPassword } = user.toJSON();

    console.log(`Login successful for ${email}, userType: ${user.userType}`);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed', 
      error: error.message 
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user.toJSON();
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'businessName', 'businessAddress', 
      'phone', 'taxNumber'
    ];
    
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await req.user.update(updates);
    await req.user.reload();

    const { password, ...userWithoutPassword } = req.user.toJSON();

    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    await req.user.update({ password: newPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  const { password, ...userWithoutPassword } = req.user.toJSON();
  res.json({ 
    valid: true, 
    user: userWithoutPassword 
  });
});

module.exports = router;