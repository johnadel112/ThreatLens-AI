import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'analyst' });
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
      <form onSubmit={handleSubmit} className="space-y-4">
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
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-gray-400 mb-1.5">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            className="input-field"
          />
          <p className="text-xs text-gray-600 mt-1.5">Min 8 characters, include a letter and number</p>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm text-gray-400 mb-1.5">Role</label>
          <select
            id="role"
            value={form.role}
            onChange={(e) => updateField('role', e.target.value)}
            className="input-field"
          >
            <option value="analyst">Analyst — investigate incidents & approve actions</option>
            <option value="admin">Admin — full SOC platform access</option>
          </select>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
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
