import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Mail,
  CheckCircle2,
  Lock,
  Sparkles,
  Inbox as InboxIcon,
  Star,
  Send,
  Trash2,
  Paperclip,
  Menu,
  X,
  ChevronDown,
  Laptop,
  Smartphone,
  Layers,
  Terminal
} from 'lucide-react';
import Logo from '../components/Logo';

const DEMO_EMAILS = [
  {
    id: 'demo-1',
    from: 'Deepak M.',
    senderEmail: 'deepak@broo.email',
    subject: 'Welcome to your new @broo.email inbox! 🚀',
    time: 'Just now',
    unread: true,
    starred: true,
    folder: 'inbox',
    body: `Hey there! 👋\n\nWelcome to broo.email. We built this because existing email clients are cluttered with newsletters you never signed up for, sluggish web interfaces, and invasive trackers.\n\nHere is what you get right out of the box:\n• Your personal @broo.email address\n• Real inbound SMTP receiving from anywhere (Gmail, Outlook, Apple Mail)\n• Real-time delivery via WebSockets (zero polling delay)\n• Clean 3-pane workflow with keyboard shortcuts\n\nEnjoy the speed and focus!\n\nBest,\nDeepak & The Broo Team`,
    attachments: [{ filename: 'welcome_guide.pdf', size: '240 KB' }]
  },
  {
    id: 'demo-2',
    from: 'GitHub Notifications',
    senderEmail: 'notifications@github.com',
    subject: '[GitHub] broo.email was starred by 12 developers today',
    time: '14m ago',
    unread: true,
    starred: false,
    folder: 'inbox',
    body: `Hi Deepak,\n\nYour repository broo.email received 12 new stars today!\n\nTop contributors this week:\n- alex-dev\n- sarah_k\n- chen-code\n\nKeep shipping great software!`,
    attachments: []
  },
  {
    id: 'demo-3',
    from: 'Stripe',
    senderEmail: 'receipts@stripe.com',
    subject: 'Invoice #INV-2026-0801 confirmed ($0.00)',
    time: '2h ago',
    unread: false,
    starred: false,
    folder: 'inbox',
    body: `Your free beta tier has been provisioned successfully.\n\nPlan: Broo Free Tier (100MB Storage)\nBilling cycle: Never (Free forever during beta)\n\nThank you for supporting independent developer tools.`,
    attachments: [{ filename: 'invoice_INV801.pdf', size: '42 KB' }]
  },
  {
    id: 'demo-4',
    from: 'Cal.com Booking',
    senderEmail: 'notifications@cal.com',
    subject: 'New meeting booked: Product Feedback Demo',
    time: '5h ago',
    unread: false,
    starred: false,
    folder: 'inbox',
    body: `A new product demo has been scheduled.\n\nDate: Tomorrow at 3:00 PM UTC\nGuest: alex@startup.io\nTopic: Email API integration & custom domains`,
    attachments: []
  }
];

