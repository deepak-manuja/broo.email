import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Eye, EyeOff, ArrowLeft, Shield, Sun, Moon } from 'lucide-react';
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
      return toast.error('Please fill in all required fields');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), password);
        toast.success('Account created successfully!');
      } else {
        await login(email.trim(), password);
        toast.success('Welcome back!');
      }
      navigate('/inbox');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = authAPI.googleAuthUrl();
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 font-body">
      {/* Top Header */}
      <div className="max-w-[1100px] w-full flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={14} />
          <span>Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/">
            <Logo size="sm" />
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[420px] w-full my-8 fade-in self-center">
        <div className="bg-bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-card">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-text-primary mb-1">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary">
              {isRegister
                ? 'Claim your @broo.email address'
                : 'Sign in to your inbox'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-bg-sidebar border border-border-light rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-bg-card text-text-primary shadow-soft'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isRegister
                  ? 'bg-bg-card text-text-primary shadow-soft'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Register
            </button>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-bg hover:bg-bg-hover border border-border hover:border-border-hover rounded-xl text-xs sm:text-sm font-semibold text-text-primary transition-all shadow-soft cursor-pointer active:scale-[0.99] mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border-light" />
            <span className="text-[11px] text-text-tertiary font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border-light" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRegister ? 'username@broo.email' : 'you@example.com'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-bg rounded-xl border border-border text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-bg-card transition-all outline-none"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-bg rounded-xl border border-border text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-bg-card transition-all font-mono outline-none"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-accent-hover shadow-soft transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
            </button>
          </form>

          {/* Security note */}
          <div className="mt-5 pt-4 border-t border-border-light text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-text-tertiary">
              <Shield size={12} className="text-success" />
              <span>Encrypted sessions &middot; Secure passwords</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-text-tertiary mt-5">
          By continuing, you agree to our{' '}
          <span className="underline underline-offset-2 hover:text-text-secondary cursor-pointer">Terms</span> and{' '}
          <span className="underline underline-offset-2 hover:text-text-secondary cursor-pointer">Privacy Policy</span>.
        </p>
      </div>

      {/* Bottom */}
      <div className="text-center text-xs text-text-tertiary pb-2">
        &copy; {new Date().getFullYear()} broo.email
      </div>
    </div>
  );
}
