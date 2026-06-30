import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-soc-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-soc-accent/20 items-center justify-center mb-4">
            <svg className="w-7 h-7 text-soc-accent" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">ThreatLens AI</h1>
          <p className="text-gray-400 mt-1">Sign in to the SOC platform</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-soc-surface border border-soc-border rounded-xl p-6 space-y-4"
        >
          {error && (
            <div className="px-3 py-2 rounded-lg bg-soc-critical/10 border border-soc-critical/30 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white placeholder-gray-600 focus:outline-none focus:border-soc-accent"
              placeholder="analyst@threatlens.local"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-400 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white placeholder-gray-600 focus:outline-none focus:border-soc-accent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-soc-accent text-soc-bg font-medium hover:bg-soc-accent/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          No account?{' '}
          <Link to="/register" className="text-soc-accent hover:underline">
            Register
          </Link>
        </p>

        <div className="mt-6 p-4 rounded-lg bg-white/5 border border-soc-border">
          <p className="text-xs text-gray-500 mb-2">Demo accounts (run npm run seed in backend):</p>
          <div className="text-xs text-gray-400 space-y-1 font-mono">
            <p>admin@threatlens.local / Admin123!</p>
            <p>analyst@threatlens.local / Analyst123!</p>
            <p>viewer@threatlens.local / Viewer123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
