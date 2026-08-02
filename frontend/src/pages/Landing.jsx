import { Link } from 'react-router-dom';
import { ArrowRight, Sun, Moon } from 'lucide-react';
import Logo from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg text-text-primary font-body flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass border-b border-border-light">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="no-underline">
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <Link
              to="/features"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors hidden sm:block px-3 py-1.5"
            >
              Features
            </Link>

            <Link
              to="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover px-4 py-2 rounded-lg shadow-soft transition-all duration-150 hover:shadow-card hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[680px] text-center py-16 sm:py-24 md:py-32 relative z-10">
          {/* Tagline chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-light border border-accent/15 text-accent text-xs font-semibold rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Now in public beta
          </div>

          {/* Headline */}
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl md:text-[3.5rem] leading-[1.1] tracking-tight text-text-primary mb-5">
            Your email,
            <br />
            without the noise.
          </h1>

          {/* Sub */}
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-[520px] mx-auto mb-10">
            Claim your <strong className="text-text-primary font-semibold">@broo.email</strong> address.
            Real SMTP. Instant delivery. Zero trackers. Just email.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-accent text-white font-semibold text-base rounded-xl hover:bg-accent-hover shadow-card hover:shadow-elevated transition-all duration-200 hover:-translate-y-0.5"
            >
              Create your inbox
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-bg-card border border-border hover:border-border-hover text-text-primary font-medium text-base rounded-xl hover:bg-bg-hover transition-all shadow-soft"
            >
              See how it works
            </Link>
          </div>

          {/* Trust line */}
          <p className="mt-10 text-xs text-text-tertiary">
            Free forever during beta · No credit card · 100MB storage included
          </p>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-border-light py-6 px-5 sm:px-8">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-tertiary">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/features" className="hover:text-text-secondary transition-colors">Features</Link>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              All systems operational
            </span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
