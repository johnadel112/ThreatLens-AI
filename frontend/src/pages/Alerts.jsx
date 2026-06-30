import { useCallback, useEffect, useState } from 'react';
import { getAlerts, updateAlertStatus } from '../api/alerts';
import { useAuth } from '../context/AuthContext';
import { usePolling } from '../hooks/usePolling';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import SeverityBadge from '../components/ui/SeverityBadge';
import StatusBadge from '../components/ui/StatusBadge';

const SEVERITIES = ['', 'low', 'medium', 'high', 'critical'];
const STATUSES = ['', 'open', 'acknowledged', 'resolved', 'false_positive'];

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function EvidencePanel({ evidence, onClose }) {
  if (!evidence) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-soc-surface border border-soc-border rounded-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Alert Evidence</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-300 mb-4">{evidence.summary}</p>
        {evidence.metrics && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Metrics</p>
            <pre className="p-3 rounded-lg bg-soc-bg border border-soc-border text-xs text-gray-400 overflow-x-auto">
              {JSON.stringify(evidence.metrics, null, 2)}
            </pre>
          </div>
        )}
        {evidence.eventIds?.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">
              Related events ({evidence.eventIds.length})
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {evidence.eventIds.map((id) => (
                <code key={id} className="block text-xs text-soc-accent font-mono">
                  {id}
                </code>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Alerts() {
  const { hasRole } = useAuth();
  const canUpdate = hasRole('admin', 'analyst');

  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', severity: '', status: '' });
  const [page, setPage] = useState(1);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        limit: 20,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      };
      const data = await getAlerts(params);
      setAlerts(data.alerts);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  usePolling(fetchAlerts, 5000, true);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleStatusChange(alertId, status) {
    setUpdatingId(alertId);
    try {
      await updateAlertStatus(alertId, status);
      toast.success(status === 'resolved' ? 'Alert resolved' : 'Alert acknowledged');
      await fetchAlerts();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update alert status';
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Security Alerts"
        subtitle="Rule-based detections from your live event pipeline"
        actions={
          <button type="button" onClick={fetchAlerts} className="btn-ghost text-sm py-2">
            Refresh
          </button>
        }
      />

      <div className="bg-soc-surface border border-soc-border rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Search title, username, IP..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-soc-accent"
        />
        <select
          value={filters.severity}
          onChange={(e) => updateFilter('severity', e.target.value)}
          className="px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white text-sm focus:outline-none focus:border-soc-accent"
        >
          {SEVERITIES.map((s) => (
            <option key={s || 'all'} value={s}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All severities'}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white text-sm focus:outline-none focus:border-soc-accent"
        >
          {STATUSES.map((s) => (
            <option key={s || 'all'} value={s}>
              {s ? s.replace(/_/g, ' ') : 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-soc-critical/10 border border-soc-critical/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading && alerts.length === 0 ? (
          <TableSkeleton rows={4} />
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No alerts yet"
            description="Live monitoring will create alerts when detection rules trigger on your event stream."
          />
        ) : (
          alerts.map((alert) => {
            const isUrgent = alert.severity === 'critical' || alert.severity === 'high';
            return (
            <div
              key={alert.id}
              className={`glass-panel p-5 transition-colors ${
                isUrgent ? 'border-red-500/20 bg-red-500/[0.02]' : 'hover:border-soc-accent/20'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{alert.title}</h3>
                    <SeverityBadge severity={alert.severity} />
                    <StatusBadge status={alert.status} />
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{alert.evidence?.summary}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Rule: <code className="text-gray-400">{alert.ruleId}</code></span>
                    {alert.username && <span>User: {alert.username}</span>}
                    {alert.ip && <span>IP: <code>{alert.ip}</code></span>}
                    <span>{formatTime(alert.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEvidence(alert.evidence)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-soc-border text-gray-300 hover:text-white hover:border-soc-accent/50"
                  >
                    View Evidence
                  </button>
                  {canUpdate && alert.status === 'open' && (
                    <button
                      type="button"
                      disabled={updatingId === alert.id}
                      onClick={() => handleStatusChange(alert.id, 'acknowledged')}
                      className="px-3 py-1.5 rounded-lg text-xs bg-soc-warning/10 border border-soc-warning/30 text-amber-300 hover:bg-soc-warning/20 disabled:opacity-50"
                    >
                      Acknowledge
                    </button>
                  )}
                  {canUpdate && alert.status !== 'resolved' && (
                    <button
                      type="button"
                      disabled={updatingId === alert.id}
                      onClick={() => handleStatusChange(alert.id, 'resolved')}
                      className="px-3 py-1.5 rounded-lg text-xs bg-soc-success/10 border border-soc-success/30 text-emerald-300 hover:bg-soc-success/20 disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>

      {!loading && pagination.total > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {pagination.total} alert{pagination.total !== 1 ? 's' : ''} total
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded text-xs border border-soc-border text-gray-400 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-xs text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded text-xs border border-soc-border text-gray-400 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedEvidence && (
        <EvidencePanel
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}
    </div>
  );
}
