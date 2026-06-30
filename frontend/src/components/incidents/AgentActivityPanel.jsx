const statusStyles = {
  waiting: 'text-gray-400',
  running: 'text-soc-accent animate-pulse',
  completed: 'text-soc-success',
  failed: 'text-soc-critical',
};

export default function AgentActivityPanel({ outputs = [] }) {
  if (outputs.length === 0) {
    return (
      <p className="text-xs text-gray-600">
        No agent activity yet. Click &quot;Investigate with AI&quot; to start.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {outputs.map((agent) => (
        <div
          key={agent.id}
          className="flex items-center justify-between p-3 rounded-lg bg-soc-bg border border-soc-border"
        >
          <div>
            <p className="text-sm text-white capitalize">{agent.agentName} Agent</p>
            <p className={`text-xs capitalize ${statusStyles[agent.status] || statusStyles.waiting}`}>
              {agent.status}
            </p>
          </div>
          {agent.confidence != null && agent.status === 'completed' && (
            <span className="text-xs text-gray-500">
              {Math.round(agent.confidence * 100)}% confidence
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
