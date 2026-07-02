import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield } from 'lucide-react';
import {
  approvePlaybookAction,
  executePlaybookAction,
  getPlaybookQueue,
  rejectPlaybookAction,
} from '../api/playbooks';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import { PERMISSIONS } from '../utils/permissions';

export default function PlaybookQueue() {
  const { can } = useAuth();
  const canApprove = can(PERMISSIONS.PLAYBOOKS_APPROVE);
  const canExecute = can(PERMISSIONS.PLAYBOOKS_EXECUTE);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPlaybookQueue(statusFilter || undefined);
      setActions(data.actions || []);
    } catch {
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  async function handleApprove(actionId) {
    try {
      await approvePlaybookAction(actionId);
      toast.success('Action approved');
      await fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    }
  }

  async function handleReject(actionId) {
    try {
      await rejectPlaybookAction(actionId);
      toast.success('Action rejected');
      await fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    }
  }

  async function handleExecute(actionId) {
    try {
      await executePlaybookAction(actionId);
      toast.success('Action executed (simulated)');
      await fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to execute');
    }
  }

  return (
    <div>
      <PageHeader
        title="SOAR Playbook Queue"
        subtitle="Cross-incident playbook actions awaiting analyst approval"
        icon={Shield}
      />

      <div className="mb-4 flex gap-2">
        {['pending', 'approved', 'executed', ''].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs border capitalize ${statusFilter === s ? 'border-soc-accent text-soc-accent bg-soc-accent/10' : 'border-soc-border text-gray-400'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {!canApprove && (
        <p className="text-xs text-amber-300/90 mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          SOAR approvals and execution require an admin account. Analysts can view recommended actions and request playbooks from case pages.
        </p>
      )}

      <GlassCard>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : actions.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Queue empty"
            description="Playbook actions from AI investigations and response templates appear here for approval."
          />
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
              <div key={action.id} className="p-4 rounded-xl border border-white/[0.06] bg-black/20">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-white capitalize">{action.actionType?.replace(/_/g, ' ')}</span>
                  {action.templateName && (
                    <span className="text-[10px] text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded">
                      {action.templateName} · Step {action.stepOrder}
                    </span>
                  )}
                  <Link to={`/incidents/${action.incidentId}?tab=playbook`} className="text-xs text-soc-accent hover:underline ml-auto">
                    View incident →
                  </Link>
                </div>
                <p className="text-sm text-gray-400 mb-3">{action.description}</p>
                {action.status === 'pending' && (
                  <span className="text-[10px] text-amber-300/80 border border-amber-500/20 px-2 py-0.5 rounded">
                    Requires admin approval
                  </span>
                )}
                {canApprove && action.status === 'pending' && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleApprove(action.id)} className="btn-primary text-xs py-1.5">Approve</button>
                    <button type="button" onClick={() => handleReject(action.id)} className="btn-ghost text-xs py-1.5">Reject</button>
                  </div>
                )}
                {canExecute && action.status === 'approved' && (
                  <button type="button" onClick={() => handleExecute(action.id)} className="btn-primary text-xs py-1.5">Execute</button>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
