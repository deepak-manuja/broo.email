import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useState } from 'react';
import Logo from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';

const WHAT = [
  {
    title: 'Real SMTP server',
    body: 'Not a forwarding alias. We actually run an SMTP daemon on port 25 that speaks the protocol. When someone sends to you@broo.email, our server receives it directly — like Gmail or Proton do.',
  },
  {
    title: 'WebSocket delivery',
    body: 'Most webmail clients poll every 1-5 minutes. We push emails to your browser the instant they clear the pipeline. Under 50ms from SMTP receipt to screen.',
  },
  {
    title: 'No tracking, no scanning',
    body: 'We don\'t read your emails for ad targeting. We don\'t inject tracking pixels. We don\'t sell your contact graph. The business model is simple: a good product people want to use.',
  },
  {
    title: 'Attachments up to 25MB',
    body: 'PDFs, images, docs, archives. Stored on our servers with per-user quotas. 100MB free during beta. You can preview and download inline — no cloud drive redirect.',
  },
  {
    title: 'Keyboard shortcuts',
    body: 'C to compose, J/K to navigate, S to star, E to trash. The inbox is navigable without touching the mouse. If you used Vim or Superhuman, this will feel familiar.',
  },
  {
    title: 'Works on everything',
    body: 'Desktop 3-pane layout. Mobile slide-in drawers. Tablet responsive breakpoints. One codebase, tested across Chrome, Firefox, Safari, and mobile browsers.',
  },
];

const VS = [
  ['Delivery', 'WebSocket push (<50ms)', 'Polling (1-5 min delay)'],
  ['Privacy', 'Zero scanning or ads', 'Content-based ad targeting'],
  ['UI', '3-pane, keyboard-first', 'Tabs, widgets, chat sidebars'],
  ['Shortcuts', 'Single-key navigation', 'Limited or complex combos'],
  ['Attachments', '25MB inline', 'Cloud drive redirect'],
  ['Free tier', '100MB, no ads', 'Ad banners in inbox'],
];

const FAQS = [
  {
    q: 'Can people actually email me at @broo.email?',
    a: 'Yes. It\'s a real email address. Anyone on Gmail, Outlook, Yahoo, iCloud, or any other email client can send to your @broo.email handle and it arrives instantly.',
  },
  {
    q: 'What does "beta" mean here?',
    a: 'The core product works — sending, receiving, attachments, real-time delivery. Beta means we\'re still adding features (custom domains, filters, mobile app) and might have rough edges. Your emails won\'t disappear.',
  },
  {
    q: 'Is there a catch with the free tier?',
    a: 'No. 100MB storage, full features, no ads. We might introduce paid plans later for custom domains and more storage, but the free tier stays.',
  },
  {
    q: 'Can I use this as my main email?',
    a: 'You can, but we\'d say use it alongside your existing email for now. Forward important things to broo, or give it out selectively. Once we\'re out of beta, go all in.',
  },
  {
    q: 'Who built this?',
    a: 'Deepak. It\'s a solo project. The SMTP server, API, frontend — all built from scratch. Not a white-label, not a fork.',
  },
];

export default function Features() {
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState(-1);

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      {/* Nav */}
      <header className="border-b border-border-light">
        <div className="max-w-[960px] mx-auto px-5 sm:px-8 h-12 flex items-center justify-between">
          <Link to="/" className="no-underline">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link
              to="/login"
              className="text-[13px] font-medium text-bg bg-accent hover:bg-accent-hover px-3 py-1.5 rounded-md transition-colors ml-1"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[960px] mx-auto px-5 sm:px-8">
        {/* Back */}
        <div className="pt-6 pb-2">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-text-primary transition-colors">
            <ArrowLeft size={12} />
            Home
          </Link>
        </div>

        {/* Intro */}
        <section className="py-12 sm:py-16 border-b border-border-light">
          <p className="font-mono text-xs text-pop mb-4 tracking-wide">// what & why</p>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl md:text-[2.2rem] tracking-tight text-text-primary mb-4 leading-tight max-w-[500px]">
            How broo.email actually works.
          </h1>
          <p className="text-sm text-text-secondary leading-[1.7] max-w-[480px]">
            Not another email wrapper. We wrote the SMTP server, the API,
            the real-time layer, and the client. Here's what you get.
          </p>
        </section>

        {/* Features — simple numbered list, not a card grid */}
        <section className="py-10 sm:py-14">
          <div className="space-y-0">
            {WHAT.map((item, i) => (
              <div
                key={i}
                className="py-6 border-b border-border-light grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-8"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-text-tertiary">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="font-heading font-semibold text-sm text-text-primary">{item.title}</h3>
                </div>
                <p className="text-[13px] text-text-secondary leading-[1.7]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison — clean table, no icons */}
        <section className="py-10 sm:py-14 border-t border-border-light">
          <p className="font-mono text-xs text-pop mb-4 tracking-wide">// vs the rest</p>
          <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-text-primary mb-8">
            Quick comparison.
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4 font-mono text-xs text-text-tertiary font-normal w-[140px]">Feature</th>
                  <th className="pb-3 px-4 font-mono text-xs text-pop font-normal">broo.email</th>
                  <th className="pb-3 pl-4 font-mono text-xs text-text-tertiary font-normal">Big Tech webmail</th>
                </tr>
              </thead>
              <tbody>
                {VS.map(([feature, broo, other], i) => (
                  <tr key={i} className="border-b border-border-light">
                    <td className="py-3 pr-4 text-text-primary font-medium">{feature}</td>
                    <td className="py-3 px-4 text-text-primary">{broo}</td>
                    <td className="py-3 pl-4 text-text-tertiary">{other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ — accordion */}
        <section className="py-10 sm:py-14 border-t border-border-light">
          <p className="font-mono text-xs text-pop mb-4 tracking-wide">// faq</p>
          <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-text-primary mb-8">
            Common questions.
          </h2>

          <div className="space-y-0">
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className="border-b border-border-light">
                  <button
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    className="w-full flex items-center justify-between py-4 text-left text-[13px] sm:text-sm font-medium text-text-primary cursor-pointer hover:text-pop transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={14}
                      className={`text-text-tertiary shrink-0 ml-4 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {open && (
                    <p className="pb-4 text-[13px] text-text-secondary leading-[1.7] fade-in">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-14 sm:py-20 border-t border-border-light">
          <div className="max-w-[400px]">
            <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-text-primary mb-3">
              Want to try it?
            </h2>
            <p className="text-sm text-text-secondary mb-6 leading-[1.7]">
              Pick a username, set a password, start receiving emails. Takes about 30 seconds.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-bg bg-accent hover:bg-accent-hover px-4 py-2.5 rounded-lg transition-colors"
            >
              Create an account
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border-light py-5 px-5 sm:px-8">
        <div className="max-w-[960px] mx-auto flex items-center justify-between text-xs text-text-tertiary">
          <Logo size="sm" />
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
