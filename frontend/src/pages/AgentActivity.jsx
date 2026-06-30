import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getIncident, getAgentOutputs, investigateIncident } from '../api/incidents';
import { useAuth } from '../context/AuthContext';
import { usePolling } from '../hooks/usePolling';
import AgentWorkflow from '../components/agents/AgentWorkflow';
import GlassCard from '../components/ui/GlassCard';
import PageHeader from '../components/ui/PageHeader';
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

  usePolling(fetchData, 2000, incident?.investigationStatus === 'running' || investigating);

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

  if (loading) return <p className="text-gray-500">Loading agent pipeline…</p>;

  return (
    <div>
      <Link to={`/incidents/${id}`} className="text-sm text-soc-accent hover:underline mb-4 inline-block">
        ← Back to incident
      </Link>

      <PageHeader
        title="AI Investigation Engine"
        subtitle={incident?.title}
        badge={
          <div className="flex items-center gap-2 mb-2">
            <SeverityBadge severity={incident?.severity} />
            <span className="text-xs text-gray-500 capitalize">
              {incident?.investigationStatus?.replace(/_/g, ' ')}
            </span>
          </div>
        }
        actions={
          canInvestigate && (
            <button
              type="button"
              onClick={handleInvestigate}
              disabled={investigating}
              className="btn-primary text-sm"
            >
              {investigating ? 'Running workflow…' : 'Run AI Workflow'}
            </button>
          )
        }
      />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
          {error}
        </div>
      )}

      <GlassCard>
        <p className="text-xs text-gray-500 mb-6 font-mono">
          Triage → Investigation → Classification → Mitigation → Report → Reviewer
        </p>
        <AgentWorkflow outputs={agentOutputs} showAllAgents />
      </GlassCard>
    </div>
  );
}
