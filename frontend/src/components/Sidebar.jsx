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
  X,
  Sun,
  Moon
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from '../contexts/ThemeContext';
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
  const { theme, toggleTheme } = useTheme();
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
  const displayName = user?.name || user?.firstName || user?.username || userEmail.split('@')[0];
  const userAvatar = user?.avatar;
  const initial = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <aside
      className={`flex flex-col h-full bg-bg-sidebar border-r border-border select-none ${
        isMobileDrawer ? 'w-full max-w-[260px]' : 'w-[210px] min-w-[210px]'
      }`}
    >
      {/* Top */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          {isMobileDrawer && (
            <button
              onClick={onCloseDrawer}
              className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Compose */}
      <div className="px-3 py-2">
        <button
          onClick={() => {
            onCompose?.();
            if (isMobileDrawer) onCloseDrawer?.();
          }}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-accent text-bg rounded-lg font-medium text-[13px] hover:bg-accent-hover transition-colors cursor-pointer active:scale-[0.98]"
        >
          <PenSquare size={14} />
          <span>Compose</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1.5 space-y-0.5 overflow-y-auto">
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
              className={`flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-md text-[13px] transition-colors cursor-pointer ${
                isActive
                  ? 'bg-accent-light text-text-primary font-medium'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.7} />
              <span className="flex-1 text-left">{item.label}</span>
              {count > 0 && (
                <span className="text-[10px] font-medium font-mono text-text-tertiary">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border space-y-2.5">
        {/* Storage */}
        <div className="px-0.5">
          <div className="flex items-center justify-between text-[10px] text-text-tertiary mb-1">
            <span className="flex items-center gap-1">
              <HardDrive size={10} />
              Storage
            </span>
            <span className="font-mono">{usedMB}/{limitMB} MB</span>
          </div>
          <div className="w-full h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(pct, 3)}%`,
                backgroundColor: pct > 85 ? 'var(--color-danger)' : 'var(--color-pop)',
              }}
            />
          </div>
        </div>

        {/* User Card + Logout */}
        <div className="flex items-center gap-2 px-0.5 pt-0.5">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={displayName}
              className="w-6 h-6 rounded-full object-cover border border-border shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded bg-bg-card border border-border text-text-secondary flex items-center justify-center text-[10px] font-mono font-medium shrink-0">
              {initial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-text-primary truncate leading-tight">
              {displayName}
            </p>
            <p className="text-[10px] text-text-tertiary truncate font-mono" title={userEmail}>
              {userEmail}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="p-1 text-text-tertiary hover:text-danger transition-colors cursor-pointer shrink-0"
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
