import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors([]);
    setSubmitting(true);

    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.details) {
        setFieldErrors(data.details);
      } else {
        setError(data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-soc-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-1">Join the ThreatLens SOC platform</p>
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

          {fieldErrors.length > 0 && (
            <div className="px-3 py-2 rounded-lg bg-soc-warning/10 border border-soc-warning/30 text-sm text-amber-200 space-y-1">
              {fieldErrors.map((fe) => (
                <p key={fe.field}>{fe.message}</p>
              ))}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm text-gray-400 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white focus:outline-none focus:border-soc-accent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white focus:outline-none focus:border-soc-accent"
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
              minLength={8}
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white focus:outline-none focus:border-soc-accent"
            />
            <p className="text-xs text-gray-500 mt-1">Min 8 chars, include a letter and number</p>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm text-gray-400 mb-1">
              Role
            </label>
            <select
              id="role"
              value={form.role}
              onChange={(e) => updateField('role', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white focus:outline-none focus:border-soc-accent"
            >
              <option value="viewer">Viewer — read-only access</option>
              <option value="analyst">Analyst — investigate incidents</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-soc-accent text-soc-bg font-medium hover:bg-soc-accent/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-soc-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
