const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true
  },
  to: {
    type: [String], // Array of recipient email addresses
    required: true
  },
  subject: {
    type: String,
    default: ''
  },
  body: {
    type: String,
    default: ''
  },
  folder: {
    type: String,
    enum: ['inbox', 'sent', 'trash', 'starred'],
    default: 'inbox'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    storageUrl: {
      type: String,
      required: true
    }
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sizeBytes: {
    type: Number,
    required: true
  },
  receivedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
emailSchema.index({ userId: 1, folder: 1, receivedAt: -1 });
emailSchema.index({ userId: 1, isRead: 1 });
emailSchema.index({ userId: 1, isStarred: 1 });
emailSchema.index({ 'attachments.filename': 'text', subject: 'text', body: 'text' }); // For text search

// Virtual for attachment URLs (if we store relative paths and need to construct full URL)
// Not needed if storageUrl is absolute URL or path

module.exports = mongoose.model('Email', emailSchema);