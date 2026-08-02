const fs = require('fs');
const path = require('path');

/**
 * Send an outbound email via the Resend API.
 * 
 * @param {Object} params
 * @param {string} params.from - Sender email (e.g. sender@broo.email)
 * @param {string|string[]} params.to - Recipient email(s)
 * @param {string|string[]} [params.cc] - CC recipient(s)
 * @param {string} params.subject - Email subject
 * @param {string} [params.text] - Plain text email content
 * @param {string} [params.html] - HTML email content
 * @param {Array<{filename: string, path?: string, content?: Buffer|string}>} [params.attachments]
 * @returns {Promise<{id?: string, success: boolean, error?: string}>}
 */
async function sendOutboundEmail({ from, to, cc, subject, text, html, attachments = [] }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === 're_your_api_key_here') {
    console.warn('[Resend Service] Warning: RESEND_API_KEY is not configured. Email will be recorded in DB but outbound sending is skipped.');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  // Normalize recipient lists
  const toList = Array.isArray(to)
    ? to
    : typeof to === 'string'
    ? to.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const ccList = cc
    ? Array.isArray(cc)
      ? cc
      : typeof cc === 'string'
      ? cc.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    : undefined;

  // Prepare attachments payload for Resend
  const preparedAttachments = [];
  for (const att of attachments) {
    try {
      if (att.content) {
        preparedAttachments.push({
          filename: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content.toString('base64')
            : att.content
        });
      } else if (att.path && fs.existsSync(att.path)) {
        const fileBuffer = await fs.promises.readFile(att.path);
        preparedAttachments.push({
          filename: att.filename,
          content: fileBuffer.toString('base64')
        });
      }
    } catch (err) {
      console.warn(`[Resend Service] Could not attach file ${att.filename}:`, err.message);
    }
  }

  // Determine sender email
  let sender = from;
  if (!sender.includes('@')) {
    sender = `${sender}@broo.email`;
  }

  // Allow env override for testing (e.g. RESEND_FROM_EMAIL=onboarding@resend.dev)
  const configuredFrom = process.env.RESEND_FROM_EMAIL;
  const initialFrom = configuredFrom
    ? (configuredFrom.includes('<') ? configuredFrom : `Broo Email <${configuredFrom}>`)
    : (sender.includes('<') ? sender : `Broo Email <${sender}>`);

  const safeText = text || (html ? undefined : ' ');
  const safeHtml = html || (text ? `<div style="font-family:sans-serif;line-height:1.6;">${text.replace(/\n/g, '<br/>')}</div>` : undefined);

  const payload = {
    from: initialFrom,
    to: toList,
    reply_to: sender.includes('<') ? sender.match(/<([^>]+)>/)?.[1] || sender : sender,
    subject: subject || '(no subject)',
    ...(safeText ? { text: safeText } : {}),
    ...(safeHtml ? { html: safeHtml } : {}),
  };

  // If neither text nor html was set, provide a fallback
  if (!payload.text && !payload.html) {
    payload.text = ' ';
  }

  if (ccList && ccList.length > 0) {
    payload.cc = ccList;
  }

  if (preparedAttachments.length > 0) {
    payload.attachments = preparedAttachments;
  }

  try {
    let response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let data = await response.json();

    // If initial attempt failed due to unverified domain and we didn't already use onboarding@resend.dev, attempt test fallback
    if (!response.ok && (data.message?.includes('not verified') || data.message?.includes('domain')) && !initialFrom.includes('onboarding@resend.dev')) {
      console.warn('[Resend Service] Domain not verified in Resend. Attempting test sender onboarding@resend.dev with reply_to:', sender);
      
      const fallbackPayload = {
        ...payload,
        from: `Broo Email <onboarding@resend.dev>`
      };

      const fallbackResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fallbackPayload)
      });

      const fallbackData = await fallbackResponse.json();
      if (fallbackResponse.ok) {
        console.log(`[Resend Service] Successfully sent email via test sender to ${toList.join(', ')} (Resend ID: ${fallbackData.id})`);
        return { success: true, id: fallbackData.id, note: 'Sent via onboarding@resend.dev' };
      } else {
        data = fallbackData;
        response = fallbackResponse;
      }
    }

    if (!response.ok) {
      console.error('[Resend Service] Resend API Error Response:', data);
      let userFriendlyError = data.message || 'Resend delivery failed';
      if (data.message?.includes('not verified') || data.message?.includes('only send testing emails')) {
        userFriendlyError = `Resend Domain Not Verified: Please add and verify 'broo.email' in your Resend dashboard at resend.com/domains. (Details: ${data.message})`;
      }
      return { success: false, error: userFriendlyError, data };
    }

    console.log(`[Resend Service] Successfully sent email to ${toList.join(', ')} (Resend ID: ${data.id})`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('[Resend Service] Failed to send email via Resend:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOutboundEmail
};
