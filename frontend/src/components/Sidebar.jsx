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
  const initial = (userEmail.charAt(0) || 'U').toUpperCase();

  return (
    <aside
      className={`flex flex-col h-full bg-bg-sidebar border-r border-border select-none ${
        isMobileDrawer ? 'w-full max-w-[280px]' : 'w-[220px] min-w-[220px]'
      }`}
    >
      {/* Top */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {isMobileDrawer && (
            <button
              onClick={onCloseDrawer}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <X size={16} />
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
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold text-sm shadow-soft hover:shadow-card transition-all cursor-pointer group active:scale-[0.98]"
        >
          <PenSquare size={15} className="group-hover:rotate-6 transition-transform" />
          <span>Compose</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
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
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-accent-light text-accent font-semibold'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="flex-1 text-left">{item.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    isActive ? 'bg-accent text-white' : 'bg-border text-text-secondary'
                  }`}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border">
        {/* User */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-bg border border-border-light mb-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-accent to-accent-hover text-white flex items-center justify-center font-heading font-bold text-[11px] shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-text-primary truncate">{userEmail}</p>
          </div>
        </div>

        {/* Storage */}
        <div className="px-1 mb-2">
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
                backgroundColor: pct > 85 ? 'var(--color-danger)' : 'var(--color-accent)',
              }}
            />
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 text-[11px] font-medium text-text-tertiary hover:text-danger hover:bg-danger-light rounded-lg transition-colors cursor-pointer"
        >
          <LogOut size={12} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
