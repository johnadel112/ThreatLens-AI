import { useState } from 'react';
import { AGENT_DESCRIPTIONS, AGENT_LABELS, WORKFLOW_AGENTS } from '../../utils/agents';

const statusStyles = {
  waiting: 'border-gray-600 text-gray-500',
  running: 'border-soc-accent text-soc-accent',
  completed: 'border-soc-success text-soc-success',
  failed: 'border-soc-critical text-soc-critical',
};

const dotStyles = {
  waiting: 'bg-gray-600',
  running: 'bg-soc-accent animate-pulse',
  completed: 'bg-soc-success',
  failed: 'bg-soc-critical',
};

function AgentStep({ agent, expanded, onToggle }) {
  const label = AGENT_LABELS[agent.agentName] || agent.agentName;
  const description = AGENT_DESCRIPTIONS[agent.agentName] || '';

  return (
    <div className={`border rounded-lg p-4 ${statusStyles[agent.status] || statusStyles.waiting} border-opacity-40 bg-soc-bg`}>
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-start gap-3">
          <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${dotStyles[agent.status] || dotStyles.waiting}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">{label}</p>
              <span className="text-xs capitalize">{agent.status}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            {agent.confidence != null && agent.status === 'completed' && (
              <p className="text-xs text-gray-500 mt-1">
                Confidence: {Math.round(agent.confidence * 100)}%
              </p>
            )}
            {agent.error && (
              <p className="text-xs text-red-300 mt-1">{agent.error}</p>
            )}
          </div>
        </div>
      </button>

      {expanded && agent.output && (
        <pre className="mt-3 p-3 rounded bg-soc-surface border border-soc-border text-xs text-gray-400 overflow-x-auto max-h-48">
          {JSON.stringify(agent.output, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AgentActivityPanel({ outputs = [], showAllAgents = false }) {
  const [expandedId, setExpandedId] = useState(null);

  const outputMap = Object.fromEntries(outputs.map((o) => [o.agentName, o]));

  const agents = showAllAgents
    ? WORKFLOW_AGENTS.map((name) => outputMap[name] || { agentName: name, status: 'waiting' })
    : outputs.length > 0
      ? outputs
      : WORKFLOW_AGENTS.map((name) => ({ agentName: name, status: 'waiting' }));

  if (!showAllAgents && outputs.length === 0) {
    return (
      <p className="text-xs text-gray-600">
        No agent activity yet. Click &quot;Investigate with AI&quot; to start the workflow.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {agents.map((agent) => (
        <AgentStep
          key={agent.agentName}
          agent={agent}
          expanded={expandedId === agent.agentName}
          onToggle={() =>
            setExpandedId((prev) => (prev === agent.agentName ? null : agent.agentName))
          }
        />
      ))}
    </div>
  );
}
