import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter';
import RoleSelector from '../components/auth/RoleSelector';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'analyst' });
  const [showPassword, setShowPassword] = useState(false);
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
      toast.success('Registration successful — live monitoring starting');
      navigate('/', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.details) {
        setFieldErrors(data.details);
      } else {
        const msg = data?.error || 'Registration failed. Please try again.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Join the ThreatLens AI security operations platform">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-300">
            {error}
          </div>
        )}

        {fieldErrors.length > 0 && (
          <div className="px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-sm text-amber-200 space-y-1">
            {fieldErrors.map((fe) => (
              <p key={fe.field}>{fe.message}</p>
            ))}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm text-gray-400 mb-1.5">Full Name</label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm text-gray-400 mb-1.5">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="input-field"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-gray-400 mb-1.5">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="input-field pr-12"
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-500 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrengthMeter
            password={form.password}
            email={form.email}
            name={form.name}
          />
          {!form.password && (
            <p className="text-xs text-gray-600 mt-2">
              Min 8 characters with at least one letter and one number.
            </p>
          )}
        </div>

        <RoleSelector value={form.role} onChange={(role) => updateField('role', role)} />

        <button type="submit" disabled={submitting} className="btn-primary w-full min-h-[48px]">
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-soc-accent hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
