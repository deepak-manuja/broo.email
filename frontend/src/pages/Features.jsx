import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Zap,
  Shield,
  Paperclip,
  Terminal,
  Smartphone,
  Lock,
  CheckCircle2,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { useState } from 'react';
import Logo from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';

const FEATURES = [
  {
    icon: Globe,
    title: 'Real Inbound SMTP',
    desc: 'Your own @broo.email address. Our SMTP server receives mail from Gmail, Outlook, iCloud — anywhere.',
    tag: 'RFC-compliant'
  },
  {
    icon: Zap,
    title: 'Instant Delivery',
    desc: 'WebSocket push delivers emails the moment they arrive. No polling. No delays.',
    tag: '< 50ms'
  },
  {
    icon: Shield,
    title: 'Zero Trackers',
    desc: 'We never scan, read, or sell your email data. No ads. No surveillance.',
    tag: 'Private'
  },
  {
    icon: Paperclip,
    title: 'File Attachments',
    desc: 'Send and receive files up to 25MB. PDFs, images, docs — with instant previews.',
    tag: '25MB limit'
  },
  {
    icon: Terminal,
    title: 'Keyboard-First',
    desc: 'Navigate everything with single keys. C to compose, J/K to browse, S to star.',
    tag: 'Shortcuts'
  },
  {
    icon: Smartphone,
    title: 'Responsive UI',
    desc: 'Works beautifully on phone, tablet, and desktop. Clean layouts everywhere.',
    tag: 'All devices'
  }
];

const COMPARISONS = [
  { feature: 'Delivery speed', broo: 'Instant WebSocket push', other: '1-5 minute polling' },
  { feature: 'Privacy', broo: 'Zero inbox scanning', other: 'Content-based ads' },
  { feature: 'Interface', broo: 'Clean 3-pane focus', other: 'Cluttered with widgets' },
  { feature: 'Keyboard shortcuts', broo: 'Full single-key flow', other: 'Complex combos' },
  { feature: 'Attachments', broo: '25MB with preview', other: 'Cloud link required' },
  { feature: 'Free tier', broo: '100MB, zero ads', other: 'Ad banners in inbox' }
];

const FAQS = [
  {
    q: 'How does @broo.email work?',
    a: 'You claim a username and get a real email address. Our custom SMTP server receives emails from any provider and delivers them to your inbox in real time.'
  },
  {
    q: 'Is it really free?',
    a: 'Yes. During public beta you get a free address, 100MB storage, and full access to all features. No credit card needed.'
  },
  {
    q: 'How fast is delivery?',
    a: 'Sub-second. WebSocket connections push emails to your client the instant they clear our mail pipeline.'
  },
  {
    q: 'What file types can I attach?',
    a: 'PDFs, images, documents, spreadsheets, and archives up to 25MB per file.'
  },
  {
    q: 'Do you sell my data?',
    a: 'Never. Broo is privacy-first. No ads, no tracking pixels, no data mining.'
  }
];

export default function Features() {
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState(-1);

  return (
    <div className="min-h-screen bg-bg text-text-primary font-body">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass border-b border-border-light">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="no-underline">
              <Logo size="md" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover px-4 py-2 rounded-lg shadow-soft transition-all"
            >
              Get Started
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Back nav */}
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 pt-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors">
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </div>

      {/* Features Grid */}
      <section className="py-12 md:py-20">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8">
          <div className="max-w-[560px] mb-12">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-text-primary mb-3 tracking-tight">
              Built for speed and simplicity.
            </h1>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
              No bloat. No enterprise fluff. Just the core features that make email work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-xl bg-bg-card border border-border hover:border-accent/30 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider bg-bg px-2 py-0.5 rounded border border-border-light">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-sm text-text-primary mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-12 md:py-20 bg-bg-card border-y border-border-light">
        <div className="max-w-[900px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light text-accent text-xs font-semibold rounded-full mb-3">
              <Lock size={12} />
              Comparison
            </div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl md:text-3xl text-text-primary mb-2">
              Broo vs legacy email
            </h2>
            <p className="text-text-secondary text-sm">
              See why people switch.
            </p>
          </div>

          <div className="rounded-xl border border-border overflow-hidden bg-bg">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-sidebar">
                  <th className="py-3 px-4 font-semibold text-text-primary">Feature</th>
                  <th className="py-3 px-4 font-bold text-accent">Broo</th>
                  <th className="py-3 px-4 font-medium text-text-tertiary">Others</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {COMPARISONS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-bg-hover/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-text-primary">{row.feature}</td>
                    <td className="py-3 px-4 text-accent font-medium">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="shrink-0" />
                        {row.broo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-tertiary">{row.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-20">
        <div className="max-w-[700px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-xl sm:text-2xl md:text-3xl text-text-primary mb-2">
              Questions?
            </h2>
            <p className="text-text-secondary text-sm">Quick answers about broo.email.</p>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="rounded-lg border border-border bg-bg-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-text-primary cursor-pointer hover:bg-bg-hover transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-text-tertiary transition-transform duration-200 shrink-0 ml-3 ${isOpen ? 'rotate-180 text-accent' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-0 text-xs text-text-secondary leading-relaxed border-t border-border-light fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 border-t border-border-light">
        <div className="max-w-[600px] mx-auto px-5 sm:px-8 text-center">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text-primary mb-3">
            Ready to try?
          </h2>
          <p className="text-text-secondary text-sm mb-8">
            Grab your @broo.email address and start using a cleaner inbox today.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent text-white font-semibold text-base rounded-xl hover:bg-accent-hover shadow-card hover:shadow-elevated transition-all"
          >
            Create free account
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light py-6 px-5 sm:px-8">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-tertiary">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              All systems operational
            </span>
            <span>&copy; {new Date().getFullYear()} broo.email</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
