import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Invalid username or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-eaw-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="eaw-card">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-eaw-primary text-white mb-3">
              <Shield size={28} />
            </div>
            <h1 className="text-xl font-bold text-eaw-font">
              Compliance Tracker Lite
            </h1>
            <p className="text-sm text-eaw-muted mt-1">
              CMMC / NIST 800-171 Assessment Tool
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 mb-4 text-sm bg-red-50 text-red-700 border border-red-200 rounded">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-eaw-font mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-eaw-font mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-eaw-border-light">
            <p className="text-xs text-eaw-muted text-center">
              Demo credentials:{' '}
              <span className="font-medium text-eaw-font">admin</span> /{' '}
              <span className="font-medium text-eaw-font">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
