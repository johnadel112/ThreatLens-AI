import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScrollText } from 'lucide-react';
import { getAuditLogs } from '../api/audit';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';

const ACTION_LABELS = {
  playbook_created: 'Playbook Created',
  playbook_approved: 'Playbook Approved',
  playbook_rejected: 'Playbook Rejected',
  playbook_executed: 'Playbook Executed',
  playbook_template_run: 'Playbook Template Run',
  incident_created: 'Incident Created',
  incident_status_changed: 'Status Changed',
  incident_assigned: 'Incident Assigned',
  incident_priority_changed: 'Priority Changed',
  case_note_added: 'Case Note Added',
  case_task_added: 'Case Task Added',
  case_task_updated: 'Case Task Updated',
  rule_enabled: 'Rule Enabled',
  rule_disabled: 'Rule Disabled',
  rule_updated: 'Rule Updated',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (actionFilter) params.action = actionFilter;
      const data = await getAuditLogs(params);
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Platform-wide security operations audit trail"
        icon={ScrollText}
      />

      <div className="mb-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-soc-bg border border-soc-border text-white text-sm"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-soc-critical/10 border border-soc-critical/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <GlassCard padding={false}>
        {loading ? (
          <div className="p-5"><TableSkeleton rows={6} /></div>
        ) : logs.length === 0 ? (
          <EmptyState variant="audit" icon={ScrollText} title="No audit entries" description="Actions across incidents, playbooks, and rules will appear here." />
        ) : (
        <>
          <div className="md:hidden space-y-3 p-4">
            {logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-soc-accent">{ACTION_LABELS[log.action] || log.action}</p>
                  <p className="text-[10px] text-gray-500 font-mono shrink-0">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-xs text-gray-300">{log.userName || log.userEmail || '—'}</p>
                <p className="text-xs text-gray-500 capitalize">{log.entityType?.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-400">
                  {log.incidentId && (
                    <Link to={`/incidents/${log.incidentId}`} className="text-soc-accent hover:underline mr-2">
                      View case
                    </Link>
                  )}
                  {log.details?.caseNumber && <span>#{log.details.caseNumber} </span>}
                  {log.details?.preview || log.details?.title || log.details?.actionType || '—'}
                </p>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-gray-400 font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="text-xs text-soc-accent">{ACTION_LABELS[log.action] || log.action}</td>
                    <td className="text-xs text-gray-300">{log.userName || log.userEmail || '—'}</td>
                    <td className="text-xs text-gray-400 capitalize">{log.entityType?.replace(/_/g, ' ')}</td>
                    <td className="text-xs text-gray-500 max-w-xs truncate">
                      {log.incidentId && (
                        <Link to={`/incidents/${log.incidentId}`} className="text-soc-accent hover:underline mr-2">
                          View case
                        </Link>
                      )}
                      {log.details?.caseNumber && <span>#{log.details.caseNumber} </span>}
                      {log.details?.preview || log.details?.title || log.details?.actionType || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}
      </GlassCard>
    </div>
  );
}
