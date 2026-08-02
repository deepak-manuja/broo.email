const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Email = require('../models/Email');
const User = require('../models/User');
const { updateStorageUsage, getAttachmentStoragePath, moveFileSafeSync } = require('../utils/storage');
require('dotenv').config();

// Upload attachments for an email
exports.uploadAttachments = async (req, res) => {
  try {
    const { emailId } = req.body;
    const userId = req.user._id;

    // Verify email belongs to user
    const email = await Email.findOne({ _id: emailId, userId });
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = [];
    const createdFilePaths = [];
    let totalSize = 0;

    // Process each uploaded file
    for (const file of req.files) {
      // Generate unique filename
      const fileId = new mongoose.Types.ObjectId();
      const fileExt = path.extname(file.originalname);
      const fileName = `${fileId}${fileExt}`;

      // Create user directory if it doesn't exist
      const userDir = path.join(getAttachmentStoragePath(), userId.toString());
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      // File path
      const filePath = path.join(userDir, fileName);
      createdFilePaths.push(filePath);

      // Move file from temp location to permanent storage using EXDEV-safe move
      moveFileSafeSync(file.path, filePath);

      // Calculate file size
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      totalSize += fileSize;

      // Create attachment object
      const attachment = {
        filename: file.originalname,
        size: fileSize,
        mimeType: file.mimetype,
        storageUrl: `/uploads/${userId}/${fileName}` // URL to access the file
      };

      uploadedFiles.push(attachment);
    }

    // Check if user has enough storage
    const canStore = await updateStorageUsage(userId, totalSize);
    if (!canStore) {
      // Delete uploaded files as we can't store them
      for (const filePath of createdFilePaths) {
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
          console.warn(`Could not clean up file ${filePath}: ${e.message}`);
        }
      }
      return res.status(400).json({ message: 'Storage limit exceeded' });
    }

    // Add attachments to email
    email.attachments.push(...uploadedFiles);
    email.sizeBytes += totalSize;
    await email.save();

    res.json({
      message: 'Attachments uploaded successfully',
      attachments: uploadedFiles
    });
  } catch (error) {
    console.error('Upload attachments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an attachment
exports.deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params; // This is actually the index in the attachments array
    const userId = req.user._id;

    // Find the email that contains this attachment
    const email = await Email.findOne({
      'attachments._id': attachmentId,
      userId
    });

    if (!email) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Find the attachment
    const attachmentIndex = email.attachments.findIndex(
      att => att._id.toString() === attachmentId
    );

    if (attachmentIndex === -1) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const attachment = email.attachments[attachmentIndex];

    // Delete file from filesystem
    try {
      const filePath = path.join(
        getAttachmentStoragePath(),
        userId.toString(),
        path.basename(attachment.storageUrl)
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn(`Could not delete attachment file: ${err.message}`);
      // Continue anyway - we'll still remove the attachment from DB
    }

    // Remove attachment from email
    email.attachments.splice(attachmentIndex, 1);
    email.sizeBytes -= attachment.size;
    await email.save();

    // Update storage usage
    await updateStorageUsage(userId, -attachment.size); // Negative to subtract

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download an attachment
exports.downloadAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user._id;

    // Find the email that contains this attachment
    const email = await Email.findOne({
      'attachments._id': attachmentId,
      userId
    });

    if (!email) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Find the attachment
    const attachment = email.attachments.find(
      att => att._id.toString() === attachmentId
    );

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Construct file path
    const filePath = path.join(
      getAttachmentStoragePath(),
      userId.toString(),
      path.basename(attachment.storageUrl)
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    res.setHeader('Content-Length', attachment.size);

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};