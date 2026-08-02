const Email = require('../models/Email');
const User = require('../models/User');

/**
 * Send an automated welcome email from Deepak (deepak@broo.email) to a newly registered user.
 * @param {Object} user - The mongoose user document or user data object with _id, email, firstName, name, username
 */
async function sendWelcomeEmail(user) {
  try {
    if (!user || !user._id || !user.email) return;

    const recipientName = user.firstName || user.name || user.username || 'there';
    const recipientEmail = user.email;

    const subject = 'Welcome to broo.email 👋';

    const textBody = `Hey ${recipientName},

Thanks for claiming your ${recipientEmail} address.

I built Broo because I wanted a fast, focused email client that respects your privacy and doesn't clutter your workflow with corporate bloat or trackers.

Here are a few quick things to get you started:
• Real SMTP: Anyone on Gmail, Outlook, Apple Mail etc. can send emails directly to ${recipientEmail}.
• Instant Delivery: Incoming messages land in your inbox in sub-50ms via real-time WebSockets.
• Shortcuts: Press 'C' anywhere to compose a new message, 'Ctrl + Enter' to send, 'Esc' to dismiss.
• Storage & Attachments: 100MB free storage and up to 25MB attachments per message.

If you encounter any bugs, have feature requests, or just want to chat, simply reply to this email — it comes directly to my personal inbox.

Cheers,
Deepak
Creator, broo.email`;

    const htmlBody = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 24px; background: #ffffff; border-radius: 8px;">
  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Welcome to broo.email 👋</h2>
  <p style="margin-bottom: 12px; font-size: 14px;">Hey <strong>${recipientName}</strong>,</p>
  <p style="margin-bottom: 12px; font-size: 14px;">Thanks for claiming your <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #0f172a;">${recipientEmail}</code> address.</p>
  <p style="margin-bottom: 16px; font-size: 14px;">I built Broo because I wanted a fast, focused email client that respects your privacy and doesn't clutter your workflow with corporate bloat or trackers.</p>
  
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; font-family: monospace;">Quick Highlights</h4>
    <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.6;">
      <li style="margin-bottom: 6px;"><strong>Real SMTP</strong>: Anyone on Gmail, Outlook, Apple Mail etc. can email you at <code>${recipientEmail}</code>.</li>
      <li style="margin-bottom: 6px;"><strong>Instant Delivery</strong>: Messages land in your inbox in sub-50ms via real-time WebSockets.</li>
      <li style="margin-bottom: 6px;"><strong>Keyboard Shortcuts</strong>: Press <code style="background: #e2e8f0; padding: 1px 5px; border-radius: 3px; font-size: 12px;">C</code> to compose, <code style="background: #e2e8f0; padding: 1px 5px; border-radius: 3px; font-size: 12px;">Ctrl + Enter</code> to send.</li>
      <li style="margin-bottom: 0;"><strong>Storage</strong>: 100MB free storage with up to 25MB attachments per email.</li>
    </ul>
  </div>

  <p style="margin-bottom: 16px; font-size: 14px;">If you encounter any bugs, have feature requests, or just want to chat — <strong>simply reply directly to this email</strong>. It lands straight in my inbox.</p>
  
  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f172a;">Deepak</p>
    <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; font-family: monospace;">Creator, broo.email</p>
  </div>
</div>`;

    const sizeBytes = Buffer.byteLength(htmlBody || textBody, 'utf8');

    const welcomeEmail = new Email({
      from: 'Deepak <deepak@broo.email>',
      to: [recipientEmail],
      subject,
      body: textBody,
      textBody,
      htmlBody,
      folder: 'inbox',
      isRead: false,
      isStarred: false,
      attachments: [],
      userId: user._id,
      sizeBytes,
      receivedAt: new Date(),
    });

    await welcomeEmail.save();

    // Update user's used storage
    await User.findByIdAndUpdate(user._id, {
      $inc: { storageUsedBytes: sizeBytes }
    });

    return welcomeEmail;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Non-blocking error so user registration still succeeds
    return null;
  }
}

module.exports = {
  sendWelcomeEmail
};
