import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Bell, FolderKanban, Shield, FileText, Zap, Radio,
} from 'lucide-react';
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
import DashboardSection from '../components/ui/DashboardSection';
import { DashboardSkeleton } from '../components/ui/LoadingSkeleton';
import LazyThreatGlobe from '../components/three/LazyThreatGlobe';
import LiveEventFeed, { EventTicker } from '../components/dashboard/LiveEventFeed';
import RecentIncidentsPanel from '../components/dashboard/RecentIncidentsPanel';
import PipelineVisualization from '../components/dashboard/PipelineVisualization';
import IntelligenceOverview from '../components/dashboard/IntelligenceOverview';
import AIBriefingPanel from '../components/dashboard/AIBriefingPanel';
import SoarQueuePanel from '../components/dashboard/SoarQueuePanel';
import {
  formatCompactNumber,
  formatLastUpdated,
  computeHourlyTrend,
  formatSeverityLine,
} from '../utils/dashboardMetrics';
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
          <div key={item.label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/20 border border-white/[0.06] min-h-[56px]">
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
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [dashboardStats, healthRes, eventsRes, incidentsRes] = await Promise.all([
        getDashboardStats(),
        client.get('/health'),
        getEvents({ limit: 30 }),
        getIncidents({ limit: 5 }),
      ]);

      setStats(dashboardStats);
      setRecentEvents(eventsRes.events || []);
      setRecentIncidents(incidentsRes.incidents || []);
      setBackend(healthRes.data);
      setLastUpdated(new Date());

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
  const eventTrend = computeHourlyTrend(stats?.events?.lastHour, stats?.events?.previousHour);

  const statCards = (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        label="Ingested Events"
        value={formatCompactNumber(stats?.events?.total ?? 0)}
        sub={`+${stats?.events?.lastHour ?? 0} in the last hour`}
        trend={eventTrend}
        icon={Activity}
        accent="cyan"
        delay={0}
        href="/events"
      />
      <StatCard
        label="Unresolved Alerts"
        value={formatCompactNumber(stats?.alerts?.openCount ?? 0)}
        breakdown={formatSeverityLine(stats?.alerts?.openBySeverity, ['critical', 'high'])}
        severityBreakdown={stats?.alerts?.openBySeverity}
        icon={Bell}
        accent="amber"
        delay={0.05}
        href="/alerts"
      />
      <StatCard
        label="Active Cases"
        value={formatCompactNumber(stats?.incidents?.openCount ?? 0)}
        sub={`${stats?.operations?.casesNeedingAction ?? 0} need analyst action`}
        severityBreakdown={stats?.incidents?.openBySeverity}
        icon={FolderKanban}
        accent="red"
        delay={0.1}
        href="/incidents"
      />
      <StatCard
        label="SOAR Actions"
        value={formatCompactNumber(stats?.playbooks?.pendingCount ?? 0)}
        sub={`${stats?.playbooks?.pendingCount ?? 0} awaiting approval`}
        trend={{
          label: `${stats?.playbooks?.executedCount ?? 0} executed total`,
          direction: 'flat',
        }}
        icon={Shield}
        accent="purple"
        delay={0.15}
        href="/playbooks"
      />
    </div>
  );

  const threatCard = <ThreatLevelIndicator score={threatScore} stats={stats} />;

  const liveFeedCard = (
    <GlassCard>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-soc-accent" />
          Live Event Feed
        </h3>
        <Link to="/events" className="text-xs text-soc-accent hover:underline min-h-[44px] inline-flex items-center">
          View all
        </Link>
      </div>
      <LiveEventFeed events={recentEvents} />
    </GlassCard>
  );

  const casesPanel = (
    <GlassCard>
      <div className="flex items-center justify-between mb-2 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Active Cases</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Grouped security incidents requiring investigation</p>
        </div>
        <Link to="/incidents" className="text-xs text-soc-accent hover:underline min-h-[44px] inline-flex items-center">
          View all
        </Link>
      </div>
      <RecentIncidentsPanel incidents={recentIncidents} />
    </GlassCard>
  );

  const pipelineSection = (
    <DashboardSection title="Security Pipeline" subtitle="Live processing stages across your SOC workflow">
      <GlassCard padding={false} className="p-4 sm:p-5">
        <PipelineVisualization active={liveMonitoring} pipeline={stats?.pipeline} />
      </GlassCard>
    </DashboardSection>
  );

  const chartsSection = (
    <div className="space-y-4 sm:space-y-6">
      <EventVolumeHourlyChart hourlyTimeline={stats?.events?.hourlyTimeline} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <EventTimelineChart timeline={stats?.events?.timeline} />
        <SeverityCharts alerts={stats?.alerts} incidents={stats?.incidents} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <StatusPieCharts alerts={stats?.alerts} incidents={stats?.incidents} />
        <EventTypeChart events={stats?.events} />
      </div>
    </div>
  );

  const intelligenceSection = (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
      <GlassCard>
        <h3 className="text-sm font-semibold text-white mb-4">Top Risky Cases</h3>
        <IntelligenceOverview incidents={stats?.intelligence?.topRiskyIncidents || []} />
      </GlassCard>
      <GlassCard>
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Radio className="w-4 h-4 text-soc-accent" />
          Top Suspicious IPs (24h)
        </h3>
        <div className="space-y-2">
          {(stats?.intelligence?.topSuspiciousIps || []).length === 0 ? (
            <p className="text-sm text-gray-500">No suspicious IP activity in the last 24 hours.</p>
          ) : (
            stats.intelligence.topSuspiciousIps.map((row) => (
              <div key={row.ip} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/[0.06]">
                <code className="text-xs text-soc-accent font-mono">{row.ip}</code>
                <span className="text-xs text-gray-500">{row.count} events</span>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="SOC Command Center"
        subtitle={`Welcome back, ${user?.name}. Cases are grouped security incidents requiring investigation.`}
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <LivePulseIndicator active={liveMonitoring} />
            <Link to="/reports" className="btn-ghost text-sm py-2 min-h-[44px]">
              <FileText className="w-4 h-4" />
              Reports
            </Link>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
        <p>{liveMonitoring ? 'Live telemetry streaming' : 'Live monitoring inactive'}</p>
        <p>{formatLastUpdated(lastUpdated)}</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <EventTicker events={recentEvents} />

          {/* Mobile-first order */}
          <div className="lg:hidden space-y-6">
            {threatCard}
            {statCards}
            {liveFeedCard}
            {casesPanel}
            <SoarQueuePanel pending={stats?.playbooks?.pendingCount} executed={stats?.playbooks?.executedCount} />
            <AIBriefingPanel stats={stats} threatScore={threatScore} />
            <EventVolumeHourlyChart hourlyTimeline={stats?.events?.hourlyTimeline} />
            {pipelineSection}
            {chartsSection}
            {intelligenceSection}
            <GlassCard>
              <h3 className="text-sm font-semibold text-white mb-4">System Health</h3>
              <ServiceStatus backend={backend} ai={ai} />
            </GlassCard>
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:block space-y-8">
            {statCards}
            {pipelineSection}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <EventVolumeHourlyChart hourlyTimeline={stats?.events?.hourlyTimeline} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <EventTimelineChart timeline={stats?.events?.timeline} />
                  <SeverityCharts alerts={stats?.alerts} incidents={stats?.incidents} />
                </div>
              </div>

              <div className="space-y-6">
                {threatCard}
                <LazyThreatGlobe className="h-[280px]" recentEvent={recentEvents[0]} />
                {liveFeedCard}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {casesPanel}
              <SoarQueuePanel pending={stats?.playbooks?.pendingCount} executed={stats?.playbooks?.executedCount} />
              <AIBriefingPanel stats={stats} threatScore={threatScore} />
            </div>

            {intelligenceSection}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <StatusPieCharts alerts={stats?.alerts} incidents={stats?.incidents} />
              <EventTypeChart events={stats?.events} />
            </div>

            <GlassCard>
              <h3 className="text-sm font-semibold text-white mb-4">System Health</h3>
              <ServiceStatus backend={backend} ai={ai} />
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
