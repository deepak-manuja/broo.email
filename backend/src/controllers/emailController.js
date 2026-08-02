const Email = require('../models/Email');
const User = require('../models/User');
const { updateStorageUsage, calculateEmailSize, getAttachmentStoragePath, moveFileSafe } = require('../utils/storage');
const { emitNewEmail } = require('../socket');
const { sendOutboundEmail } = require('../services/resendService');
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
    const isPermanent = req.body?.permanent === true || req.body?.permanent === 'true' || req.query?.permanent === 'true' || req.query?.permanent === true;
    const userId = req.user._id;

    const email = await Email.findOne({ _id: id, userId });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    if (isPermanent) {
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
    const { to, cc, subject, body } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Helper to extract clean email address
    const extractEmailAddress = (str) => {
      if (!str || typeof str !== 'string') return '';
      const match = str.match(/<([^>]+)>/) || str.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      return match ? match[1].trim().toLowerCase() : str.trim().toLowerCase();
    };

    // Parse recipients
    const rawToList = Array.isArray(to)
      ? to
      : typeof to === 'string'
      ? to.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const toList = rawToList.map(extractEmailAddress).filter(Boolean);

    if (toList.length === 0) {
      return res.status(400).json({ message: 'At least one recipient is required' });
    }

    const rawCcList = cc
      ? Array.isArray(cc)
        ? cc
        : typeof cc === 'string'
        ? cc.split(',').map((s) => s.trim()).filter(Boolean)
        : []
      : [];

    const ccList = rawCcList.map(extractEmailAddress).filter(Boolean);

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
    const filesForOutbound = [];

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

      // Move file from temp to permanent location using safe cross-device move
      await moveFileSafe(file.path, filePath);

      attachmentRecords.push({
        _id: attachmentId,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        storageUrl: relativePath
      });

      filesForOutbound.push({
        filename: file.originalname,
        path: filePath
      });
    }

    // Determine sender address
    const fromAddress = user.email.includes('@') ? user.email : `${user.username || 'user'}@broo.email`;

    // Attempt outbound delivery via Resend API
    const outboundResult = await sendOutboundEmail({
      from: fromAddress,
      to: toList,
      cc: ccList.length > 0 ? ccList : undefined,
      subject: subject || '(no subject)',
      text: body || '',
      attachments: filesForOutbound
    });

    // Create email document for sender's sent folder
    const email = new Email({
      from: fromAddress,
      to: toList,
      subject: subject || '(no subject)',
      body: body || '',
      textBody: body || '',
      htmlBody: body ? `<div style="font-family:sans-serif;line-height:1.6;">${body.replace(/\n/g, '<br/>')}</div>` : '',
      folder: 'sent',
      isRead: true, // Sent emails are marked as read
      isStarred: false,
      attachments: attachmentRecords,
      userId,
      sizeBytes: emailSize,
      receivedAt: new Date()
    });

    await email.save();

    res.status(201).json({
      ...email.toObject(),
      outboundDelivery: outboundResult
    });
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