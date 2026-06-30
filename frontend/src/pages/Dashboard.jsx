import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import RoleBadge from '../components/ui/RoleBadge';
import client from '../api/client';

function StatusCard({ label, status, detail }) {
  const isOk = status === 'ok' || status === 'connected';
  return (
    <div className="bg-soc-surface border border-soc-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span
          className={`w-2 h-2 rounded-full ${isOk ? 'bg-soc-success' : 'bg-soc-critical'}`}
        />
      </div>
      <p className="text-lg font-semibold text-white capitalize">{status}</p>
      {detail && <p className="text-xs text-gray-500 mt-1">{detail}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [backend, setBackend] = useState(null);
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkServices() {
      try {
        const { data } = await client.get('/health');
        setBackend(data);
      } catch {
        setBackend({ status: 'unreachable' });
      }

      try {
        const res = await fetch('http://localhost:8000/health');
        setAi(await res.json());
      } catch {
        setAi({ status: 'unreachable' });
      }

      setLoading(false);
    }

    checkServices();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400 mt-1">
          Welcome back, {user?.name}. Event ingestion is live — view raw logs on the Events page.
        </p>
      </div>

      <div className="bg-soc-surface border border-soc-border rounded-xl p-5 mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Signed in as</p>
          <p className="text-lg font-semibold text-white">{user?.email}</p>
        </div>
        <RoleBadge role={user?.role} />
      </div>

      {loading ? (
        <p className="text-gray-500">Checking services...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatusCard label="Frontend" status="ok" detail="React + Vite + Tailwind" />
          <StatusCard
            label="Backend API"
            status={backend?.status || 'unknown'}
            detail={backend?.database ? `DB: ${backend.database}` : backend?.service}
          />
          <StatusCard
            label="AI Service"
            status={ai?.status || 'unknown'}
            detail={ai?.service}
          />
        </div>
      )}

      <div className="bg-soc-surface border border-soc-border rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Coming in Week 5+</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '✓ Event Ingestion', done: true },
            { label: '✓ Event Simulator', done: true },
            { label: '✓ Detection Engine', done: true },
            { label: '✓ Incident Management', done: true },
            { label: '✓ Basic AI Integration', done: true },
          ].map(({ label, done }) => (
            <div
              key={label}
              className={`px-3 py-2 rounded-lg text-xs text-center ${
                done
                  ? 'bg-soc-success/10 text-soc-success border border-soc-success/20'
                  : 'bg-white/5 text-gray-500'
              }`}
            >
              {label}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-4">
          Run <code className="text-soc-accent">npm run attack</code> in the simulator, then check the Alerts page.
        </p>
      </div>
    </div>
  );
}
