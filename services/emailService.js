const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // For development, use Ethereal (test) email service
      if (process.env.NODE_ENV !== 'production') {
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } else {
        // For production, use environment variables for SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      }

      // Verify SMTP connection
      await this.transporter.verify();
      this.initialized = true;
      console.log('✓ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      // Don't throw error - allow app to continue without email
    }
  }

  async loadTemplate(templateName, variables) {
    try {
      const templatePath = path.join(__dirname, '..', 'templates', 'email', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);
      return template(variables);
    } catch (error) {
      console.error(`Failed to load email template ${templateName}:`, error.message);
      return this.getDefaultTemplate(templateName, variables);
    }
  }

  getDefaultTemplate(templateName, variables) {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    
    switch (templateName) {
      case 'welcome-verification':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4CAF50; text-align: center;">Welcome to Greens Life! 🌱</h1>
            <h2>Account Verification Required</h2>
            <p>Dear ${variables.firstName} ${variables.lastName},</p>
            <p>Thank you for registering as a ${variables.userType} with Greens Life. To activate your account, please click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/verify-email?token=${variables.token}" 
                 style="background-color: #4CAF50; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Activate Account
              </a>
            </div>
            <p><strong>Your login credentials:</strong></p>
            <ul>
              <li>Email: ${variables.email}</li>
              <li>Temporary Password: ${variables.password}</li>
            </ul>
            <p style="color: #ff9800;"><strong>Important:</strong> Please change your password after first login.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>This verification link expires in 24 hours.</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              Greens Life - Premium Flower Distribution<br>
              If you can't click the button, copy and paste this link: ${baseUrl}/verify-email?token=${variables.token}
            </p>
          </div>
        `;
      
      case 'password-reset':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4CAF50; text-align: center;">Password Reset Request</h1>
            <p>Dear ${variables.firstName} ${variables.lastName},</p>
            <p>You requested a password reset for your Greens Life account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/reset-password?token=${variables.token}" 
                 style="background-color: #ff9800; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>If you didn't request this, please ignore this email. Your password won't be changed.</p>
            <p>This reset link expires in 1 hour.</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              Greens Life - Premium Flower Distribution<br>
              If you can't click the button, copy and paste this link: ${baseUrl}/reset-password?token=${variables.token}
            </p>
          </div>
        `;
      
      default:
        return '<p>Email template not found</p>';
    }
  }

  async sendWelcomeEmail(user, password, token) {
    if (!this.initialized) {
      console.log('Email service not initialized, skipping welcome email');
      return { success: false, message: 'Email service not available' };
    }

    try {
      const html = await this.loadTemplate('welcome-verification', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        password: password,
        token: token,
        businessName: user.businessName
      });

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@greenslife.com',
        to: user.email,
        subject: 'Welcome to Greens Life - Account Verification Required',
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Failed to send welcome email:', error.message);
      return { success: false, message: error.message };
    }
  }

  async sendPasswordResetEmail(user, token) {
    if (!this.initialized) {
      console.log('Email service not initialized, skipping password reset email');
      return { success: false, message: 'Email service not available' };
    }

    try {
      const html = await this.loadTemplate('password-reset', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token: token
      });

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@greenslife.com',
        to: user.email,
        subject: 'Password Reset Request - Greens Life',
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Failed to send password reset email:', error.message);
      return { success: false, message: error.message };
    }
  }

  async sendAccountActivatedEmail(user) {
    if (!this.initialized) {
      console.log('Email service not initialized, skipping activation email');
      return { success: false, message: 'Email service not available' };
    }

    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4CAF50; text-align: center;">Account Activated! 🎉</h1>
          <p>Dear ${user.firstName} ${user.lastName},</p>
          <p>Your Greens Life account has been successfully activated!</p>
          <p>You can now log in and start exploring our premium flower catalog.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" 
               style="background-color: #4CAF50; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          <p>Welcome to the Greens Life family!</p>
        </div>
      `;

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@greenslife.com',
        to: user.email,
        subject: 'Account Activated - Welcome to Greens Life',
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Failed to send activation email:', error.message);
      return { success: false, message: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();