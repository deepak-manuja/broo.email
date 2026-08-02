import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      return toast.error('Please fill in all fields');
    }
    if (password.length < 6) {
      return toast.error('Password needs at least 6 characters');
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), password);
        toast.success('You\'re in!');
      } else {
        await login(email.trim(), password);
        toast.success('Welcome back');
      }
      navigate('/inbox');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = authAPI.googleAuthUrl();
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border-light">
        <div className="max-w-[960px] mx-auto px-5 sm:px-8 h-12 flex items-center justify-between">
          <Link to="/" className="no-underline">
            <Logo size="md" />
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-6">
            <h1 className="font-heading font-bold text-xl tracking-tight text-text-primary mb-1">
              {isRegister ? 'Create an account' : 'Log in'}
            </h1>
            <p className="text-[13px] text-text-secondary">
              {isRegister
                ? 'Pick any email — or register with username@broo.email directly.'
                : 'Enter your credentials to continue.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mb-6 border-b border-border">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`pb-2.5 px-0.5 mr-5 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                !isRegister
                  ? 'border-text-primary text-text-primary'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`pb-2.5 px-0.5 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                isRegister
                  ? 'border-text-primary text-text-primary'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Register
            </button>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-bg-card hover:bg-bg-hover border border-border rounded-lg text-[13px] font-medium text-text-primary transition-colors cursor-pointer mb-5"
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-text-tertiary font-mono">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRegister ? 'you@broo.email' : 'you@example.com'}
                className="w-full px-3 py-2.5 text-[13px] bg-bg-card rounded-lg border border-border text-text-primary placeholder:text-text-subtle focus:border-text-tertiary transition-colors outline-none"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-9 py-2.5 text-[13px] bg-bg-card rounded-lg border border-border text-text-primary placeholder:text-text-subtle focus:border-text-tertiary transition-colors font-mono outline-none"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-bg rounded-lg text-[13px] font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isRegister ? 'Create account' : 'Log in'}
            </button>
          </form>

          <p className="text-center text-[11px] text-text-tertiary mt-6">
            By continuing you agree to our terms.
          </p>
        </div>
      </main>
    </div>
  );
}
