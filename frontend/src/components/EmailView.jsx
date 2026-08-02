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
  Mail,
  ShieldCheck,
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
      .map((t) => (typeof t === 'string' ? t : (t.name ? `${t.name} <${t.address}>` : t.address || '')))
      .filter(Boolean)
      .join(', ');
  }
  if (typeof to === 'object') {
    return to.name ? `${to.name} <${to.address}>` : to.address || '';
  }
  return String(to);
}

function getFirstRecipientEmail(to) {
  if (!to) return '';
  if (Array.isArray(to)) {
    if (to.length === 0) return '';
    const first = to[0];
    return typeof first === 'string' ? first : (first?.address || '');
  }
  if (typeof to === 'object') return to.address || '';
  return String(to);
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
        // Mark as read locally if not already
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
        <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border flex items-center justify-center mb-4 shadow-soft">
          <Mail size={28} className="text-text-tertiary" />
        </div>
        <h3 className="font-heading font-semibold text-text-primary text-base mb-1">
          No email selected
        </h3>
        <p className="text-xs text-text-tertiary max-w-[260px] leading-relaxed">
          Choose a conversation from the list to read messages, view attachments, or send a reply.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg gap-3">
        <Loader2 size={28} className="animate-spin text-accent" />
        <p className="text-xs text-text-tertiary font-medium">Loading message…</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg text-center p-6">
        <p className="text-text-secondary font-medium text-sm mb-2">Message unavailable</p>
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-bg-card border border-border rounded-lg text-xs text-text-primary hover:bg-bg-hover cursor-pointer"
        >
          Return to list
        </button>
      </div>
    );
  }

  const isSentFolder = email.folder === 'sent';
  const recipientsListText = formatRecipients(email.to);
  const firstRecipientEmail = getFirstRecipientEmail(email.to);

  const senderRaw = email.from?.name || email.from?.address || email.from || 'Unknown';
  const senderName = typeof senderRaw === 'string' ? senderRaw : (senderRaw.name || senderRaw.address || 'Unknown');
  const senderEmail = email.from?.address || (typeof email.from === 'string' ? email.from : '') || '';

  const cardTitle = isSentFolder ? (recipientsListText || 'Recipient') : senderName;
  const cardEmail = isSentFolder ? firstRecipientEmail : senderEmail;
  const cardInitial = (cardTitle.replace(/^[<"'\s]+/, '').charAt(0) || 'U').toUpperCase();

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

  const replyTargetEmail = isSentFolder ? (firstRecipientEmail || recipientsListText) : (senderEmail || senderName);

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
      toast.success('Reply sent successfully!');
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
      toast.success('Email address copied!');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-bg overflow-hidden fade-in h-full">
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-bg-card shadow-soft z-10 shrink-0">
        <div className="flex items-center gap-2">
          {/* Back button (Mobile & Tablet) */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer md:hidden"
            title="Back to inbox"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleStar}
            className={`p-2 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer ${
              email.isStarred ? 'text-star' : 'text-text-tertiary hover:text-text-primary'
            }`}
            title={email.isStarred ? 'Unstar' : 'Star message'}
          >
            <Star size={16} fill={email.isStarred ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={() => onReply?.({
              to: replyTargetEmail,
              subject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`,
              body: `\n\n--- Original Message ---\nFrom: ${senderName} <${senderEmail}>\nSubject: ${email.subject}\n\n${email.textBody || email.snippet || ''}`,
            })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            title="Reply"
          >
            <Reply size={15} />
            <span className="hidden sm:inline">Reply</span>
          </button>

          <button
            onClick={() => onForward?.({
              to: '',
              subject: email.subject?.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject || ''}`,
              body: `\n\n---------- Forwarded message ---------\nFrom: ${senderName} <${senderEmail}>\nSubject: ${email.subject}\n\n${email.textBody || email.snippet || ''}`,
            })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            title="Forward"
          >
            <Forward size={15} />
            <span className="hidden sm:inline">Forward</span>
          </button>

          <div className="w-px h-4 bg-border-light mx-1" />

          <button
            onClick={handleDelete}
            className="p-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
            title="Move to trash"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Email Scrollable Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[780px] mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
          {/* Subject Line */}
          <div>
            <h1 className="font-heading font-bold text-lg sm:text-2xl text-text-primary leading-tight mb-2">
              {email.subject || '(No Subject)'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-tertiary">
              <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <ShieldCheck size={12} />
                <span>Verified @broo.email</span>
              </span>
              <span>&bull;</span>
              <span>{formatFullDate(email.receivedAt || email.createdAt || email.date)}</span>
            </div>
          </div>

          {/* Sender & Recipient Card */}
          <div className="flex items-start justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-bg-card border border-border shadow-soft">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-dark text-white flex items-center justify-center font-heading font-bold text-sm shrink-0 shadow-soft">
                {cardInitial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-xs sm:text-sm text-text-primary truncate">
                    {isSentFolder ? `To: ${recipientsListText || 'Recipient'}` : senderName}
                  </span>
                  {cardEmail && (
                    <button
                      onClick={() => copyEmailAddress(cardEmail)}
                      className="text-[11px] text-text-tertiary hover:text-accent font-mono flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy email address"
                    >
                      <span>&lt;{cardEmail}&gt;</span>
                      <Copy size={10} />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  {isSentFolder ? (
                    <>From: <span className="font-medium text-text-secondary">{senderEmail || senderName}</span></>
                  ) : (
                    <>to <span className="font-medium text-text-secondary">{recipientsListText || 'me'}</span></>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Email Body Content */}
          <div className="p-4 sm:p-6 bg-bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            {hasHtml ? (
              <div
                className="email-content-rendered max-w-none text-text-primary text-xs sm:text-sm leading-relaxed break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_img]:shadow-sm [&_a]:text-accent [&_a]:underline [&_table]:w-full [&_table]:border-collapse"
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
            <div className="p-4 rounded-xl bg-bg-card border border-border shadow-soft">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip size={14} className="text-accent" />
                <span className="text-xs font-semibold text-text-primary">
                  Attachments ({email.attachments.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                      className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-border-light hover:border-accent hover:bg-accent-light/40 transition-all group no-underline"
                    >
                    <div className="p-2 rounded-lg bg-bg-card border border-border-light text-text-tertiary group-hover:text-accent shrink-0">
                      <Download size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-text-primary truncate">
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
          <div className="p-4 rounded-xl bg-bg-card border border-border shadow-soft">
            <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1.5">
              <Reply size={13} className="text-accent" />
              <span>Quick Reply</span>
            </h4>
            <form onSubmit={handleQuickReply} className="space-y-3">
              <textarea
                value={quickReplyText}
                onChange={(e) => setQuickReplyText(e.target.value)}
                placeholder={`Reply to ${senderName}…`}
                rows={3}
                className="w-full p-3 text-xs bg-bg rounded-xl border border-border text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-bg-card transition-all resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-tertiary">
                  Or press <strong className="font-semibold text-text-secondary">Reply</strong> in toolbar for full editor
                </span>
                <button
                  type="submit"
                  disabled={sendingQuickReply || !quickReplyText.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-xs font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-soft"
                >
                  {sendingQuickReply ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Send Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

