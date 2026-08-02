const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username } = req.body;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Update user
    const updateData = {};
    if (username) updateData.username = username;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get storage usage
exports.getStorageUsage = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const used = Number(user.storageUsedBytes || 0);
    const limit = Number(user.storageLimit || 104857600);
    const percentUsed = limit > 0 ? (used / limit) * 100 : 0;

    res.json({
      used,
      limit,
      usedBytes: used,
      limitBytes: limit,
      percentUsed: parseFloat(percentUsed.toFixed(2))
    });
  } catch (error) {
    console.error('Get storage usage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update storage limit (for admin/premium features)
exports.updateStorageLimit = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limitBytes } = req.body;

    // Validate limit
    if (!limitBytes || limitBytes < 1048576) { // Minimum 1MB
      return res.status(400).json({ message: 'Storage limit must be at least 1MB' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { storageLimit: limitBytes } },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update storage limit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};