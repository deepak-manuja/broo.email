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

// Deterministic avatar color from string
const AVATAR_COLORS = [
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-purple-100 text-purple-700 border-purple-200',
];

function getAvatarStyle(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function EmailSkeleton() {
  return (
    <div className="px-4 py-3.5 border-b border-border-light">
      <div className="flex items-start gap-3">
        <div className="skeleton w-9 h-9 rounded-full shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center justify-between">
            <div className="skeleton h-3.5 w-24" />
            <div className="skeleton h-3 w-10" />
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
    }, 280);
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
          icon: '📬',
          style: { fontFamily: 'var(--font-body)', fontSize: '13px' },
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
    inbox: { emoji: '📭', title: 'Your inbox is empty', sub: 'Emails sent to your @broo.email address will appear here instantly.' },
    starred: { emoji: '⭐', title: 'No starred emails', sub: 'Star important emails to quickly find them later.' },
    sent: { emoji: '📤', title: 'No sent emails', sub: 'Messages you compose and send will be stored here.' },
    trash: { emoji: '🗑️', title: 'Trash is empty', sub: 'Deleted messages stay in trash before permanent cleanup.' },
  };

  const empty = emptyMessages[folder] || emptyMessages.inbox;

  return (
    <div className="flex flex-col h-full bg-bg-card border-r border-border select-none">
      {/* Top Header */}
      <div className="p-3 sm:p-4 border-b border-border-light bg-bg-card space-y-2.5">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger menu toggle */}
            <button
              onClick={onOpenMobileSidebar}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors md:hidden cursor-pointer"
              aria-label="Open folder navigation"
            >
              <Menu size={18} />
            </button>
            <h2 className="font-heading font-bold text-base sm:text-lg capitalize text-text-primary flex items-center gap-2">
              <span>{folder}</span>
              {unreadTotal > 0 && (
                <span className="text-[11px] font-semibold bg-accent-light text-accent px-2 py-0.5 rounded-full">
                  {unreadTotal} unread
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              className={`p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer ${
                refreshing ? 'animate-spin text-accent' : ''
              }`}
              title="Refresh mailbox"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder={`Search in ${folder}…`}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-bg rounded-lg border border-border-light text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-bg-card transition-all"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); fetchEmails(''); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary cursor-pointer p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'starred', label: 'Starred' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-accent-light text-accent'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Email List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-border-light">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => <EmailSkeleton key={i} />)
        ) : displayedEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center fade-in">
            <div className="w-12 h-12 rounded-2xl bg-bg-hover flex items-center justify-center text-2xl mb-3 shadow-soft">
              {empty.emoji}
            </div>
            <p className="font-heading font-semibold text-text-primary text-sm mb-1">{empty.title}</p>
            <p className="text-xs text-text-tertiary leading-relaxed max-w-[240px]">{empty.sub}</p>
            {folder === 'inbox' && (
              <button
                onClick={onCompose}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors shadow-soft cursor-pointer"
              >
                Send a test email
              </button>
            )}
          </div>
        ) : (
          displayedEmails.map((email) => {
            const isSelected = email._id === selectedEmailId;
            const isRead = email.isRead;
            const senderRaw = email.from?.name || email.from?.address || email.from || 'Unknown Sender';
            const senderName = typeof senderRaw === 'string' ? senderRaw : (senderRaw.name || senderRaw.address || 'Unknown');
            const initial = (senderName.charAt(0) || 'U').toUpperCase();
            const avatarColorClass = getAvatarStyle(senderName);

            return (
              <div
                key={email._id}
                onClick={() => onSelectEmail(email._id)}
                className={`group relative p-3 sm:px-4 sm:py-3.5 cursor-pointer transition-colors border-l-[3px] ${
                  isSelected
                    ? 'bg-accent-light/80 border-l-accent'
                    : !isRead
                    ? 'bg-bg-card border-l-accent hover:bg-bg-hover/60'
                    : 'bg-bg-card border-l-transparent hover:bg-bg-hover/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Sender Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border mt-0.5 transition-transform group-hover:scale-105 ${avatarColorClass}`}
                  >
                    {initial}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className={`text-xs truncate ${
                          !isRead
                            ? 'font-bold text-text-primary'
                            : 'font-medium text-text-secondary'
                        }`}
                      >
                        {senderName}
                      </span>
                      <span className="text-[10px] text-text-tertiary shrink-0 font-mono">
                        {timeAgo(email.createdAt || email.date)}
                      </span>
                    </div>

                    <p
                      className={`text-xs truncate mb-1 ${
                        !isRead
                          ? 'font-semibold text-text-primary'
                          : 'font-normal text-text-secondary'
                      }`}
                    >
                      {email.subject || '(no subject)'}
                    </p>

                    <p className="text-[11px] text-text-tertiary truncate leading-relaxed">
                      {email.snippet || email.textBody?.substring(0, 80) || email.body?.substring(0, 80) || 'No message preview'}
                    </p>

                    {/* Meta row: Attachments & badges */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {email.attachments?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-text-tertiary bg-bg px-1.5 py-0.5 rounded border border-border-light">
                          <Paperclip size={10} className="text-accent" />
                          <span>{email.attachments.length}</span>
                        </span>
                      )}
                      {!isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* Action buttons on right / hover */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                    <button
                      onClick={(e) => toggleStar(e, email._id)}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        email.isStarred
                          ? 'text-star'
                          : 'text-text-tertiary sm:opacity-0 sm:group-hover:opacity-100 hover:text-text-primary'
                      }`}
                      title={email.isStarred ? 'Unstar' : 'Star'}
                    >
                      <Star size={14} fill={email.isStarred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteEmail(e, email._id)}
                      className="p-1 rounded-md text-text-tertiary hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer"
                      title="Move to trash"
                    >
                      <Trash2 size={13} />
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

