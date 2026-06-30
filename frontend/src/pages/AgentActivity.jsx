import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getIncident, getAgentOutputs, investigateIncident } from '../api/incidents';
import { useAuth } from '../context/AuthContext';
import { usePolling } from '../hooks/usePolling';
import AgentActivityPanel from '../components/incidents/AgentActivityPanel';
import SeverityBadge from '../components/ui/SeverityBadge';

export default function AgentActivity() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const canInvestigate = hasRole('admin', 'analyst');

  const [incident, setIncident] = useState(null);
  const [agentOutputs, setAgentOutputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const inc = await getIncident(id);
      let agents = inc.agentOutputs || [];
      try {
        const agentData = await getAgentOutputs(id);
        agents = agentData.agentOutputs || agents;
      } catch {
        // use incident embedded outputs
      }
      setIncident(inc);
      setAgentOutputs(agents);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load agent activity');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  usePolling(
    fetchData,
    2000,
    incident?.investigationStatus === 'running' || investigating
  );

  async function handleInvestigate() {
    setInvestigating(true);
    setError('');
    try {
      const data = await investigateIncident(id);
      setIncident(data.incident);
      setAgentOutputs(data.agentOutputs || data.incident?.agentOutputs || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Investigation failed');
      await fetchData();
    } finally {
      setInvestigating(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading agent activity...</p>;

  return (
    <div>
      <Link to={`/incidents/${id}`} className="text-sm text-soc-accent hover:underline mb-4 inline-block">
        ← Back to incident
      </Link>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Agent Activity</h2>
          <p className="text-gray-400 mt-1">{incident?.title}</p>
          <div className="flex items-center gap-2 mt-2">
            <SeverityBadge severity={incident?.severity} />
            <span className="text-xs text-gray-500 capitalize">
              Investigation: {incident?.investigationStatus?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        {canInvestigate && (
          <button
            type="button"
            onClick={handleInvestigate}
            disabled={investigating}
            className="px-4 py-2 rounded-lg text-sm bg-soc-accent/10 border border-soc-accent/30 text-soc-accent hover:bg-soc-accent/20 disabled:opacity-50"
          >
            {investigating ? 'Running workflow...' : 'Run AI Workflow'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-soc-critical/10 border border-soc-critical/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-soc-surface border border-soc-border rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Multi-Agent Workflow</h3>
        <p className="text-xs text-gray-500 mb-4">
          Triage → Investigation → Classification → Mitigation → Report → Reviewer
        </p>
        <AgentActivityPanel outputs={agentOutputs} showAllAgents />
      </div>
    </div>
  );
}
