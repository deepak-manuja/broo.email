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
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-4 bg-black/40 transition-all"
      onKeyDown={handleKeyDown}
    >
      <div
        className={`w-full bg-bg-card border border-border shadow-dropdown flex flex-col transition-all duration-200 overflow-hidden ${
          isMaximized
            ? 'h-full max-h-screen sm:rounded-xl sm:max-w-[900px] sm:h-[90vh]'
            : 'h-[85vh] sm:h-[580px] max-w-full sm:max-w-[560px] rounded-t-xl sm:rounded-xl'
        }`}
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-bg-sidebar border-b border-border select-none shrink-0">
          <h3 className="font-mono text-xs text-text-primary">
            {subject ? subject : '// new message'}
          </h3>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-bg-hover hidden sm:inline-flex transition-colors cursor-pointer"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-text-tertiary hover:text-danger transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-bg-card">
          {/* To */}
          <div className="border-b border-border-light px-3.5 py-2 flex items-center gap-2">
            <label className="text-xs font-mono text-text-tertiary w-10 shrink-0">
              to:
            </label>
            <input
              ref={toInputRef}
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 text-xs bg-transparent border-none outline-none text-text-primary placeholder:text-text-subtle font-mono"
            />
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-[11px] font-mono text-text-tertiary hover:text-text-primary cursor-pointer transition-colors"
              >
                cc
              </button>
            )}
          </div>

          {/* Cc */}
          {showCc && (
            <div className="border-b border-border-light px-3.5 py-2 flex items-center gap-2 fade-in">
              <label className="text-xs font-mono text-text-tertiary w-10 shrink-0">
                cc:
              </label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="flex-1 text-xs bg-transparent border-none outline-none text-text-primary placeholder:text-text-subtle font-mono"
              />
            </div>
          )}

          {/* Subject */}
          <div className="border-b border-border-light px-3.5 py-2 flex items-center gap-2">
            <label className="text-xs font-mono text-text-tertiary w-10 shrink-0">
              sub:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 text-xs bg-transparent border-none outline-none text-text-primary placeholder:text-text-subtle font-medium"
            />
          </div>

          {/* Body */}
          <div className="flex-1 p-3.5 min-h-[160px] flex flex-col">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email here…"
              className="w-full flex-1 text-xs sm:text-sm bg-transparent border-none outline-none resize-none text-text-primary placeholder:text-text-subtle leading-relaxed font-sans"
            />
          </div>

          {/* Dropzone */}
          <div
            className={`mx-3.5 mb-3 border border-dashed rounded-lg p-2.5 text-center transition-colors cursor-pointer ${
              dragOver
                ? 'border-pop bg-pop-light'
                : 'border-border hover:border-text-tertiary bg-bg'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex items-center justify-center gap-1.5 text-text-tertiary text-xs">
              <Paperclip size={13} className="text-text-secondary" />
              <span>Attach files (drag or click)</span>
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

          {/* Attached Files */}
          {files.length > 0 && (
            <div className="px-3.5 pb-3 flex flex-wrap gap-1.5">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-1 bg-bg rounded border border-border text-xs text-text-primary font-mono"
                >
                  <FileIcon size={12} className="text-text-secondary shrink-0" />
                  <span className="truncate max-w-[120px] text-[11px]">{f.name}</span>
                  <span className="text-[10px] text-text-tertiary">
                    {(f.size / 1024).toFixed(0)}K
                  </span>
                  <button
                    onClick={() => removeFile(i)}
                    className="p-0.5 text-text-tertiary hover:text-danger cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2.5 bg-bg-sidebar border-t border-border flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent text-bg hover:bg-accent-hover rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              <span>{sending ? 'Sending…' : 'Send'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded transition-colors cursor-pointer"
              title="Attach files"
            >
              <Paperclip size={15} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {sending && uploadProgress > 0 && (
              <span className="text-[11px] text-text-tertiary font-mono">
                {uploadProgress}%
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-text-tertiary hover:text-danger transition-colors cursor-pointer"
              title="Discard (Esc)"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
