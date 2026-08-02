import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search,
  Star,
  Paperclip,
  RefreshCw,
  Menu,
  Trash2,
  X
} from 'lucide-react';
import { emailAPI } from '../lib/api';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function parseEmailString(input) {
  if (!input) return { name: '', address: '' };
  if (typeof input === 'object') {
    return {
      name: input.name || '',
      address: input.address || input.email || ''
    };
  }
  const clean = String(input).trim();
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

function formatRecipientDisplay(to) {
  if (!to) return 'Unknown Recipient';
  if (Array.isArray(to)) {
    if (to.length === 0) return 'Unknown Recipient';
    const first = to[0];
    const parsed = parseEmailString(first);
    const firstStr = parsed.name || parsed.address || 'Unknown';
    if (to.length === 1) return firstStr;
    return `${firstStr} (+${to.length - 1})`;
  }
  const parsed = parseEmailString(to);
  return parsed.name || parsed.address || 'Unknown';
}

function getPreviewText(email) {
  if (email.snippet) return email.snippet;
  const raw = email.textBody || email.body || '';
  if (!raw) return 'No message preview';

  if (/<\/?[a-z][\s\S]*>/i.test(raw)) {
    const stripped = raw
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (stripped) return stripped.substring(0, 80);
    if (raw.includes('<img') || raw.includes('data:image')) return '📷 [Image]';
    return 'No message preview';
  }

  return raw.trim().substring(0, 80) || 'No message preview';
}

function EmailSkeleton() {
  return (
    <div className="px-3.5 py-3 border-b border-border-light">
      <div className="flex items-start gap-2.5">
        <div className="skeleton w-7 h-7 rounded-md shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-2.5 w-8" />
          </div>
          <div className="skeleton h-3 w-3/4" />
          <div className="skeleton h-2.5 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function EmailList({
  folder,
  selectedEmailId,
  onSelectEmail,
  onOpenMobileSidebar,
  onCompose,
}) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'unread' | 'starred'
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const searchTimer = useRef(null);

  const fetchEmails = useCallback(async (query = '') => {
    try {
      const params = { folder };
      if (query) params.search = query;
      const res = await emailAPI.list(params);
      const list = res.data.emails || res.data || [];
      setEmails(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch emails', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [folder]);

  useEffect(() => {
    setLoading(true);
    setSearch('');
    setSelectedIds(new Set());
    fetchEmails();
  }, [folder, fetchEmails]);

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchEmails(val);
    }, 250);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmails(search);
  };

  // Socket listener for real-time emails
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (email) => {
      if (folder === 'inbox') {
        setEmails((prev) => [email, ...prev]);
        toast('New email received', {
          icon: '✉️',
          style: {
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            fontSize: '13px',
          },
        });
      }
    };
    socket.on('new-email', handler);
    return () => socket.off('new-email', handler);
  }, [folder]);

  const toggleStar = async (e, id) => {
    e.stopPropagation();
    try {
      await emailAPI.toggleStar(id);
      setEmails((prev) =>
        prev.map((em) => (em._id === id ? { ...em, isStarred: !em.isStarred } : em))
      );
    } catch {
      toast.error('Failed to update star');
    }
  };

  const handleDeleteEmail = async (e, id) => {
    e.stopPropagation();
    try {
      await emailAPI.moveToFolder(id, 'trash');
      setEmails((prev) => prev.filter((em) => em._id !== id));
      toast.success('Moved to trash');
    } catch {
      toast.error('Failed to delete email');
    }
  };

  // Filtered emails
  const displayedEmails = useMemo(() => {
    return emails.filter((em) => {
      if (filterType === 'unread') return !em.isRead;
      if (filterType === 'starred') return em.isStarred;
      return true;
    });
  }, [emails, filterType]);

  const unreadTotal = useMemo(() => emails.filter((e) => !e.isRead).length, [emails]);

  const emptyMessages = {
    inbox: { label: '// empty inbox', sub: 'Emails sent to your address appear here in real-time.' },
    starred: { label: '// no starred emails', sub: 'Star important emails to quickly find them.' },
    sent: { label: '// no sent emails', sub: 'Messages you send will be listed here.' },
    trash: { label: '// trash is empty', sub: 'Deleted messages stay in trash.' },
  };

  const empty = emptyMessages[folder] || emptyMessages.inbox;

  return (
    <div className="flex flex-col h-full bg-bg border-r border-border select-none">
      {/* Top Header */}
      <div className="p-3 border-b border-border bg-bg space-y-2">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMobileSidebar}
              className="p-1 rounded-md text-text-secondary hover:text-text-primary md:hidden cursor-pointer"
              aria-label="Open folder navigation"
            >
              <Menu size={16} />
            </button>
            <h2 className="font-heading font-semibold text-sm capitalize text-text-primary flex items-center gap-2">
              <span>{folder}</span>
              {unreadTotal > 0 && (
                <span className="font-mono text-[11px] text-pop font-medium">
                  ({unreadTotal})
                </span>
              )}
            </h2>
          </div>

          <button
            onClick={handleRefresh}
            className={`p-1.5 rounded-md text-text-tertiary hover:text-text-primary transition-colors cursor-pointer ${
              refreshing ? 'animate-spin text-pop' : ''
            }`}
            title="Refresh"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder={`Search ${folder}…`}
            className="w-full pl-7 pr-6 py-1.5 text-xs bg-bg-card rounded-md border border-border text-text-primary placeholder:text-text-subtle focus:border-text-tertiary transition-colors outline-none"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); fetchEmails(''); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary cursor-pointer p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 pt-0.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'starred', label: 'Starred' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-accent text-bg'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border-light">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <EmailSkeleton key={i} />)
        ) : displayedEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center fade-in">
            <p className="font-mono text-xs text-text-tertiary mb-1">{empty.label}</p>
            <p className="text-[11px] text-text-tertiary max-w-[200px] leading-relaxed">{empty.sub}</p>
            {folder === 'inbox' && (
              <button
                onClick={onCompose}
                className="mt-3 px-3 py-1.5 text-xs font-medium bg-accent text-bg rounded-md hover:bg-accent-hover transition-colors cursor-pointer"
              >
                Compose email
              </button>
            )}
          </div>
        ) : (
          displayedEmails.map((email) => {
            const isSelected = selectedIds.has(email._id) || email._id === selectedEmailId;
            const isRead = email.isRead;
            const isSent = folder === 'sent' || email.folder === 'sent';
            const recipientText = formatRecipientDisplay(email.to);
            const parsedSender = parseEmailString(email.from);
            const senderName = parsedSender.name || parsedSender.address || 'Unknown Sender';
            
            const displayTitle = isSent ? `To: ${recipientText}` : senderName;
            const avatarSeed = isSent ? recipientText : senderName;
            const initial = (avatarSeed.replace(/^[<"'\s]+/, '').charAt(0) || 'U').toUpperCase();

            return (
              <div
                key={email._id}
                onClick={() => {
                  setSelectedIds(new Set([email._id]));
                  onSelectEmail(email._id);
                }}
                className={`group relative px-3 py-2.5 cursor-pointer transition-colors border-l-2 ${
                  isSelected
                    ? 'bg-accent-light border-l-accent'
                    : !isRead
                    ? 'bg-bg-card border-l-pop hover:bg-bg-hover'
                    : 'bg-bg border-l-transparent hover:bg-bg-hover'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Monospace initial badge */}
                  <div className="w-6 h-6 rounded bg-bg-card border border-border text-text-secondary flex items-center justify-center text-[11px] font-mono font-medium shrink-0 mt-0.5">
                    {initial}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <span
                        className={`text-xs truncate ${
                          !isRead
                            ? 'font-bold text-text-primary'
                            : 'font-medium text-text-secondary'
                        }`}
                      >
                        {displayTitle}
                      </span>
                      <span className="text-[10px] text-text-tertiary shrink-0 font-mono">
                        {timeAgo(email.receivedAt || email.createdAt || email.date)}
                      </span>
                    </div>

                    <p
                      className={`text-xs truncate mb-0.5 ${
                        !isRead
                          ? 'font-semibold text-text-primary'
                          : 'font-normal text-text-secondary'
                      }`}
                    >
                      {email.subject || '(no subject)'}
                    </p>

                    <p className="text-[11px] text-text-tertiary truncate leading-tight">
                      {getPreviewText(email)}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 mt-1">
                      {email.attachments?.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-text-tertiary font-mono">
                          <Paperclip size={10} className="text-text-secondary" />
                          <span>{email.attachments.length}</span>
                        </span>
                      )}
                      {!isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-pop" />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => toggleStar(e, email._id)}
                      className={`p-0.5 rounded transition-colors cursor-pointer ${
                        email.isStarred
                          ? 'text-star'
                          : 'text-text-tertiary sm:opacity-0 sm:group-hover:opacity-100 hover:text-text-primary'
                      }`}
                      title={email.isStarred ? 'Unstar' : 'Star'}
                    >
                      <Star size={13} fill={email.isStarred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteEmail(e, email._id)}
                      className="p-0.5 rounded text-text-tertiary hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
