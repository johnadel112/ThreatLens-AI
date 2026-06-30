import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getIncident, getAgentOutputs, updateIncident, investigateIncident } from '../api/incidents';
import { getPlaybookActions, approvePlaybookAction, rejectPlaybookAction, executePlaybookAction, getAuditLog } from '../api/playbooks';
import { useAuth } from '../context/AuthContext';
import { usePolling } from '../hooks/usePolling';
import Timeline from '../components/incidents/Timeline';
import AgentActivityPanel from '../components/incidents/AgentActivityPanel';
import AISummaryPanel from '../components/incidents/AISummaryPanel';
import PlaybookPanel from '../components/incidents/PlaybookPanel';
import SeverityBadge from '../components/ui/SeverityBadge';
import StatusBadge from '../components/ui/StatusBadge';

const INCIDENT_STATUSES = ['new', 'investigating', 'contained', 'resolved', 'closed'];

export default function IncidentDetail() {
  const { id } = useParams();
  const { user, hasRole } = useAuth();
  const canEdit = hasRole('admin', 'analyst');

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [playbookActions, setPlaybookActions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [playbooksLoading, setPlaybooksLoading] = useState(true);

  const fetchIncident = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getIncident(id);
      setIncident(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load incident');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  const fetchPlaybooks = useCallback(async () => {
    try {
      const [playbookData, auditData] = await Promise.all([
        getPlaybookActions(id),
        getAuditLog(id),
      ]);
      setPlaybookActions(playbookData.actions || []);
      setAuditLogs(auditData.logs || []);
    } catch {
      // ignore — playbooks optional until investigation
    } finally {
      setPlaybooksLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaybooks();
  }, [fetchPlaybooks]);

  const pollAgents = useCallback(async () => {
    if (incident?.investigationStatus !== 'running' && !investigating) return;
    try {
      const data = await getAgentOutputs(id);
      setIncident((prev) => prev ? { ...prev, agentOutputs: data.agentOutputs } : prev);
    } catch {
      // ignore poll errors
    }
  }, [id, incident?.investigationStatus, investigating]);

  usePolling(pollAgents, 2000, incident?.investigationStatus === 'running' || investigating);

  async function handleStatusChange(status) {
    try {
      const updated = await updateIncident(id, { status });
      setIncident((prev) => ({ ...prev, ...updated, alerts: prev.alerts, events: prev.events, agentOutputs: prev.agentOutputs }));
      setActionMsg(`Status updated to ${status}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  }

  async function handleAssignToMe() {
    try {
      const updated = await updateIncident(id, { assignedAnalystId: user.id });
      setIncident((prev) => ({ ...prev, ...updated, alerts: prev.alerts, events: prev.events, agentOutputs: prev.agentOutputs }));
      setActionMsg('Incident assigned to you');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign incident');
    }
  }

  async function handleInvestigate() {
    setInvestigating(true);
    setError('');
    setActionMsg('');

    try {
      const data = await investigateIncident(id);
      setIncident(data.incident);
      setActionMsg(
        `Multi-agent investigation complete — ${data.agentOutputs?.length || 6} agents (${data.aiSource === 'openai' ? 'LLM' : 'evidence-based'})`
      );
      await fetchPlaybooks();
      await fetchIncident();
    } catch (err) {
      setError(err.response?.data?.error || 'AI investigation failed. Is the AI service running?');
      await fetchIncident();
    } finally {
      setInvestigating(false);
    }
  }

  async function handleApprovePlaybook(actionId) {
    try {
      await approvePlaybookAction(actionId);
      setActionMsg('Playbook action approved');
      await fetchPlaybooks();
      await fetchIncident();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve action');
    }
  }

  async function handleRejectPlaybook(actionId) {
    try {
      await rejectPlaybookAction(actionId, 'Declined by analyst');
      setActionMsg('Playbook action rejected');
      await fetchPlaybooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject action');
    }
  }

  async function handleExecutePlaybook(actionId) {
    try {
      const data = await executePlaybookAction(actionId);
      setActionMsg(data.message || 'Playbook executed (simulated)');
      await fetchPlaybooks();
      await fetchIncident();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to execute action');
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading incident...</p>;
  }

  if (error && !incident) {
    return (
      <div>
        <p className="text-red-300">{error}</p>
        <Link to="/incidents" className="text-soc-accent text-sm mt-2 inline-block hover:underline">
          ← Back to incidents
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/incidents" className="text-sm text-soc-accent hover:underline mb-4 inline-block">
        ← Back to incidents
      </Link>

      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-white">{incident.title}</h2>
            <SeverityBadge severity={incident.severity} />
            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium border capitalize bg-soc-surface border-soc-border text-gray-300">
              {incident.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            {incident.username && <span>User: {incident.username}</span>}
            {incident.ip && <span>IP: <code>{incident.ip}</code></span>}
            {incident.assignedAnalyst && (
              <span>Analyst: {incident.assignedAnalyst.name}</span>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAssignToMe}
              className="px-3 py-2 rounded-lg text-xs border border-soc-border text-gray-300 hover:text-white"
            >
              Assign to me
            </button>
            <button
              type="button"
              onClick={handleInvestigate}
              disabled={investigating}
              className="px-3 py-2 rounded-lg text-xs bg-soc-accent/10 border border-soc-accent/30 text-soc-accent hover:bg-soc-accent/20 disabled:opacity-50"
            >
              {investigating ? 'Investigating...' : 'Investigate with AI'}
            </button>
            {INCIDENT_STATUSES.filter((s) => s !== incident.status).slice(0, 2).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusChange(status)}
                className="px-3 py-2 rounded-lg text-xs border border-soc-border text-gray-400 hover:text-white capitalize"
              >
                Mark {status}
              </button>
            ))}
          </div>
        )}
      </div>

      {actionMsg && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-soc-accent/10 border border-soc-accent/30 text-soc-accent text-sm">
          {actionMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-soc-critical/10 border border-soc-critical/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section className="bg-soc-surface border border-soc-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">AI Investigation Summary</h3>
            <AISummaryPanel incident={incident} />
          </section>

          <section className="bg-soc-surface border border-soc-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Mitigation Playbook</h3>
            <p className="text-xs text-gray-600 mb-4">
              AI-recommended actions require analyst approval before simulated execution.
            </p>
            <PlaybookPanel
              actions={playbookActions}
              auditLogs={auditLogs}
              canEdit={canEdit}
              loading={playbooksLoading}
              onApprove={handleApprovePlaybook}
              onReject={handleRejectPlaybook}
              onExecute={handleExecutePlaybook}
            />
          </section>

          <section className="bg-soc-surface border border-soc-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Timeline</h3>
            <Timeline entries={incident.timeline} />
          </section>

          <section className="bg-soc-surface border border-soc-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              Related Events ({incident.events?.length || 0})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-soc-border">
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">User</th>
                    <th className="pb-2 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {(incident.events || []).slice(0, 20).map((event) => (
                    <tr key={event.id} className="border-b border-soc-border/50">
                      <td className="py-2 text-gray-400 text-xs">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2">
                        <code className="text-xs text-soc-accent">{event.eventType}</code>
                      </td>
                      <td className="py-2 text-gray-300">{event.username || '—'}</td>
                      <td className="py-2 text-gray-400 font-mono text-xs">{event.ip || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-soc-surface border border-soc-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">Agent Activity</h3>
              <Link
                to={`/incidents/${id}/agents`}
                className="text-xs text-soc-accent hover:underline"
              >
                View all →
              </Link>
            </div>
            <AgentActivityPanel outputs={incident.agentOutputs} showAllAgents />
            <p className="text-xs text-gray-600 mt-3 capitalize">
              Investigation: {incident.investigationStatus?.replace(/_/g, ' ') || 'not started'}
            </p>
          </section>

          <section className="bg-soc-surface border border-soc-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              Related Alerts ({incident.alerts?.length || 0})
            </h3>
            <div className="space-y-3">
              {(incident.alerts || []).map((alert) => (
                <div key={alert.id} className="p-3 rounded-lg bg-soc-bg border border-soc-border">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm text-white font-medium">{alert.title}</span>
                    <SeverityBadge severity={alert.severity} />
                  </div>
                  <StatusBadge status={alert.status} />
                  <p className="text-xs text-gray-500 mt-2">{alert.evidence?.summary}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
