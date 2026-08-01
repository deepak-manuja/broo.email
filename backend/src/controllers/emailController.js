const Email = require('../models/Email');
const User = require('../models/User');
const { updateStorageUsage, calculateEmailSize, getAttachmentStoragePath } = require('../utils/storage');
const { emitNewEmail } = require('../socket');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

// Get emails with filtering and pagination
exports.getEmails = async (req, res) => {
  try {
    const { folder, search, page = 1, limit = 20 } = req.query;
    const userId = req.user._id; // From auth middleware

    // Build query
    const query = { userId };
    if (folder && folder !== 'all') {
      query.folder = folder;
    }

    // Add text search if provided
    if (search) {
      query.$text = { $search: search };
    }

    // Get total count for pagination
    const total = await Email.countDocuments(query);

    // Get emails with pagination
    const emails = await Email.find(query)
      .sort({ receivedAt: -1 })
      .skip(parseInt((page - 1) * limit))
      .limit(parseInt(limit));

    res.json({
      emails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single email by ID
exports.getEmailById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const email = await Email.findOne({ _id: id, userId });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Mark as read if not already
    if (!email.isRead) {
      email.isRead = true;
      await email.save();
    }

    res.json(email);
  } catch (error) {
    console.error('Get email by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle star status
exports.toggleStar = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const email = await Email.findOne({ _id: id, userId });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    email.isStarred = !email.isStarred;
    await email.save();

    res.json(email);
  } catch (error) {
    console.error('Toggle star error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Move email to folder
exports.moveToFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { folder } = req.body;
    const userId = req.user._id;

    // Validate folder
    const validFolders = ['inbox', 'sent', 'trash', 'starred'];
    if (!validFolders.includes(folder)) {
      return res.status(400).json({ message: 'Invalid folder' });
    }

    const email = await Email.findOneAndUpdate(
      { _id: id, userId },
      { $set: { folder } },
      { new: true }
    );

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    res.json(email);
  } catch (error) {
    console.error('Move to folder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete email (move to trash or permanently delete)
exports.deleteEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.body; // If true, permanently delete
    const userId = req.user._id;

    const email = await Email.findOne({ _id: id, userId });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    if (permanent) {
      // Permanently delete email and its attachments
      // Delete attachment files
      for (const attachment of email.attachments) {
        const filePath = path.join(getAttachmentStoragePath(), userId.toString(), path.basename(attachment.storageUrl));
        try {
          await fs.promises.unlink(filePath);
        } catch (err) {
          // File might not exist, continue
          console.warn(`Could not delete attachment file: ${filePath}`);
        }
      }

      // Update storage usage
      await updateStorageUsage(userId, -email.sizeBytes);

      // Delete email document
      await Email.deleteOne({ _id: id, userId });
    } else {
      // Move to trash
      email.folder = 'trash';
      await email.save();
    }

    res.json({ message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Delete email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send email
exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Process attachments if any (handled by multer middleware)
    const attachments = req.files || [];

    // Calculate total email size
    const emailSize = await calculateEmailSize({ body, attachments });

    // Check storage limit for sender
    const canStore = await updateStorageUsage(userId, emailSize);
    if (!canStore) {
      return res.status(400).json({ message: 'Storage limit exceeded' });
    }

    // Save attachments to filesystem and prepare attachment records
    const attachmentRecords = [];
    for (const file of attachments) {
      // Create user directory if not exists
      const userDir = path.join(getAttachmentStoragePath(), userId.toString());
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      // Generate unique filename
      const attachmentId = new mongoose.Types.ObjectId();
      const fileName = `${attachmentId}-${file.originalname}`;
      const filePath = path.join(userDir, fileName);
      const relativePath = `/uploads/${userId}/${fileName}`;

      // Move file from temp to permanent location
      await fs.promises.rename(file.path, filePath);

      attachmentRecords.push({
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        storageUrl: relativePath
      });
    }

    // Create email document for sender's sent folder
    const email = new Email({
      from: user.email,
      to,
      subject: subject || '(no subject)',
      body: body || '',
      folder: 'sent',
      isRead: true, // Sent emails are marked as read
      isStarred: false,
      attachments: attachmentRecords,
      userId,
      sizeBytes: emailSize,
      receivedAt: new Date()
    });

    await email.save();

    // TODO: Actually send email via Resend API or SMTP
    // For now, we just save it to sent folder

    res.status(201).json(email);
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download attachment
exports.downloadAttachment = async (req, res) => {
  try {
    const { id } = req.params; // emailId
    const { attachmentId } = req.params; // We'll need to adjust route for this
    const userId = req.user._id;

    // Find the email
    const email = await Email.findOne({ _id: id, userId });
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Find the attachment
    const attachment = email.attachments.find(
      att => att._id.toString() === attachmentId
    );
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Construct file path
    const filePath = path.join(getAttachmentStoragePath(), userId.toString(), path.basename(attachment.storageUrl));

    // Check if file exists
    try {
      await fs.promises.access(filePath);
    } catch (err) {
      return res.status(404).json({ message: 'Attachment file not found' });
    }

    // Set headers and send file
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};