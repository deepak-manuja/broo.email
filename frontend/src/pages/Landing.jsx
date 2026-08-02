import { Link } from 'react-router-dom';
import { Sun, Moon, ArrowUpRight } from 'lucide-react';
import Logo from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col">
      {/* Nav — flat, no glass, no blur */}
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
              to="/features"
              className="text-[13px] text-text-secondary hover:text-text-primary transition-colors px-2.5 py-1.5 hidden sm:block"
            >
              About
            </Link>
            <Link
              to="/login"
              className="text-[13px] text-text-secondary hover:text-text-primary transition-colors px-2.5 py-1.5"
            >
              Log in
            </Link>
            <Link
              to="/login?mode=register"
              className="text-[13px] font-medium text-bg bg-accent hover:bg-accent-hover px-3 py-1.5 rounded-md transition-colors ml-1"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — left-aligned on desktop, not centered */}
      <main className="flex-1 flex items-center">
        <div className="max-w-[960px] mx-auto px-5 sm:px-8 w-full py-20 sm:py-28 md:py-36">
          <div className="max-w-[580px]">
            {/* Small tag — not a pill badge */}
            <p className="font-mono text-xs text-pop mb-5 tracking-wide">
              // currently in beta
            </p>

            {/* Headline — opinionated, not generic */}
            <h1 className="font-heading font-bold text-[2.2rem] sm:text-[2.8rem] md:text-[3.4rem] leading-[1.08] tracking-tight text-text-primary mb-6">
              Email that doesn't
              <br className="hidden sm:block" />
              {' '}waste your time.
            </h1>

            {/* Sub — conversational, not marketing speak */}
            <p className="text-[15px] sm:text-base text-text-secondary leading-[1.7] mb-10 max-w-[460px]">
              We run an SMTP server. You get a real{' '}
              <span className="font-mono text-text-primary text-[13px] bg-accent-light px-1.5 py-0.5 rounded">you@broo.email</span>{' '}
              address. Emails arrive instantly via WebSocket — no polling, no refresh, no tracking.
            </p>

            {/* CTA — just one primary, one text link */}
            <div className="flex items-center gap-5">
              <Link
                to="/login?mode=register"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-bg bg-accent hover:bg-accent-hover px-5 py-2.5 rounded-lg transition-colors"
              >
                Grab your address
                <ArrowUpRight size={15} />
              </Link>
              <Link
                to="/features"
                className="text-[13px] text-text-tertiary hover:text-text-primary transition-colors underline underline-offset-4 decoration-border-hover"
              >
                How it works
              </Link>
            </div>
          </div>

          {/* Some quick facts — monospace, not a fancy grid */}
          <div className="mt-20 pt-8 border-t border-border-light grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {[
              { val: '<50ms', label: 'delivery' },
              { val: '25MB', label: 'attachments' },
              { val: '100MB', label: 'free storage' },
              { val: '0', label: 'trackers' },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-mono text-lg sm:text-xl font-medium text-text-primary">{s.val}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer — simple */}
      <footer className="border-t border-border-light py-5 px-5 sm:px-8">
        <div className="max-w-[960px] mx-auto flex items-center justify-between text-xs text-text-tertiary">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <Link to="/features" className="hover:text-text-secondary transition-colors">About</Link>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
