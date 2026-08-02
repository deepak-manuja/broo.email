const User = require('../models/User');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Calculate email size (body + attachments)
exports.calculateEmailSize = async ({ body, attachments = [] }) => {
  let size = 0;

  // Add body size
  if (body) {
    size += Buffer.byteLength(body, 'utf8');
  }

  // Add attachment sizes
  for (const attachment of attachments) {
    if (attachment.size) {
      size += attachment.size;
    } else if (attachment.content) {
      size += attachment.content.length;
    }
  }

  return size;
};

// Update user's storage usage and check if within limits
exports.updateStorageUsage = async (userId, sizeChange) => {
  // Use atomic update
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { storageUsedBytes: sizeChange } },
    { new: true }
  );

  if (!user) {
    throw new Error('User not found');
  }

  // Check if user is still within storage limits
  const isWithinLimit = user.storageUsedBytes <= user.storageLimit;
  if (!isWithinLimit && sizeChange > 0) {
    // Rollback storage increment if limit was exceeded
    await User.findByIdAndUpdate(userId, { $inc: { storageUsedBytes: -sizeChange } });
  }

  return isWithinLimit;
};

// Get user's storage usage
exports.getStorageUsage = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  return {
    usedBytes: user.storageUsedBytes,
    limitBytes: user.storageLimit,
    percentage: (user.storageUsedBytes / user.storageLimit) * 100
  };
};

// Helper function to generate a username from email
exports.generateUsernameFromEmail = (email) => {
  // Extract username part (before @)
  let username = email.split('@')[0];

  // Remove special characters
  username = username.replace(/[^a-zA-Z0-9]/g, '');

  // Limit length
  if (username.length > 20) {
    username = username.substring(0, 20);
  }

  // Ensure it's not empty
  if (!username) {
    username = 'user';
  }

  return username;
};

// Helper function to resolve attachment storage path with fallback
exports.getAttachmentStoragePath = () => {
  const configuredPath = process.env.ATTACHMENT_STORAGE_PATH || path.join(__dirname, '../../uploads');
  try {
    if (!fs.existsSync(configuredPath)) {
      fs.mkdirSync(configuredPath, { recursive: true });
    }
    return configuredPath;
  } catch (err) {
    const fallbackPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(fallbackPath)) {
      fs.mkdirSync(fallbackPath, { recursive: true });
    }
    return fallbackPath;
  }
};

// Helper function to ensure directory exists
exports.ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Helper function to delete file safely
exports.safeUnlink = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (err) {
    console.warn(`Failed to delete file ${filePath}:`, err.message);
  }
  return false;
};

// Cross-device safe async file move (handles EXDEV error between tmpfs and disk volumes)
exports.moveFileSafe = async (sourcePath, destPath) => {
  try {
    await fs.promises.rename(sourcePath, destPath);
  } catch (err) {
    if (err.code === 'EXDEV') {
      await fs.promises.copyFile(sourcePath, destPath);
      await fs.promises.unlink(sourcePath);
    } else {
      throw err;
    }
  }
};

// Cross-device safe sync file move
exports.moveFileSafeSync = (sourcePath, destPath) => {
  try {
    fs.renameSync(sourcePath, destPath);
  } catch (err) {
    if (err.code === 'EXDEV') {
      fs.copyFileSync(sourcePath, destPath);
      fs.unlinkSync(sourcePath);
    } else {
      throw err;
    }
  }
};

// Helper function to get file size
exports.getFileSize = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return stats.size;
    }
  } catch (err) {
    console.warn(`Failed to get file size for ${filePath}:`, err.message);
  }
  return 0;
};