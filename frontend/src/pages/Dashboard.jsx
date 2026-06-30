import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../api/dashboard';
import client from '../api/client';
import RoleBadge from '../components/ui/RoleBadge';
import {
  EventTimelineChart,
  EventTypeChart,
  KpiGrid,
  SeverityCharts,
  StatusPieCharts,
} from '../components/dashboard/DashboardCharts';

function ServiceStatus({ backend, ai }) {
  const items = [
    { label: 'Backend', status: backend?.status, detail: backend?.database },
    { label: 'AI Service', status: ai?.status, detail: ai?.llmEnabled ? 'LLM enabled' : 'Fallback mode' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => {
        const ok = item.status === 'ok';
        return (
          <div key={item.label} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-soc-bg border border-soc-border">
            <span className={`w-2 h-2 rounded-full ${ok ? 'bg-soc-success' : 'bg-soc-critical'}`} />
            <div>
              <p className="text-sm text-white">{item.label}</p>
              <p className="text-xs text-gray-500 capitalize">{item.detail || item.status}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [backend, setBackend] = useState(null);
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [dashboardStats, healthRes] = await Promise.all([
          getDashboardStats(),
          client.get('/health'),
        ]);
        setStats(dashboardStats);
        setBackend(healthRes.data);

        try {
          const res = await fetch('http://localhost:8000/health');
          setAi(await res.json());
        } catch {
          setAi({ status: 'unreachable' });
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">SOC Dashboard</h2>
          <p className="text-gray-400 mt-1">
            Welcome back, {user?.name}. Real-time overview of events, alerts, and incidents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RoleBadge role={user?.role} />
          <Link
            to="/reports"
            className="px-4 py-2 rounded-lg text-sm bg-soc-accent/10 border border-soc-accent/30 text-soc-accent hover:bg-soc-accent/20"
          >
            View Reports
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-soc-critical/10 border border-soc-critical/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading dashboard...</p>
      ) : (
        <div className="space-y-6">
          <KpiGrid stats={stats} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <EventTimelineChart timeline={stats?.events?.timeline} />
            <div className="bg-soc-surface border border-soc-border rounded-xl p-5">
              <h3 className="text-sm font-medium text-gray-300 mb-4">System Health</h3>
              <ServiceStatus backend={backend} ai={ai} />
              <p className="text-xs text-gray-600 mt-4">
                Generate traffic with{' '}
                <code className="text-soc-accent">npm run attack</code> in the simulator folder.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SeverityCharts alerts={stats?.alerts} incidents={stats?.incidents} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <StatusPieCharts alerts={stats?.alerts} incidents={stats?.incidents} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <EventTypeChart events={stats?.events} />
          </div>
        </div>
      )}
    </div>
  );
}
