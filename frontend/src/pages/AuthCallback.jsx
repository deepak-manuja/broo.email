import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { handleOAuthToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleOAuthToken(token).then(() => navigate('/inbox'));
    } else {
      navigate('/login?error=auth_failed');
    }
  }, [searchParams, handleOAuthToken, navigate]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center fade-in">
        <Loader2 size={28} className="animate-spin text-accent mx-auto mb-3" />
        <p className="text-sm text-text-secondary">Signing you in…</p>
      </div>
    </div>
  );
}
