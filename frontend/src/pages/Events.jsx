import { useCallback, useEffect, useState } from 'react';
import { getEvents } from '../api/events';
import SeverityBadge from '../components/ui/SeverityBadge';

const EVENT_TYPES = [
  '',
  'login_failed',
  'login_success',
  'file_download',
  'network_access',
  'permission_change',
  'logout',
  'file_upload',
  'admin_action',
];

const SEVERITIES = ['', 'low', 'medium', 'high', 'critical'];

function formatTimestamp(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function MetadataCell({ metadata }) {
  const [open, setOpen] = useState(false);
  const text = JSON.stringify(metadata || {}, null, 2);

  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-gray-600">—</span>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs text-soc-accent hover:underline"
      >
        {open ? 'Hide' : 'View JSON'}
      </button>
      {open && (
        <pre className="mt-2 p-2 rounded bg-soc-bg border border-soc-border text-xs text-gray-400 overflow-x-auto max-w-xs">
          {text}
        </pre>
      )}
    </div>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    eventType: '',
    severity: '',
    username: '',
    ip: '',
  });
  const [page, setPage] = useState(1);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        limit: 20,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      };
      const data = await getEvents(params);
      setEvents(data.events);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Security Events</h2>
          <p className="text-gray-400 mt-1">
            Raw event logs ingested through the API pipeline
          </p>
        </div>
        <button
          type="button"
          onClick={fetchEvents}
          className="px-4 py-2 rounded-lg bg-soc-surface border border-soc-border text-sm text-gray-300 hover:text-white hover:border-soc-accent/50 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-soc-surface border border-soc-border rounded-xl p-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search username, IP, source..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-soc-accent"
          />
          <select
            value={filters.eventType}
            onChange={(e) => updateFilter('eventType', e.target.value)}
            className="px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white text-sm focus:outline-none focus:border-soc-accent"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t || 'all'} value={t}>
                {t ? t.replace(/_/g, ' ') : 'All event types'}
              </option>
            ))}
          </select>
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
          <input
            type="text"
            placeholder="Filter by username"
            value={filters.username}
            onChange={(e) => updateFilter('username', e.target.value)}
            className="px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-soc-accent"
          />
          <input
            type="text"
            placeholder="Filter by IP"
            value={filters.ip}
            onChange={(e) => updateFilter('ip', e.target.value)}
            className="px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-soc-accent"
          />
        </form>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-soc-critical/10 border border-soc-critical/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-soc-surface border border-soc-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-soc-border text-left text-gray-400">
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Event Type</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No events found. Events will appear here once ingested via POST /api/events.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-soc-border/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {formatTimestamp(event.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-soc-accent bg-soc-accent/10 px-1.5 py-0.5 rounded">
                        {event.eventType}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{event.username || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{event.ip || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{event.source}</td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={event.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <MetadataCell metadata={event.metadata} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && pagination.total > 0 && (
          <div className="px-4 py-3 border-t border-soc-border flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded text-xs border border-soc-border text-gray-400 disabled:opacity-40 hover:text-white hover:border-soc-accent/50"
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
                className="px-3 py-1 rounded text-xs border border-soc-border text-gray-400 disabled:opacity-40 hover:text-white hover:border-soc-accent/50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
