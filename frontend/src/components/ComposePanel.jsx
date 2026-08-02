import { useState, useRef, useCallback, useEffect } from 'react';
import {
  X,
  Paperclip,
  Send,
  Loader2,
  FileIcon,
  Trash2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { emailAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function ComposePanel({ onClose, onSent, initialData = {} }) {
  const [to, setTo] = useState(initialData.to || '');
  const [cc, setCc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(initialData.subject || '');
  const [body, setBody] = useState(initialData.body || '');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const fileInputRef = useRef(null);
  const toInputRef = useRef(null);

  useEffect(() => {
    if (toInputRef.current && !initialData.to) {
      toInputRef.current.focus();
    }
  }, [initialData.to]);

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles);
    // Limit to 25MB total or individual
    setFiles((prev) => [...prev, ...fileArray]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    // Escape to close
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSend = async () => {
    if (!to.trim()) return toast.error('Please specify at least one recipient');
    if (!subject.trim()) return toast.error('Please enter a subject');

    setSending(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('to', to.trim());
      if (cc.trim()) formData.append('cc', cc.trim());
      formData.append('subject', subject.trim());
      formData.append('body', body);
      files.forEach((f) => formData.append('attachments', f));

      const res = await emailAPI.send(formData, (progressEvent) => {
        if (progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        }
      });

      const outbound = res?.data?.outboundDelivery;
      if (outbound && outbound.success === false) {
        toast.error(outbound.error || 'Saved to Sent, but delivery via Resend failed.', {
          duration: 7000
        });
      } else if (outbound?.note) {
        toast.success(`Email sent! (${outbound.note})`, { duration: 5000 });
      } else {
        toast.success('Email sent successfully!');
      }

      onSent?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-4 bg-black/40 backdrop-blur-xs transition-all"
      onKeyDown={handleKeyDown}
    >
      {/* Compose Window Container */}
      <div
        className={`w-full bg-bg-card border border-border shadow-dropdown flex flex-col transition-all duration-200 overflow-hidden ${
          isMaximized
            ? 'h-full max-h-screen sm:rounded-2xl sm:max-w-[900px] sm:h-[90vh]'
            : 'h-[85vh] sm:h-[620px] max-w-full sm:max-w-[580px] rounded-t-2xl sm:rounded-2xl'
        }`}
      >
        {/* Top Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-bg-sidebar border-b border-border select-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <h3 className="font-heading font-semibold text-xs sm:text-sm text-text-primary">
              {subject ? subject : 'New Message'}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-hover hidden sm:inline-flex transition-colors cursor-pointer"
              title={isMaximized ? 'Restore size' : 'Maximize window'}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-tertiary hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Fields */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-bg-card">
          {/* To Field */}
          <div className="border-b border-border-light px-4 py-2 flex items-center gap-3">
            <label className="text-xs font-semibold text-text-tertiary w-12 shrink-0">
              To
            </label>
            <input
              ref={toInputRef}
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 text-xs sm:text-sm bg-transparent border-none outline-none text-text-primary placeholder:text-text-tertiary"
            />
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-[11px] font-semibold text-text-tertiary hover:text-accent cursor-pointer transition-colors"
              >
                Cc
              </button>
            )}
          </div>

          {/* Cc Field (collapsible) */}
          {showCc && (
            <div className="border-b border-border-light px-4 py-2 flex items-center gap-3 fade-in">
              <label className="text-xs font-semibold text-text-tertiary w-12 shrink-0">
                Cc
              </label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="flex-1 text-xs sm:text-sm bg-transparent border-none outline-none text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          )}

          {/* Subject Field */}
          <div className="border-b border-border-light px-4 py-2 flex items-center gap-3">
            <label className="text-xs font-semibold text-text-tertiary w-12 shrink-0">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              className="flex-1 text-xs sm:text-sm bg-transparent border-none outline-none text-text-primary placeholder:text-text-tertiary font-medium"
            />
          </div>

          {/* Body textarea */}
          <div className="flex-1 p-4 min-h-[160px] flex flex-col">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email here…"
              className="w-full flex-1 text-xs sm:text-sm bg-transparent border-none outline-none resize-none text-text-primary placeholder:text-text-tertiary leading-relaxed font-sans"
            />
          </div>

          {/* Drag & drop upload box */}
          <div
            className={`mx-4 mb-3 border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer ${
              dragOver
                ? 'border-accent bg-accent-light/50 scale-[0.99]'
                : 'border-border-light hover:border-accent/40 bg-bg/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex items-center justify-center gap-2 text-text-tertiary">
              <Paperclip size={14} className="text-accent" />
              <span className="text-xs">
                Drag files here or <span className="text-accent font-semibold">browse computer</span>
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {/* Attached files preview */}
          {files.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-bg rounded-lg border border-border-light text-xs font-medium text-text-primary shadow-soft"
                >
                  <FileIcon size={13} className="text-accent shrink-0" />
                  <span className="truncate max-w-[140px] text-[11px]">{f.name}</span>
                  <span className="text-[10px] text-text-tertiary font-mono">
                    {(f.size / 1024).toFixed(0)}K
                  </span>
                  <button
                    onClick={() => removeFile(i)}
                    className="p-0.5 text-text-tertiary hover:text-danger cursor-pointer transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-bg-sidebar border-t border-border flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs sm:text-sm font-semibold shadow-soft hover:shadow-card transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              <span>{sending ? 'Sending…' : 'Send Message'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
              title="Attach files"
            >
              <Paperclip size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {sending && uploadProgress > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-20 sm:w-28 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[11px] text-text-tertiary font-mono">
                  {uploadProgress}%
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-text-tertiary hover:text-danger hover:bg-danger-light rounded-lg transition-colors cursor-pointer"
              title="Discard draft"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

