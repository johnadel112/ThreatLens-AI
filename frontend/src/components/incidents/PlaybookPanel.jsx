import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Shield, XCircle } from 'lucide-react';
import { TableSkeleton } from '../ui/LoadingSkeleton';
import EmptyState from '../ui/EmptyState';

const ACTION_LABELS = {
  lock_account: 'Lock Account',
  block_ip: 'Block IP',
  force_password_reset: 'Force Password Reset',
  isolate_host: 'Isolate Host',
  notify_user: 'Notify User',
  escalate: 'Escalate',
};

const statusStyles = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  rejected: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  executed: 'bg-soc-success/20 text-emerald-300 border-soc-success/30',
  failed: 'bg-soc-critical/20 text-red-300 border-soc-critical/30',
};

const priorityStyles = {
  high: 'bg-red-500/15 text-red-300 border-red-500/25',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  low: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
};

function PlaybookStatusBadge({ status }) {
  const icons = {
    pending: Clock,
    approved: CheckCircle2,
    rejected: XCircle,
    executed: Shield,
    failed: XCircle,
  };
  const Icon = icons[status] || Clock;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${
        statusStyles[status] || statusStyles.pending
      }`}
    >
      <Icon className="w-3 h-3" />
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function PlaybookPanel({
  actions = [],
  auditLogs = [],
  incidentId,
  canEdit = false,
  onApprove,
  onReject,
  onExecute,
  loading = false,
}) {
  if (loading) {
    return <TableSkeleton rows={3} />;
  }

  if (actions.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="No playbook actions"
        description="Run an AI investigation to generate mitigation recommendations. Actions require analyst approval before simulated execution."
      />
    );
  }

  return (
    <div className="space-y-4">
      {actions.map((action) => (
        <div
          key={action.id}
          className={`p-4 rounded-xl border transition-colors ${
            action.status === 'pending'
              ? 'bg-amber-500/[0.03] border-amber-500/20'
              : action.status === 'executed'
                ? 'bg-emerald-500/[0.03] border-emerald-500/20'
                : 'bg-black/20 border-white/[0.06]'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-white">
              {ACTION_LABELS[action.actionType] || action.actionType}
            </span>
            <PlaybookStatusBadge status={action.status} />
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                priorityStyles[action.priority] || priorityStyles.medium
              }`}
            >
              {action.priority} priority
            </span>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed">{action.description}</p>
          {action.justification && (
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              <span className="text-gray-400">Reason:</span> {action.justification}
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
            {(action.target?.username || action.target?.ip) && (
              <span>
                Target: <code className="text-gray-400">{action.target.username || '—'}</code>
                {action.target.ip && <> / <code className="text-gray-400">{action.target.ip}</code></>}
              </span>
            )}
            {incidentId && (
              <Link to={`/incidents/${incidentId}`} className="text-soc-accent hover:underline">
                Linked incident
              </Link>
            )}
            {action.approvedBy?.name && (
              <span>Approved by {action.approvedBy.name}</span>
            )}
            {action.executedAt && (
              <span>Executed {new Date(action.executedAt).toLocaleString()}</span>
            )}
          </div>

          {action.executionResult?.message && (
            <p className="text-xs text-emerald-300/90 mt-2 flex items-start gap-1.5">
              <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {action.executionResult.message} <span className="text-gray-600">(simulated)</span>
            </p>
          )}

          {canEdit && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/[0.06]">
              {action.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => onApprove(action.id)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-soc-accent/10 border border-soc-accent/30 text-soc-accent hover:bg-soc-accent/20"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(action.id)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-soc-border text-gray-400 hover:text-white hover:border-red-500/30"
                  >
                    Reject
                  </button>
                </>
              )}
              {action.status === 'approved' && (
                <button
                  type="button"
                  onClick={() => onExecute(action.id)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-soc-success/10 border border-soc-success/30 text-soc-success hover:bg-soc-success/20"
                >
                  Execute (Simulated)
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {auditLogs.length > 0 && (
        <div className="pt-2 border-t border-white/[0.06]">
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Audit Trail</p>
          <div className="space-y-2">
            {auditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="text-xs text-gray-500 flex flex-wrap gap-x-2">
                <span className="text-gray-400 font-mono">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
                <span className="capitalize">{log.action.replace(/_/g, ' ')}</span>
                {log.userName && <span className="text-gray-600">by {log.userName}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
