const SMTPServer = require('smtp-server').SMTPServer;
const simpleParser = require('mailparser').simpleParser;
const mongoose = require('mongoose');
const User = require('./models/User');
const Email = require('./models/Email');
const { updateStorageUsage, calculateEmailSize, getAttachmentStoragePath } = require('./utils/storage');
const { emitNewEmail } = require('./socket');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Create SMTP server
const smtpServer = new SMTPServer({
  // Allow insecure auth for simplicity (in production, you'd want to secure this properly)
  authOptional: true,
  // Log connections
  onConnect(session, callback) {
    console.log(`SMTP connection from ${session.remoteAddress}`);
    return callback();
  },
  // Handle sender
  onMailFrom(address, session, callback) {
    // We accept any sender
    return callback();
  },
  // Handle recipient
  onRcptTo(address, session, callback) {
    // We accept any recipient for now; validation happens during processing
    return callback();
  },
  // Handle email data
  onData(stream, session, callback) {
    // Parse the email
    simpleParser(stream, async (err, parsed) => {
      if (err) {
        console.error('Error parsing email:', err);
        return callback(err);
      }

      try {
        const { from, to, subject, text, html, attachments, date } = parsed;

        // Process each recipient safely
        const toRecipients = Array.isArray(to) ? to : (to?.value || []);
        const recipientPromises = toRecipients
          .filter(addr => addr.address && addr.address.endsWith('@broo.email')) // Only process our domain
          .map(async (recipient) => {
            const userEmail = recipient.address;
            const user = await User.findOne({ email: userEmail });

            if (!user) {
              console.log(`User not found: ${userEmail}`);
              // Note: We don't return an error here because we don't want to bounce the email
              // for non-existent users (could be used for email enumeration)
              return;
            }

            // Calculate email size
            const size = await calculateEmailSize({
              body: html || text || '',
              attachments
            });

            // Check storage limit
            const canStore = await updateStorageUsage(user._id, size);
            if (!canStore) {
              console.log(`Storage limit exceeded for user ${userEmail}`);
              // Note: We still accept the SMTP transaction but don't store the email
              // In a production system, you might want to send a bounce notification
              return;
            }

            let formattedFrom = 'unknown@broo.email';
            if (from) {
              if (Array.isArray(from.value) && from.value.length > 0) {
                const firstVal = from.value[0];
                formattedFrom = firstVal.name
                  ? `"${firstVal.name.replace(/"/g, '')}" <${firstVal.address}>`
                  : (firstVal.address || from.text || 'unknown@broo.email');
              } else if (from.text) {
                formattedFrom = from.text;
              }
            }

            // Prepare email document
            const emailData = {
              from: formattedFrom,
              to: recipient.address,
              subject: subject || '(no subject)',
              body: html || text || '',
              htmlBody: html || '',
              textBody: text || '',
              folder: 'inbox',
              isRead: false,
              isStarred: false,
              attachments: [],
              userId: user._id,
              sizeBytes: size,
              receivedAt: date || new Date()
            };

            // Save attachments to filesystem and get their URLs
            if (attachments && attachments.length) {
              const attachmentPromises = attachments.map(async (attachment) => {
                const filename = attachment.filename;
                const content = attachment.content; // Buffer
                const contentType = attachment.contentType;

                // Create user directory if not exists
                const userDir = path.join(getAttachmentStoragePath(), user._id.toString());
                if (!fs.existsSync(userDir)) {
                  fs.mkdirSync(userDir, { recursive: true });
                }

                // Create a unique filename for the attachment
                const attachmentId = new mongoose.Types.ObjectId();
                const attachmentPath = path.join(userDir, `${attachmentId}-${filename}`);
                const relativePath = `/uploads/${user._id.toString()}/${attachmentId}-${filename}`;

                // Write file
                await fs.promises.writeFile(attachmentPath, content);

                return {
                  filename,
                  size: content.length,
                  mimeType: contentType,
                  storageUrl: relativePath // This will be served via our static route
                };
              });

              emailData.attachments = await Promise.all(attachmentPromises);
            }

            // Save email to database
            const email = new Email(emailData);
            await email.save();

            // Emit socket event for real-time notification
            emitNewEmail(user._id.toString(), email);

            console.log(`Email saved for user ${userEmail} from ${from.text || from.value}`);
          });

        // Wait for all recipients to be processed
        await Promise.all(recipientPromises);

        // Accept the email
        return callback();
      } catch (err) {
        console.error('Error processing email:', err);
        // Still accept the email to avoid bouncing, but log the error
        return callback();
      }
    });
  }
});

// Start the SMTP server
const startSMTPServer = (port, host) => {
  smtpServer.listen(port || process.env.SMTP_PORT || 25, host || '0.0.0.0', () => {
    console.log(`SMTP server listening on port ${port || process.env.SMTP_PORT || 25}`);
  });
};

module.exports = {
  smtpServer,
  startSMTPServer
};