import RiskScoreBadge from '../ui/RiskScoreBadge';
import MitreTechniqueBadge from '../ui/MitreTechniqueBadge';

export default function CorrelationPanel({ correlation, correlationScore, mitre }) {
  if (!correlation && correlationScore == null) return null;

  const chains = correlation?.matchedChains || [];
  const stages = correlation?.stages || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {correlationScore != null && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Correlation Score</p>
            <RiskScoreBadge score={correlationScore} size="lg" />
          </div>
        )}
        {mitre?.primaryTactic && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Primary MITRE Tactic</p>
            <MitreTechniqueBadge tactic={mitre.primaryTactic} compact />
          </div>
        )}
      </div>

      {correlation?.narrative && (
        <p className="text-sm text-gray-300 leading-relaxed border-l-2 border-soc-accent/30 pl-3">
          {correlation.narrative}
        </p>
      )}

      {chains.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Attack Chains</p>
          <div className="space-y-2">
            {chains.map((chain) => (
              <div
                key={chain.id}
                className={`px-3 py-2 rounded-lg border text-xs ${
                  chain.matched
                    ? 'border-red-500/25 bg-red-500/5 text-red-200'
                    : 'border-amber-500/25 bg-amber-500/5 text-amber-200'
                }`}
              >
                <span className="font-medium">{chain.name}</span>
                <span className="text-gray-500 ml-2">({chain.matched ? 'matched' : 'partial'})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {correlation?.groupingKeys?.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {correlation.groupingKeys.map((k) => (
            <span key={`${k.type}-${k.value}`} className="px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06]">
              {k.type}: <code className="text-gray-400">{k.value}</code>
            </span>
          ))}
        </div>
      )}

      {stages.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Correlated Sequence</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {stages.map((stage, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="font-mono text-gray-500 shrink-0">
                  {new Date(stage.timestamp).toLocaleTimeString()}
                </span>
                <code className="text-soc-accent">{stage.eventType}</code>
                {stage.mitreTactic && (
                  <span className="text-purple-300/70 truncate">{stage.mitreTactic}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
