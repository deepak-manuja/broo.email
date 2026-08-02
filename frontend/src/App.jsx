import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/useAuth';
import Landing from './pages/Landing';
import Features from './pages/Features';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Inbox from './pages/Inbox';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/inbox" replace /> : children;
}

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: theme === 'dark' ? '#1E1E1C' : '#1A1A18',
          color: '#EDEDEB',
          fontSize: '13px',
          fontFamily: "'DM Sans', sans-serif",
          borderRadius: '10px',
          padding: '10px 16px',
          border: theme === 'dark' ? '1px solid #2A2A28' : 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        },
        success: { iconTheme: { primary: '#22C55E', secondary: '#EDEDEB' } },
        error: { iconTheme: { primary: '#EF4444', secondary: '#EDEDEB' } },
      }}
    />
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/features" element={<Features />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <ThemedToaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
