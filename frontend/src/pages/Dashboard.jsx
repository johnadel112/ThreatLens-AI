import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Bell, FolderKanban, Shield, FileText, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../api/dashboard';
import { getEvents } from '../api/events';
import { getIncidents } from '../api/incidents';
import client from '../api/client';
import { usePolling } from '../hooks/usePolling';
import PageHeader from '../components/ui/PageHeader';
import LivePulseIndicator from '../components/ui/LivePulseIndicator';
import ThreatLevelIndicator, { computeThreatLevel } from '../components/ui/ThreatLevelIndicator';
import StatCard from '../components/ui/StatCard';
import GlassCard from '../components/ui/GlassCard';
import { DashboardSkeleton } from '../components/ui/LoadingSkeleton';
import LazyThreatGlobe from '../components/three/LazyThreatGlobe';
import LiveEventFeed, { EventTicker } from '../components/dashboard/LiveEventFeed';
import RecentIncidentsPanel from '../components/dashboard/RecentIncidentsPanel';
import PipelineVisualization from '../components/dashboard/PipelineVisualization';
import {
  EventVolumeHourlyChart,
  EventTimelineChart,
  EventTypeChart,
  SeverityCharts,
  StatusPieCharts,
} from '../components/dashboard/DashboardCharts';

function ServiceStatus({ backend, ai }) {
  const items = [
    { label: 'Backend API', status: backend?.status, detail: backend?.database },
    { label: 'AI Service', status: ai?.status, detail: ai?.llmEnabled ? 'LLM enabled' : 'Fallback mode' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => {
        const ok = item.status === 'ok';
        return (
          <div key={item.label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/20 border border-white/[0.06]">
            <span className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-400'}`} />
            <div>
              <p className="text-sm text-white font-medium">{item.label}</p>
              <p className="text-xs text-gray-500 capitalize">{item.detail || item.status}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { user, liveMonitoring } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [backend, setBackend] = useState(null);
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const prevEventCountRef = useRef(0);

  const loadDashboard = useCallback(async () => {
    try {
      const [dashboardStats, healthRes, eventsRes, incidentsRes] = await Promise.all([
        getDashboardStats(),
        client.get('/health'),
        getEvents({ limit: 100 }),
        getIncidents({ limit: 5 }),
      ]);

      const newCount = dashboardStats?.events?.total ?? 0;
      if (prevEventCountRef.current > 0 && newCount > prevEventCountRef.current) {
        toast.success(`${newCount - prevEventCountRef.current} new event(s) detected`, { duration: 2500, icon: '⚡' });
      }
      prevEventCountRef.current = newCount;

      setStats(dashboardStats);
      setRecentEvents(eventsRes.events || []);
      setRecentIncidents(incidentsRes.incidents || []);
      setBackend(healthRes.data);

      try {
        const { data } = await client.get('/health/ai');
        setAi(data);
      } catch {
        setAi({ status: 'unreachable' });
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(loadDashboard, 5000, true);

  const threatScore = computeThreatLevel(stats);
  const criticalCount =
    stats?.incidents?.bySeverity?.find((s) => s.severity === 'critical')?.count || 0;

  return (
    <div>
      <PageHeader
        title="SOC Command Center"
        subtitle={`Welcome back, ${user?.name}. Real-time threat intelligence for your security operations.`}
        actions={
          <>
            <LivePulseIndicator active={liveMonitoring} label="Live SOC Monitoring" />
            <Link to="/reports" className="btn-ghost text-sm py-2">
              <FileText className="w-4 h-4" />
              Reports
            </Link>
          </>
        }
      />

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <EventTicker events={recentEvents.slice(0, 6)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Security Events"
              value={stats?.events?.total ?? 0}
              sub="Ingested for your workspace"
              icon={Activity}
              accent="cyan"
              delay={0}
            />
            <StatCard
              label="Open Alerts"
              value={stats?.alerts?.openCount ?? 0}
              sub={`${stats?.alerts?.total ?? 0} total alerts`}
              icon={Bell}
              accent="amber"
              delay={0.05}
            />
            <StatCard
              label="Active Incidents"
              value={stats?.incidents?.openCount ?? 0}
              sub={`${criticalCount} critical severity`}
              icon={FolderKanban}
              accent="red"
              delay={0.1}
            />
            <StatCard
              label="Playbook Queue"
              value={stats?.playbooks?.pendingCount ?? 0}
              sub={`${stats?.playbooks?.executedCount ?? 0} executed`}
              icon={Shield}
              accent="purple"
              delay={0.15}
            />
          </div>

          <GlassCard padding={false} className="p-4">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-medium">Security Pipeline</p>
            <PipelineVisualization active={liveMonitoring} />
          </GlassCard>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <EventVolumeHourlyChart
                events={recentEvents}
                hourlyTimeline={stats?.events?.hourlyTimeline}
              />
              <EventTimelineChart timeline={stats?.events?.timeline} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SeverityCharts alerts={stats?.alerts} incidents={stats?.incidents} />
              </div>
            </div>

            <div className="space-y-6">
              <ThreatLevelIndicator score={threatScore} />
              <LazyThreatGlobe className="h-[280px]" recentEvent={recentEvents[0]} />
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-soc-accent" />
                    Live Event Feed
                  </h3>
                  <Link to="/events" className="text-xs text-soc-accent hover:underline">View all</Link>
                </div>
                <LiveEventFeed events={recentEvents} />
              </GlassCard>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Recent Incidents</h3>
                <Link to="/incidents" className="text-xs text-soc-accent hover:underline">View all</Link>
              </div>
              <RecentIncidentsPanel incidents={recentIncidents} />
            </GlassCard>

            <GlassCard>
              <h3 className="text-sm font-semibold text-white mb-4">System Health</h3>
              <ServiceStatus backend={backend} ai={ai} />
              <p className="text-xs text-gray-600 mt-4 leading-relaxed">
                Events generate automatically in the background. Detection rules, incident grouping, and AI investigation run on your isolated workspace data.
              </p>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <StatusPieCharts alerts={stats?.alerts} incidents={stats?.incidents} />
          </div>

          <EventTypeChart events={stats?.events} />
        </div>
      )}
    </div>
  );
}
