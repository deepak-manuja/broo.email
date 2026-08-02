import { useState, useEffect } from 'react';
import {
  Star,
  Trash2,
  Reply,
  Forward,
  ArrowLeft,
  Download,
  Paperclip,
  Loader2,
  Send,
  Copy
} from 'lucide-react';
import { emailAPI, API_URL } from '../lib/api';
import toast from 'react-hot-toast';

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRecipients(to) {
  if (!to) return '';
  if (Array.isArray(to)) {
    if (to.length === 0) return '';
    return to
      .map((t) => {
        if (typeof t === 'string') {
          const parsed = parseEmailString(t);
          return parsed.name && parsed.name !== parsed.address
            ? `${parsed.name} <${parsed.address}>`
            : parsed.address;
        }
        return t.name ? `${t.name} <${t.address}>` : t.address || '';
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof to === 'object') {
    return to.name ? `${to.name} <${to.address}>` : to.address || '';
  }
  const parsed = parseEmailString(to);
  return parsed.name && parsed.name !== parsed.address
    ? `${parsed.name} <${parsed.address}>`
    : parsed.address;
}

export function parseEmailString(input) {
  if (!input) return { name: '', address: '' };
  if (typeof input === 'object') {
    return {
      name: input.name || '',
      address: input.address || input.email || ''
    };
  }
  const clean = String(input).trim();
  // Match standard formats: "Name" <email> or Name <email> or <email>
  const match = clean.match(/^"?([^"<]*)"?\s*<([^>]+)>/) || clean.match(/<([^>]+)>/);
  if (match) {
    const address = match[2] ? match[2].trim() : match[1].trim();
    let name = match[2] ? match[1].trim().replace(/^["']|["']$/g, '') : '';
    if (!name && address.includes('@')) {
      name = address.split('@')[0];
    }
    return { name: name || address, address };
  }
  
  if (clean.includes('@')) {
    return { name: clean.split('@')[0], address: clean };
  }
  return { name: clean, address: clean };
}

function getFirstRecipientEmail(to) {
  if (!to) return '';
  if (Array.isArray(to)) {
    if (to.length === 0) return '';
    const first = to[0];
    const parsed = parseEmailString(first);
    return parsed.address || '';
  }
  const parsed = parseEmailString(to);
  return parsed.address || '';
}

function isHTML(str) {
  if (!str || typeof str !== 'string') return false;
  return /<\/?[a-z][\s\S]*>/i.test(str);
}

export default function EmailView({
  emailId,
  onBack,
  onDeleted,
  onReply,
  onForward
}) {
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quickReplyText, setQuickReplyText] = useState('');
  const [sendingQuickReply, setSendingQuickReply] = useState(false);

  useEffect(() => {
    if (!emailId) {
      setEmail(null);
      return;
    }

    setLoading(true);
    emailAPI.getById(emailId)
      .then((res) => {
        setEmail(res.data);
        if (!res.data.isRead) {
          emailAPI.markAsRead(emailId, true).catch(() => {});
        }
      })
      .catch(() => toast.error('Failed to load email details'))
      .finally(() => setLoading(false));
  }, [emailId]);

  if (!emailId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 bg-bg select-none fade-in">
        <p className="font-mono text-xs text-text-tertiary mb-1">// no message selected</p>
        <p className="text-xs text-text-tertiary max-w-[220px] leading-relaxed">
          Select a thread from the list or press <kbd className="font-mono bg-bg-card border border-border px-1 py-0.5 rounded text-[11px]">C</kbd> to compose.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg gap-2">
        <Loader2 size={20} className="animate-spin text-text-tertiary" />
        <p className="font-mono text-xs text-text-tertiary">loading message…</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg text-center p-6">
        <p className="font-mono text-xs text-text-secondary mb-3">// message unavailable</p>
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-accent text-bg rounded-md text-xs font-medium cursor-pointer"
        >
          Return to list
        </button>
      </div>
    );
  }

  const isSentFolder = email.folder === 'sent';
  const recipientsListText = formatRecipients(email.to);
  const firstRecipientEmail = getFirstRecipientEmail(email.to);

  const parsedSender = parseEmailString(email.from);
  const parsedRecipient = parseEmailString(firstRecipientEmail);

  const senderName = parsedSender.name || parsedSender.address || 'Unknown';
  const senderEmail = parsedSender.address || '';

  const cardTitle = isSentFolder ? (recipientsListText || parsedRecipient.name || 'Recipient') : senderName;
  const cardEmail = isSentFolder ? (parsedRecipient.address || firstRecipientEmail) : senderEmail;

  const rawHtml = email.htmlBody || (isHTML(email.body) ? email.body : '');
  const hasHtml = Boolean(rawHtml);

  const handleDelete = async () => {
    try {
      await emailAPI.moveToFolder(emailId, 'trash');
      toast.success('Moved to trash');
      onDeleted?.();
    } catch {
      toast.error('Failed to delete email');
    }
  };

  const handleStar = async () => {
    try {
      await emailAPI.toggleStar(emailId);
      setEmail((prev) => ({ ...prev, isStarred: !prev.isStarred }));
    } catch {
      toast.error('Failed to update star');
    }
  };

  const replyTargetEmail = isSentFolder
    ? (parsedRecipient.address || firstRecipientEmail || recipientsListText)
    : (senderEmail || senderName);

  const senderHeaderString = senderName && senderEmail && senderName !== senderEmail
    ? `${senderName} <${senderEmail}>`
    : (senderEmail || senderName);

  const handleQuickReply = async (e) => {
    e.preventDefault();
    if (!quickReplyText.trim()) return;

    const replySubject = email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`;

    setSendingQuickReply(true);
    try {
      const formData = new FormData();
      formData.append('to', replyTargetEmail);
      formData.append('subject', replySubject);
      formData.append('body', quickReplyText.trim());

      await emailAPI.send(formData);
      toast.success('Reply sent!');
      setQuickReplyText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingQuickReply(false);
    }
  };

  const copyEmailAddress = (address) => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Copied to clipboard');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-bg overflow-hidden fade-in h-full">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-text-secondary hover:text-text-primary md:hidden cursor-pointer"
            title="Back"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleStar}
            className={`p-1.5 rounded hover:bg-bg-hover transition-colors cursor-pointer ${
              email.isStarred ? 'text-star' : 'text-text-tertiary hover:text-text-primary'
            }`}
            title={email.isStarred ? 'Unstar' : 'Star message'}
          >
            <Star size={15} fill={email.isStarred ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={() => onReply?.({
              to: replyTargetEmail,
              subject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`,
              body: `\n\n--- Original Message ---\nFrom: ${senderHeaderString}\nSubject: ${email.subject || ''}\n\n${email.textBody || email.snippet || email.body || ''}`,
            })}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            title="Reply"
          >
            <Reply size={14} />
            <span className="hidden sm:inline">Reply</span>
          </button>

          <button
            onClick={() => onForward?.({
              to: '',
              subject: email.subject?.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject || ''}`,
              body: `\n\n---------- Forwarded message ---------\nFrom: ${senderHeaderString}\nSubject: ${email.subject || ''}\n\n${email.textBody || email.snippet || email.body || ''}`,
            })}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            title="Forward"
          >
            <Forward size={14} />
            <span className="hidden sm:inline">Forward</span>
          </button>

          <div className="w-px h-3.5 bg-border mx-1" />

          <button
            onClick={handleDelete}
            className="p-1.5 rounded text-text-tertiary hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
            title="Delete message"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Main Email Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* Subject & Date Header */}
          <div className="border-b border-border pb-4">
            <h1 className="font-heading font-bold text-lg sm:text-xl text-text-primary leading-tight mb-2">
              {email.subject || '(no subject)'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-text-tertiary font-mono">
              <span>{formatFullDate(email.receivedAt || email.createdAt || email.date)}</span>
            </div>
          </div>

          {/* Sender & Recipient Information */}
          <div className="p-3 rounded-lg bg-bg-card border border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-xs text-text-primary truncate">
                    {cardTitle}
                  </span>
                  {cardEmail && cardEmail !== cardTitle && (
                    <button
                      onClick={() => copyEmailAddress(cardEmail)}
                      className="text-[11px] text-text-tertiary hover:text-text-primary font-mono flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy email address"
                    >
                      <span>&lt;{cardEmail}&gt;</span>
                      <Copy size={10} />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  {isSentFolder ? (
                    <>From: <span className="font-medium text-text-secondary">{senderHeaderString}</span></>
                  ) : (
                    <>to <span className="font-medium text-text-secondary">{recipientsListText || 'me'}</span></>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Email Body Content */}
          <div className="p-4 sm:p-5 bg-bg-card rounded-lg border border-border overflow-hidden">
            {hasHtml ? (
              <div
                className="email-content-rendered max-w-none text-text-primary text-xs sm:text-sm leading-relaxed break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2 [&_a]:text-pop [&_a]:underline [&_table]:w-full [&_table]:border-collapse"
                dangerouslySetInnerHTML={{ __html: rawHtml }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-xs sm:text-sm text-text-primary leading-relaxed font-sans break-words">
                {email.textBody || email.body || '(Empty email message)'}
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="p-3.5 rounded-lg bg-bg-card border border-border">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Paperclip size={13} className="text-text-secondary" />
                <span className="font-mono text-xs font-medium text-text-primary">
                  Attachments ({email.attachments.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {email.attachments.map((att, i) => {
                  const downloadHref = att.storageUrl
                    ? att.storageUrl.startsWith('http')
                      ? att.storageUrl
                      : `${API_URL}${att.storageUrl}`
                    : att.url || '#';
                  return (
                    <a
                      key={i}
                      href={downloadHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={att.filename}
                      className="flex items-center gap-2.5 p-2.5 bg-bg rounded-md border border-border hover:border-text-tertiary transition-colors group no-underline"
                    >
                      <div className="p-1 rounded bg-bg-card border border-border text-text-tertiary group-hover:text-text-primary shrink-0">
                        <Download size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-text-primary truncate">
                          {att.filename}
                        </p>
                        {att.size && (
                          <p className="text-[10px] text-text-tertiary font-mono">
                            {(att.size / 1024).toFixed(0)} KB
                          </p>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Reply Box */}
          <div className="p-3.5 rounded-lg bg-bg-card border border-border">
            <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1.5">
              <Reply size={13} className="text-text-secondary" />
              <span>Quick Reply</span>
            </h4>
            <form onSubmit={handleQuickReply} className="space-y-2.5">
              <textarea
                value={quickReplyText}
                onChange={(e) => setQuickReplyText(e.target.value)}
                placeholder={`Reply to ${senderName}…`}
                rows={3}
                className="w-full p-2.5 text-xs bg-bg rounded-md border border-border text-text-primary placeholder:text-text-subtle focus:border-text-tertiary transition-colors outline-none resize-none font-sans"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-tertiary">
                  Press <kbd className="font-mono bg-bg border border-border px-1 py-0.5 rounded text-[10px]">Ctrl+Enter</kbd> or click send
                </span>
                <button
                  type="submit"
                  disabled={sendingQuickReply || !quickReplyText.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-bg rounded-md text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {sendingQuickReply ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
