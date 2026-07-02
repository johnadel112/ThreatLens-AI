import { useCallback, useEffect, useState } from 'react';
import { getEvents } from '../api/events';
import { usePolling } from '../hooks/usePolling';
import PageHeader from '../components/ui/PageHeader';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import JsonViewerModal from '../components/ui/JsonViewerModal';
import { Radio } from 'lucide-react';
import SeverityBadge from '../components/ui/SeverityBadge';
import RiskScoreBadge from '../components/ui/RiskScoreBadge';
import MitreTechniqueBadge from '../components/ui/MitreTechniqueBadge';
import toast from 'react-hot-toast';

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
  const [jsonModal, setJsonModal] = useState(null);

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
      const msg = err.response?.data?.error || 'Failed to load events';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  usePolling(fetchEvents, 5000, true);

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
      <PageHeader
        title="Security Events"
        subtitle="Live JSON event stream ingested through the detection pipeline"
        actions={
          <button type="button" onClick={fetchEvents} className="btn-ghost text-sm py-2">
            Refresh
          </button>
        }
      />

      <div className="glass-panel p-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search username, IP, source..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="input-field text-sm py-2"
          />
          <select
            value={filters.eventType}
            onChange={(e) => updateFilter('eventType', e.target.value)}
            className="input-field text-sm py-2"
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
            className="input-field text-sm py-2"
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
            className="input-field text-sm py-2"
          />
          <input
            type="text"
            placeholder="Filter by IP"
            value={filters.ip}
            onChange={(e) => updateFilter('ip', e.target.value)}
            className="input-field text-sm py-2"
          />
        </form>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading && events.length === 0 ? (
        <TableSkeleton rows={8} />
      ) : events.length === 0 ? (
        <EmptyState
          variant="events"
          icon={Radio}
          title="No events yet"
          description="Live monitoring will populate this feed automatically. Events appear within seconds of login."
        />
      ) : (
      <>
      <div className="md:hidden space-y-3">
        {events.map((event) => (
          <div key={event.id} className="glass-panel p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Event Type</p>
                <code className="text-sm text-soc-accent font-mono">{event.eventType}</code>
              </div>
              <SeverityBadge severity={event.severity} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-gray-500">IP</p>
                <p className="text-gray-300 font-mono text-xs">{event.ip || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Source</p>
                <p className="text-gray-300 text-xs">{event.source || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">User</p>
                <p className="text-gray-300 text-xs">{event.username || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Time</p>
                <p className="text-gray-400 text-xs">{formatTimestamp(event.timestamp)}</p>
              </div>
            </div>
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <button
                type="button"
                onClick={() => setJsonModal({ title: `${event.eventType} metadata`, data: event.metadata })}
                className="btn-ghost w-full text-sm py-2.5 min-h-[44px]"
              >
                View JSON
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:block glass-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Username</th>
                <th>IP</th>
                <th>Source</th>
                <th>Severity</th>
                <th>Risk</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                  <tr key={event.id}>
                    <td className="text-gray-300 whitespace-nowrap font-mono text-xs">
                      {formatTimestamp(event.timestamp)}
                    </td>
                    <td>
                      <code className="text-xs text-soc-accent bg-soc-accent/10 px-2 py-0.5 rounded-md font-mono whitespace-nowrap">
                        {event.eventType}
                      </code>
                    </td>
                    <td className="text-gray-300">{event.username || '—'}</td>
                    <td className="text-gray-400 font-mono text-xs whitespace-nowrap">{event.ip || '—'}</td>
                    <td className="text-gray-400">{event.source}</td>
                    <td>
                      <SeverityBadge severity={event.severity} />
                    </td>
                    <td>
                      {event.riskScore != null ? (
                        <RiskScoreBadge score={event.riskScore} showLabel={false} />
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td>
                      {event.metadata && Object.keys(event.metadata).length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setJsonModal({ title: `${event.eventType} metadata`, data: event.metadata })}
                          className="text-xs text-soc-accent hover:underline"
                        >
                          View JSON
                        </button>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && pagination.total > 0 && (
        <div className="px-4 md:px-5 py-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 glass-panel md:border-t-0 md:rounded-none md:mt-0 mt-3 rounded-xl">
          <p className="text-xs text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-2 min-h-[44px] rounded text-xs border border-soc-border text-gray-400 disabled:opacity-40 hover:text-white hover:border-soc-accent/50"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-xs text-gray-500 flex items-center">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-2 min-h-[44px] rounded text-xs border border-soc-border text-gray-400 disabled:opacity-40 hover:text-white hover:border-soc-accent/50"
            >
              Next
            </button>
          </div>
        </div>
      )}
      </>
      )}

      <JsonViewerModal
        open={!!jsonModal}
        title={jsonModal?.title}
        data={jsonModal?.data}
        onClose={() => setJsonModal(null)}
      />
    </div>
  );
}
