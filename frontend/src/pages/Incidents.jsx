import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents } from '../api/incidents';
import SeverityBadge from '../components/ui/SeverityBadge';

const SEVERITIES = ['', 'low', 'medium', 'high', 'critical'];
const STATUSES = ['', 'new', 'investigating', 'contained', 'resolved', 'closed'];

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function IncidentStatusBadge({ status }) {
  const styles = {
    new: 'bg-soc-critical/20 text-red-300 border-soc-critical/30',
    investigating: 'bg-soc-accent/20 text-soc-accent border-soc-accent/30',
    contained: 'bg-soc-warning/20 text-amber-300 border-soc-warning/30',
    resolved: 'bg-soc-success/20 text-emerald-300 border-soc-success/30',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${styles[status] || styles.new}`}
    >
      {status}
    </span>
  );
}

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', severity: '', status: '' });
  const [page, setPage] = useState(1);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        limit: 20,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      };
      const data = await getIncidents(params);
      setIncidents(data.incidents);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Incidents</h2>
          <p className="text-gray-400 mt-1">
            Related alerts grouped into investigation cases
          </p>
        </div>
        <button
          type="button"
          onClick={fetchIncidents}
          className="px-4 py-2 rounded-lg bg-soc-surface border border-soc-border text-sm text-gray-300 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

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
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-soc-critical/10 border border-soc-critical/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading incidents...</p>
      ) : incidents.length === 0 ? (
        <div className="bg-soc-surface border border-soc-border rounded-xl p-8 text-center">
          <p className="text-gray-400">No incidents yet.</p>
          <p className="text-sm text-gray-600 mt-2">
            Run the attack simulator to generate alerts that group into incidents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              to={`/incidents/${incident.id}`}
              className="bg-soc-surface border border-soc-border rounded-xl p-5 hover:border-soc-accent/40 transition-colors block"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-semibold text-white">{incident.title}</h3>
                <SeverityBadge severity={incident.severity} />
                <IncidentStatusBadge status={incident.status} />
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                {incident.username && <span>User: {incident.username}</span>}
                {incident.ip && <span>IP: <code>{incident.ip}</code></span>}
                <span>{incident.alertCount || incident.alerts?.length || 0} alerts</span>
                <span>{formatTime(incident.createdAt)}</span>
              </div>
              {incident.assignedAnalyst && (
                <p className="text-xs text-gray-400">
                  Assigned: {incident.assignedAnalyst.name}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {!loading && pagination.total > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {pagination.total} incident{pagination.total !== 1 ? 's' : ''} total
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
    </div>
  );
}
