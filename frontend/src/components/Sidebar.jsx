import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Star,
  Send,
  Trash2,
  PenSquare,
  LogOut,
  HardDrive,
  X
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../contexts/useAuth';
import { userAPI } from '../lib/api';

const NAV_ITEMS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

export default function Sidebar({
  activeFolder,
  onFolderChange,
  onCompose,
  unreadCounts = {},
  isMobileDrawer = false,
  onCloseDrawer,
}) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [storage, setStorage] = useState({ used: 0, limit: 104857600 });

  useEffect(() => {
    userAPI.getStorage()
      .then((res) => setStorage(res.data))
      .catch(() => {});
  }, []);

  const used = Number(storage?.usedBytes ?? storage?.used ?? 0) || 0;
  const limit = Number(storage?.limitBytes ?? storage?.limit ?? 104857600) || 104857600;
  const usedMB = (used / (1024 * 1024)).toFixed(1);
  const limitMB = (limit / (1024 * 1024)).toFixed(0);
  const pct = Math.min(Math.round((used / (limit || 1)) * 100), 100);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userEmail = user?.email || user?.username || 'user@broo.email';
  const initial = (userEmail.charAt(0) || 'U').toUpperCase();

  return (
    <aside
      className={`flex flex-col h-full bg-bg-sidebar border-r border-border select-none ${
        isMobileDrawer ? 'w-full max-w-[280px]' : 'w-[240px] min-w-[240px]'
      }`}
    >
      {/* Top Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <Logo size="md" showTag={true} />
        {isMobileDrawer && (
          <button
            onClick={onCloseDrawer}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Primary Compose Button */}
      <div className="px-4 py-2">
        <button
          onClick={() => {
            onCompose?.();
            if (isMobileDrawer) onCloseDrawer?.();
          }}
          className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold text-sm shadow-soft hover:shadow-card transition-all cursor-pointer group active:scale-[0.98]"
        >
          <PenSquare size={16} className="group-hover:rotate-6 transition-transform" />
          <span>Compose</span>
          <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-black/20 text-white/90 px-1.5 py-0.5 rounded font-mono font-normal">
            C
          </kbd>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-3 mb-1.5">
          Mailboxes
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeFolder === item.id;
          const count = unreadCounts[item.id] || 0;

          return (
            <button
              key={item.id}
              onClick={() => {
                onFolderChange(item.id);
                if (isMobileDrawer) onCloseDrawer?.();
              }}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-accent-light text-accent font-semibold shadow-soft'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              <Icon
                size={17}
                strokeWidth={isActive ? 2.3 : 1.8}
                className={isActive ? 'text-accent' : 'text-text-secondary'}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {count > 0 && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                    isActive
                      ? 'bg-accent text-white'
                      : 'bg-border text-text-secondary'
                  }`}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Storage Section */}
      <div className="p-3 border-t border-border bg-bg-card/60">
        {/* User Badge */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-bg border border-border-light mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark text-white flex items-center justify-center font-heading font-bold text-xs shrink-0 shadow-soft">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text-primary truncate" title={userEmail}>
              {userEmail}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
          </div>
        </div>

        {/* Storage Bar */}
        <div className="px-1 mb-3">
          <div className="flex items-center justify-between text-[11px] text-text-tertiary mb-1">
            <span className="flex items-center gap-1">
              <HardDrive size={12} />
              <span>Storage</span>
            </span>
            <span className="font-mono text-[10px]">
              {usedMB} / {limitMB} MB ({pct}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(pct, 4)}%`,
                backgroundColor: pct > 85 ? 'var(--color-danger)' : 'var(--color-accent)',
              }}
            />
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-1.5 text-xs font-medium text-text-tertiary hover:text-danger hover:bg-danger-light rounded-lg transition-colors cursor-pointer"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

