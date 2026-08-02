import { useState, useCallback, useEffect } from 'react';
import { PenSquare } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import EmailList from '../components/EmailList';
import EmailView from '../components/EmailView';
import ComposePanel from '../components/ComposePanel';

export default function Inbox() {
  const [folder, setFolder] = useState('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [composing, setComposing] = useState(false);
  const [composeInitialData, setComposeInitialData] = useState({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [listKey, setListKey] = useState(0);

  const refreshList = useCallback(() => {
    setListKey((k) => k + 1);
  }, []);

  const handleFolderChange = (newFolder) => {
    setFolder(newFolder);
    setSelectedEmailId(null);
  };

  const handleReply = (data) => {
    setComposeInitialData(data);
    setComposing(true);
  };

  const handleForward = (data) => {
    setComposeInitialData(data);
    setComposing(true);
  };

  const handleOpenCompose = () => {
    setComposeInitialData({});
    setComposing(true);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleOpenCompose();
      }

      if (e.key === 'Escape') {
        if (composing) {
          setComposing(false);
        } else if (mobileSidebarOpen) {
          setMobileSidebarOpen(false);
        } else if (selectedEmailId) {
          setSelectedEmailId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [composing, mobileSidebarOpen, selectedEmailId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg font-body selection:bg-accent-light selection:text-accent">
      {/* Desktop Sidebar (hidden on mobile < md) */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          activeFolder={folder}
          onFolderChange={handleFolderChange}
          onCompose={handleOpenCompose}
        />
      </div>

      {/* Mobile Drawer (Slide-in with Backdrop) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity fade-in"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative z-10 w-[280px] max-w-[85vw] h-full shadow-dropdown slide-in">
            <Sidebar
              activeFolder={folder}
              onFolderChange={handleFolderChange}
              onCompose={handleOpenCompose}
              isMobileDrawer={true}
              onCloseDrawer={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Content Area (2 panels: List & View) */}
      <div className="flex flex-1 min-w-0 h-full overflow-hidden relative">
        {/* Email list panel */}
        {/* On mobile: Hidden if an email is selected. On desktop: Always visible with responsive width */}
        <div
          className={`h-full flex flex-col transition-all ${
            selectedEmailId ? 'hidden md:flex' : 'flex w-full'
          } md:w-[320px] lg:w-[360px] xl:w-[380px] shrink-0`}
        >
          <EmailList
            key={listKey}
            folder={folder}
            selectedEmailId={selectedEmailId}
            onSelectEmail={setSelectedEmailId}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            onCompose={handleOpenCompose}
          />
        </div>

        {/* Email detail view panel */}
        {/* On mobile: Visible only if an email is selected. On desktop: Always visible */}
        <div
          className={`h-full flex-1 flex flex-col min-w-0 ${
            !selectedEmailId ? 'hidden md:flex' : 'flex w-full'
          }`}
        >
          <EmailView
            emailId={selectedEmailId}
            onBack={() => setSelectedEmailId(null)}
            onDeleted={() => {
              setSelectedEmailId(null);
              refreshList();
            }}
            onReply={handleReply}
            onForward={handleForward}
          />
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) for Compose when on List view without selected email */}
      {!selectedEmailId && (
        <div className="fixed right-5 bottom-6 z-40 md:hidden">
          <button
            onClick={handleOpenCompose}
            className="flex items-center gap-2 px-4 py-3 bg-accent text-bg rounded-full font-medium text-xs shadow-card hover:bg-accent-hover active:scale-95 transition-all cursor-pointer"
            aria-label="Compose new message"
          >
            <PenSquare size={16} />
            <span>Compose</span>
          </button>
        </div>
      )}

      {/* Compose Modal */}
      {composing && (
        <ComposePanel
          initialData={composeInitialData}
          onClose={() => setComposing(false)}
          onSent={() => {
            refreshList();
          }}
        />
      )}
    </div>
  );
}

