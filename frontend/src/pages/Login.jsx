import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Loader2, Eye, EyeOff, Sun, Moon, Camera, X, Check, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialRegister = searchParams.get('mode') === 'register' || searchParams.get('register') === 'true';
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [useCustomDomain, setUseCustomDomain] = useState(false); // false = username@broo.email, true = custom email
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Compress & convert avatar image to base64 data URL
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Avatar file must be under 5MB');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatar(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleUsernameChange = (e) => {
    // Sanitize handle
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    setUsername(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegister) {
      const cleanUsername = username.trim();
      const cleanCustomEmail = customEmail.trim();

      if (!cleanUsername && !cleanCustomEmail) {
        return toast.error('Please choose your email handle or email address');
      }

      if (!password.trim()) {
        return toast.error('Please enter a password');
      }

      if (password.length < 6) {
        return toast.error('Password needs at least 6 characters');
      }

      setLoading(true);
      try {
        await register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: cleanUsername || undefined,
          email: useCustomDomain ? cleanCustomEmail : `${cleanUsername}@broo.email`,
          password,
          avatar
        });
        toast.success('Welcome to broo.email! 🚀');
        navigate('/inbox');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Registration failed. Try a different handle.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!loginIdentifier.trim() || !password.trim()) {
        return toast.error('Please enter your email/handle and password');
      }

      setLoading(true);
      try {
        await login(loginIdentifier.trim(), password);
        toast.success('Welcome back');
        navigate('/inbox');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Invalid credentials');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogle = () => {
    window.location.href = authAPI.googleAuthUrl();
  };

  const initialLetter = (firstName.trim().charAt(0) || username.trim().charAt(0) || 'U').toUpperCase();

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b border-border-light">
        <div className="max-w-[960px] mx-auto px-5 sm:px-8 h-12 flex items-center justify-between">
          <Link to="/" className="no-underline">
            <Logo size="md" />
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-5">
            <h1 className="font-heading font-bold text-xl tracking-tight text-text-primary mb-1">
              {isRegister ? 'Claim your @broo.email' : 'Log in to your inbox'}
            </h1>
            <p className="text-xs text-text-secondary">
              {isRegister
                ? 'Create your developer email handle in seconds. Free forever.'
                : 'Enter your email handle and password to continue.'}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-0 mb-5 border-b border-border">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`pb-2.5 px-0.5 mr-5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
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
              className={`pb-2.5 px-0.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                isRegister
                  ? 'border-text-primary text-text-primary'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Register
            </button>
          </div>

          {/* Google Sign-in */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-card hover:bg-bg-hover border border-border rounded-lg text-xs font-medium text-text-primary transition-colors cursor-pointer mb-4"
          >
            <svg width="15" height="15" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-text-tertiary font-mono">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister ? (
              <>
                {/* Avatar / PFP Section */}
                <div className="flex items-center gap-3.5 p-3 rounded-lg bg-bg-card border border-border">
                  <div className="relative group shrink-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Avatar preview"
                        className="w-12 h-12 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-bg border border-border flex items-center justify-center font-mono font-bold text-sm text-text-secondary">
                        {initialLetter}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Upload profile picture"
                    >
                      <Camera size={14} />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-text-primary">
                        Profile Picture
                      </label>
                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar('')}
                          className="text-[10px] text-text-tertiary hover:text-danger flex items-center gap-0.5 cursor-pointer"
                        >
                          <X size={10} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                      Optional image for your avatar
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 text-[11px] font-mono text-pop hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Upload photo</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>

                {/* First & Last Name */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-mono text-text-secondary mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Alex"
                      className="w-full px-3 py-2 text-xs bg-bg-card rounded-md border border-border text-text-primary placeholder:text-text-subtle focus:border-text-tertiary transition-colors outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-text-secondary mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Rivera"
                      className="w-full px-3 py-2 text-xs bg-bg-card rounded-md border border-border text-text-primary placeholder:text-text-subtle focus:border-text-tertiary transition-colors outline-none"
                    />
                  </div>
                </div>

                {/* Email Handle Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-text-secondary">
                      {useCustomDomain ? 'Email Address' : 'Choose Your Handle'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseCustomDomain(!useCustomDomain)}
                      className="text-[10px] text-text-tertiary hover:text-text-primary font-mono transition-colors cursor-pointer"
                    >
                      {useCustomDomain ? 'Use @broo.email handle' : 'Use external email'}
                    </button>
                  </div>

                  {useCustomDomain ? (
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-3 py-2 text-xs bg-bg-card rounded-md border border-border text-text-primary placeholder:text-text-subtle focus:border-text-tertiary transition-colors outline-none"
                      required
                    />
                  ) : (
                    <div className="flex items-center rounded-md border border-border bg-bg-card focus-within:border-text-tertiary transition-colors overflow-hidden">
                      <input
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                        placeholder="yourname"
                        className="flex-1 px-3 py-2 text-xs bg-transparent text-text-primary placeholder:text-text-subtle font-mono outline-none min-w-0"
                        required
                      />
                      <span className="px-2.5 py-2 text-xs font-mono bg-bg text-text-secondary border-l border-border select-none shrink-0">
                        @broo.email
                      </span>
                    </div>
                  )}

                  {!useCustomDomain && username && (
                    <p className="text-[10px] text-text-tertiary font-mono mt-1 flex items-center gap-1">
                      <Check size={11} className="text-pop" />
                      <span>Address: <strong className="text-text-primary">{username}@broo.email</strong></span>
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-mono text-text-secondary mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full pl-3 pr-8 py-2 text-xs bg-bg-card rounded-md border border-border text-text-primary placeholder:text-text-subtle focus:border-text-tertiary transition-colors font-mono outline-none"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Login Identifier (Email or username) */}
                <div>
                  <label className="block text-[11px] font-mono text-text-secondary mb-1">
                    Email or Handle
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="handle or you@broo.email"
                    className="w-full px-3 py-2 text-xs bg-bg-card rounded-md border border-border text-text-primary placeholder:text-text-subtle focus:border-text-tertiary transition-colors font-mono outline-none"
                    autoComplete="username"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-mono text-text-secondary mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-8 py-2 text-xs bg-bg-card rounded-md border border-border text-text-primary placeholder:text-text-subtle focus:border-text-tertiary transition-colors font-mono outline-none"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-bg rounded-md text-xs font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              <span>{isRegister ? 'Claim Handle & Enter Inbox' : 'Log in'}</span>
            </button>
          </form>

          {/* Footer note */}
          <div className="text-center text-[10px] text-text-tertiary mt-5 font-mono">
            {isRegister ? (
              <span className="flex items-center justify-center gap-1">
                <Sparkles size={11} className="text-pop" />
                Includes welcome guide from creator & 100MB storage
              </span>
            ) : (
              <span>Developer-focused • Zero tracking</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