const FAQS = [
  {
    q: 'How does the @broo.email address work?',
    a: 'When you register, you claim your own username (e.g. yourname@broo.email). We run a custom SMTP receiving server that accepts emails sent to that address from any email provider in the world (Gmail, Outlook, Yahoo, iCloud, custom domains) and routes them straight to your inbox in real time.'
  },
  {
    q: 'Is Broo really free to use?',
    a: 'Yes! During our public beta, every user gets a free @broo.email address, 100MB of cloud attachment storage, and full access to all web client features with zero subscription fees.'
  },
  {
    q: 'How fast is message delivery?',
    a: 'Sub-second! Our backend parses inbound SMTP streams and emits them via WebSocket connections to your client instantly. You do not need to hit refresh or wait on periodic 5-minute polling intervals.'
  },
  {
    q: 'Can I attach large files?',
    a: 'Yes, Broo supports attachments up to 25MB per file with support for PDFs, images, documents, spreadsheets, and archives.'
  },
  {
    q: 'Does Broo scan my emails for advertising?',
    a: 'Never. Broo is designed as a privacy-focused communication tool. We do not sell user data, track you across websites, or inject ads into your inbox.'
  }
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoFolder, setDemoFolder] = useState('inbox');
  const [selectedDemoId, setSelectedDemoId] = useState('demo-1');
  const [starredIds, setStarredIds] = useState(new Set(['demo-1']));
  const [openFaq, setOpenFaq] = useState(0);

  const toggleStar = (id, e) => {
    e?.stopPropagation();
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredDemoEmails = DEMO_EMAILS.filter((e) => {
    if (demoFolder === 'starred') return starredIds.has(e.id);
    if (demoFolder === 'sent') return e.folder === 'sent';
    if (demoFolder === 'trash') return e.folder === 'trash';
    return true;
  });

  const activeEmail = DEMO_EMAILS.find((e) => e.id === selectedDemoId) || DEMO_EMAILS[0];

  return (
    <div className="min-h-screen bg-bg text-text-primary selection:bg-accent-light selection:text-accent font-body">
      {/* Top Banner */}
      <div className="bg-text-primary text-bg px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Broo 2.0 is live with custom SMTP receiving & real-time delivery</span>
        <Link to="/login" className="underline underline-offset-2 text-accent-muted hover:text-white transition-colors ml-1 font-semibold">
          Claim your address &rarr;
        </Link>
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-md border-b border-border-light transition-all">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="no-underline">
            <Logo size="md" showTag={true} />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Features
            </a>
            <a href="#demo" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Live Demo
            </a>
            <a href="#comparison" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Why Broo
            </a>
            <a href="#faq" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              FAQ
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary px-3.5 py-2 rounded-lg hover:bg-bg-hover transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover px-4 py-2 rounded-lg shadow-soft transition-all duration-150 hover:shadow-card hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              to="/login"
              className="text-xs font-semibold text-white bg-accent hover:bg-accent-hover px-3 py-1.5 rounded-md shadow-soft"
            >
              Start Free
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-border bg-bg-card px-4 pt-3 pb-5 space-y-3 fade-in shadow-dropdown">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            >
              Features
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            >
              Live Interactive Demo
            </a>
            <a
              href="#comparison"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover"
            >
              Why Broo
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover"
            >
              FAQ
            </a>
            <div className="pt-2 border-t border-border-light flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-lg text-sm font-medium border border-border text-text-primary bg-bg"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-accent text-white shadow-soft"
              >
                Create Your Inbox
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-16 md:pb-20 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Glow background decorations */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="text-center max-w-[800px] mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-accent-light border border-accent/20 text-accent text-xs font-semibold rounded-full mb-6 shadow-soft hover:scale-105 transition-transform">
            <Sparkles size={13} className="text-accent" />
            <span>Modern Email Infrastructure · Real SMTP & WebSockets</span>
          </div>

          {/* Main Title */}
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-text-primary leading-[1.12] mb-5">
            Email designed for <span className="text-accent">focus</span>, not newsletters & bloat.
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-text-secondary leading-relaxed max-w-[620px] mx-auto mb-8 font-normal">
            Claim your personalized <strong className="text-text-primary font-semibold">@broo.email</strong> handle.
            Built with a custom SMTP receiving engine, sub-second delivery, and a lightning-fast 3-panel client.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-accent-hover shadow-soft hover:shadow-card transition-all duration-150 hover:-translate-y-0.5"
            >
              <span>Get Your @broo.email Address</span>
              <ArrowRight size={17} />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-bg-card border border-border hover:border-text-tertiary text-text-primary font-medium text-sm sm:text-base rounded-xl hover:bg-bg-hover transition-colors shadow-soft"
            >
              <Laptop size={16} className="text-accent" />
              <span>Try Live Demo</span>
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-success" />
              100% Free Public Beta
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-success" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-success" />
              100MB Cloud Storage
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-success" />
              Standard Inbound SMTP
            </span>
          </div>
        </div>

        {/* Live Interactive Sandbox Preview */}
        <div id="demo" className="mt-12 sm:mt-16 scroll-mt-20">
          <div className="bg-bg-card rounded-2xl border border-border shadow-card overflow-hidden transition-all">
            {/* Window bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-bg-sidebar border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                <span className="ml-2 font-mono text-xs text-text-tertiary font-medium hidden sm:inline">
                  broo.email &mdash; interactive preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  WebSocket Connected
                </span>
                <Link to="/login" className="text-xs font-semibold text-accent hover:underline hidden sm:inline ml-2">
                  Launch Real App &rarr;
                </Link>
              </div>
            </div>

            {/* Simulated 3-Pane Client */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px] bg-bg">
              {/* Mini Sidebar (3 cols on md) */}
              <div className="hidden md:flex md:col-span-3 lg:col-span-2 flex-col bg-bg-sidebar border-r border-border-light p-3">
                <div className="mb-3 px-1">
                  <Logo size="sm" />
                </div>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-accent text-white rounded-lg text-xs font-semibold shadow-soft hover:bg-accent-hover transition-colors mb-3"
                >
                  <Mail size={13} />
                  Compose
                </Link>
                <div className="space-y-1 flex-1">
                  {[
                    { id: 'inbox', label: 'Inbox', icon: InboxIcon, count: 2 },
                    { id: 'starred', label: 'Starred', icon: Star, count: starredIds.size },
                    { id: 'sent', label: 'Sent', icon: Send, count: 0 },
                    { id: 'trash', label: 'Trash', icon: Trash2, count: 0 },
                  ].map((folder) => {
                    const Icon = folder.icon;
                    const isActive = demoFolder === folder.id;
                    return (
                      <button
                        key={folder.id}
                        onClick={() => setDemoFolder(folder.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-accent-light text-accent font-semibold'
                            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={14} />
                          <span>{folder.label}</span>
                        </div>
                        {folder.count > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isActive ? 'bg-accent text-white' : 'bg-border text-text-secondary'
                          }`}>
                            {folder.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="pt-3 border-t border-border-light text-[11px] text-text-tertiary">
                  <div className="flex justify-between mb-1">
                    <span>Storage</span>
                    <span>1.2 MB / 100 MB</span>
                  </div>
                  <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                    <div className="w-[8%] h-full bg-accent rounded-full" />
                  </div>
                </div>
              </div>

              {/* Mini Email List (4 cols on md, 5 on lg) */}
              <div className="md:col-span-4 lg:col-span-4 bg-bg-card border-r border-border-light flex flex-col">
                <div className="p-3 border-b border-border-light flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-semibold text-xs capitalize text-text-primary">
                      {demoFolder}
                    </span>
                    <span className="text-[10px] text-text-tertiary">
                      ({filteredDemoEmails.length} {filteredDemoEmails.length === 1 ? 'message' : 'messages'})
                    </span>
                  </div>
                  {/* Mobile folder selector */}
                  <div className="flex md:hidden items-center gap-1">
                    {['inbox', 'starred', 'sent', 'trash'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setDemoFolder(f)}
                        className={`text-[10px] capitalize px-2 py-0.5 rounded ${
                          demoFolder === f ? 'bg-accent-light text-accent font-semibold' : 'text-text-tertiary'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-border-light flex-1 overflow-y-auto max-h-[380px]">
                  {filteredDemoEmails.length === 0 ? (
                    <div className="p-8 text-center text-xs text-text-tertiary">
                      No emails in {demoFolder}
                    </div>
                  ) : (
                    filteredDemoEmails.map((email) => {
                      const isSelected = activeEmail?.id === email.id;
                      const isStarred = starredIds.has(email.id);
                      return (
                        <div
                          key={email.id}
                          onClick={() => setSelectedDemoId(email.id)}
                          className={`p-3 cursor-pointer transition-colors text-left select-none ${
                            isSelected
                              ? 'bg-accent-light/70 border-l-[3px] border-l-accent'
                              : 'hover:bg-bg-hover border-l-[3px] border-l-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs truncate ${email.unread ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'}`}>
                              {email.from}
                            </span>
                            <span className="text-[10px] text-text-tertiary shrink-0 ml-2">
                              {email.time}
                            </span>
                          </div>
                          <p className={`text-xs truncate mb-1 ${email.unread ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                            {email.subject}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-text-tertiary truncate max-w-[200px]">
                              {email.body.substring(0, 50)}…
                            </p>
                            <div className="flex items-center gap-1.5">
                              {email.attachments.length > 0 && (
                                <Paperclip size={11} className="text-text-tertiary" />
                              )}
                              <button
                                onClick={(e) => toggleStar(email.id, e)}
                                className={`p-0.5 rounded transition-colors ${
                                  isStarred ? 'text-star' : 'text-text-tertiary hover:text-text-primary'
                                }`}
                              >
                                <Star size={12} fill={isStarred ? 'currentColor' : 'none'} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Mini Email View (5 cols on md, 6 on lg) */}
              <div className="md:col-span-5 lg:col-span-6 bg-bg p-4 sm:p-6 flex flex-col justify-between overflow-y-auto max-h-[380px]">
                {activeEmail ? (
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-border-light">
                      <div>
                        <h3 className="font-heading font-bold text-sm sm:text-base text-text-primary mb-1">
                          {activeEmail.subject}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-accent-light text-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                            {activeEmail.from.charAt(0)}
                          </div>
                          <div className="text-xs">
                            <span className="font-semibold text-text-primary">{activeEmail.from}</span>{' '}
                            <span className="text-text-tertiary">&lt;{activeEmail.senderEmail}&gt;</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-text-tertiary shrink-0">{activeEmail.time}</span>
                    </div>

                    <div className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-wrap font-body mb-6">
                      {activeEmail.body}
                    </div>

                    {activeEmail.attachments.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border-light">
                        <div className="text-[11px] font-medium text-text-tertiary mb-2">Attachments</div>
                        <div className="flex flex-wrap gap-2">
                          {activeEmail.attachments.map((att, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-card border border-border rounded-lg text-xs font-medium text-text-primary shadow-soft"
                            >
                              <Paperclip size={12} className="text-accent" />
                              <span>{att.filename}</span>
                              <span className="text-[10px] text-text-tertiary">({att.size})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-xs text-text-tertiary py-12">
                    Select an email to preview
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-border-light flex items-center justify-between text-xs text-text-tertiary">
                  <span>Press <kbd className="px-1.5 py-0.5 bg-bg-card border border-border rounded text-[10px] font-mono">c</kbd> to compose, <kbd className="px-1.5 py-0.5 bg-bg-card border border-border rounded text-[10px] font-mono">j</kbd>/<kbd className="px-1.5 py-0.5 bg-bg-card border border-border rounded text-[10px] font-mono">k</kbd> to navigate</span>
                  <Link to="/login" className="font-semibold text-accent hover:underline flex items-center gap-1">
                    Try real inbox &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 md:py-24 bg-bg-card border-y border-border-light scroll-mt-16">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-[620px] mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light text-accent text-xs font-semibold rounded-full mb-3">
              <Layers size={13} />
              Core Capabilities
            </div>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-text-primary mb-4">
              Engineered from the protocol up for speed and simplicity.
            </h2>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
              We ditched bloated enterprise features, invasive tracking pixels, and sluggish web wrappers. Broo is pure email focus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: 'Real Custom Inbound SMTP',
                desc: 'Get your own @broo.email handle. Our dedicated SMTP daemon receives mail from Gmail, Outlook, Apple, or custom domains natively.',
                tag: 'Standard RFC SMTP'
              },
              {
                icon: Zap,
                title: 'Instant WebSocket Delivery',
                desc: 'Emails stream to your client the millisecond they pass through our mail pipeline. Zero polling intervals or manual reload delays.',
                tag: '< 50ms Realtime'
              },
              {
                icon: Shield,
                title: 'No Data Mining or Trackers',
                desc: 'We never read your email contents for advertising or sell your information to data aggregators. Your inbox remains strictly yours.',
                tag: 'Private & Secure'
              },
              {
                icon: Paperclip,
                title: '25MB Attachment Vault',
                desc: 'Send and receive high-resolution photos, documents, and spreadsheets with built-in instant previewing and safe downloads.',
                tag: '100MB Free Storage'
              },
              {
                icon: Terminal,
                title: 'Keyboard-First Flow',
                desc: 'Navigate your entire inbox with intuitive single-key shortcuts: C to compose, J/K to browse, S to star, and E to archive/delete.',
                tag: 'Vim-style Speed'
              },
              {
                icon: Smartphone,
                title: 'Ultra Responsive UI',
                desc: 'Designed meticulously for mobile, tablet, and desktop with slide-in drawers, modal composers, and clean reading layouts.',
                tag: 'Zero Overflow'
              }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-bg border border-border hover:border-accent/40 hover:shadow-card transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                        <Icon size={20} />
                      </div>
                      <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider bg-bg-card px-2 py-0.5 rounded border border-border-light">
                        {f.tag}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-base text-text-primary mb-2">
                      {f.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-16 md:py-24 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="text-center max-w-[620px] mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light text-accent text-xs font-semibold rounded-full mb-3">
            <Lock size={13} />
            Why Choose Broo
          </div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-text-primary mb-4">
            How Broo compares to legacy email providers
          </h2>
          <p className="text-text-secondary text-sm sm:text-base">
            See why modern developers and creators are moving their communication to Broo.
          </p>
        </div>

        <div className="bg-bg-card rounded-2xl border border-border shadow-card overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-sidebar">
                <th className="py-4 px-5 font-heading font-semibold text-text-primary">Feature / Capability</th>
                <th className="py-4 px-5 font-heading font-bold text-accent">Broo.email</th>
                <th className="py-4 px-5 font-heading font-medium text-text-tertiary">Big Tech Webmail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {[
                { feature: 'Live Delivery Speed', broo: 'Instant WebSocket push (<50ms)', other: 'Periodic 1-5 minute polling' },
                { feature: 'Inbox Privacy & Ad Tracking', broo: 'Zero ads, zero inbox scanning', other: 'Targeted ads based on email content' },
                { feature: 'User Interface Simplicity', broo: 'Minimalist 3-pane focused flow', other: 'Cluttered with widgets, chats & tabs' },
                { feature: 'Keyboard Shortcut Navigation', broo: 'Full single-key keyboard flow', other: 'Complex combinations or disabled' },
                { feature: 'Attachment Size Limit', broo: '25MB per file with preview', other: 'Often restricted or requires cloud drive links' },
                { feature: 'Free Tier Experience', broo: '100MB storage, zero spam', other: 'Ad banners pinned in inbox tabs' }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-bg-hover/50 transition-colors">
                  <td className="py-3.5 px-5 font-medium text-text-primary">{row.feature}</td>
                  <td className="py-3.5 px-5 font-semibold text-accent flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-accent shrink-0" />
                    <span>{row.broo}</span>
                  </td>
                  <td className="py-3.5 px-5 text-text-tertiary">{row.other}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 bg-bg-card border-t border-border-light scroll-mt-16">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-text-primary mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-text-secondary text-sm">
              Everything you need to know about your new @broo.email address.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-bg overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-text-primary cursor-pointer hover:bg-bg-hover transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-border-light/60 fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-bg to-accent-light/40 border-t border-border-light">
        <div className="max-w-[840px] mx-auto px-4 sm:px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center mx-auto mb-6 shadow-card">
            <Mail size={24} />
          </div>
          <h2 className="font-heading font-bold text-2xl sm:text-4xl md:text-5xl text-text-primary mb-4">
            Claim your @broo.email username now.
          </h2>
          <p className="text-text-secondary text-sm sm:text-base max-w-[520px] mx-auto mb-8">
            Join the public beta and experience a clutter-free inbox that gets out of your way.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold text-base rounded-xl hover:bg-accent-hover shadow-card hover:shadow-elevated transition-all"
            >
              Create Account Free
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-bg-card">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-xs text-text-tertiary">&mdash; Private & Focused Email</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              All Systems Operational
            </span>
            <span>&copy; {new Date().getFullYear()} broo.email</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

