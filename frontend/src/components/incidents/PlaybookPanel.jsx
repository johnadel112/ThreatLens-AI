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
  high: 'text-red-300',
  medium: 'text-amber-300',
  low: 'text-gray-400',
};

function PlaybookStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${
        statusStyles[status] || statusStyles.pending
      }`}
    >
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function PlaybookPanel({
  actions = [],
  auditLogs = [],
  canEdit = false,
  onApprove,
  onReject,
  onExecute,
  loading = false,
}) {
  if (loading) {
    return <p className="text-xs text-gray-500">Loading playbook actions...</p>;
  }

  if (actions.length === 0) {
    return (
      <p className="text-xs text-gray-600">
        No playbook actions yet. Run an AI investigation to generate mitigation recommendations.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {actions.map((action) => (
        <div key={action.id} className="p-4 rounded-lg bg-soc-bg border border-soc-border">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-medium text-white">
              {ACTION_LABELS[action.actionType] || action.actionType}
            </span>
            <PlaybookStatusBadge status={action.status} />
            <span className={`text-xs capitalize ${priorityStyles[action.priority] || priorityStyles.medium}`}>
              {action.priority} priority
            </span>
          </div>

          <p className="text-sm text-gray-300">{action.description}</p>
          {action.justification && (
            <p className="text-xs text-gray-500 mt-1">{action.justification}</p>
          )}

          {(action.target?.username || action.target?.ip) && (
            <p className="text-xs text-gray-500 mt-2 font-mono">
              Target: {action.target.username || '—'} / {action.target.ip || '—'}
            </p>
          )}

          {action.executionResult?.message && (
            <p className="text-xs text-soc-success mt-2">{action.executionResult.message}</p>
          )}

          {canEdit && (
            <div className="flex flex-wrap gap-2 mt-3">
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
                    className="px-3 py-1.5 rounded-lg text-xs border border-soc-border text-gray-400 hover:text-white"
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
        <div className="pt-2 border-t border-soc-border">
          <p className="text-xs font-medium text-gray-500 mb-2">Audit Trail</p>
          <div className="space-y-2">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="text-xs text-gray-500">
                <span className="text-gray-400">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
                {' — '}
                <span className="capitalize">{log.action.replace(/_/g, ' ')}</span>
                {log.userName && <span> by {log.userName}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
