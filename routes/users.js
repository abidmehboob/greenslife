const express = require('express');
const router = express.Router();
const { User } = require('../models/postgres');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { userType, page = 1, limit = 20, search } = req.query;
    
    const where = {};
    if (userType) where.userType = userType;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { businessName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

// Update user status (admin only)
router.patch('/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { isActive, isVerified } = req.body;
    
    const updateData = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;

    await User.update(updateData, { where: { id: req.params.id } });
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    console.error('User status update error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [updated] = await User.update({ isActive: false }, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const verifiedUsers = await User.count({ where: { isVerified: true } });

    const byUserType = await User.findAll({
      attributes: ['userType', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['userType']
    });

    res.json({ totalUsers, activeUsers, verifiedUsers, byUserType });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
});

module.exports = router;