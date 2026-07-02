import MitreTechniqueBadge from '../ui/MitreTechniqueBadge';
import RiskScoreBadge from '../ui/RiskScoreBadge';

export default function AISummaryPanel({ incident, onRetry }) {
  if (!incident?.aiSummary && incident?.investigationStatus === 'not_started') {
    return (
      <p className="text-sm text-gray-500">
        Run AI investigation to generate an evidence-based summary.
      </p>
    );
  }

  if (incident?.investigationStatus === 'running') {
    return <p className="text-sm text-soc-accent animate-pulse">AI analysis in progress...</p>;
  }

  if (incident?.investigationStatus === 'failed') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-300">
          Investigation could not complete. Click &quot;Investigate with AI&quot; to retry — the platform
          will run an evidence-based analysis even when the dedicated AI service is offline.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-medium text-soc-accent hover:text-soc-accent/80 transition-colors"
          >
            Retry investigation
          </button>
        )}
      </div>
    );
  }

  const tc = incident.threatClassification || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {incident.riskScore != null && <RiskScoreBadge score={incident.riskScore} size="lg" />}
        {incident.correlationScore != null && (
          <span className="text-xs text-gray-500 self-center">
            Correlation: <span className="text-soc-accent font-mono">{incident.correlationScore}</span>
          </span>
        )}
        {incident.confidenceScore != null && (
          <span className="text-xs text-gray-500 self-center">
            Confidence: <span className="text-emerald-300 font-mono">{incident.confidenceScore}%</span>
          </span>
        )}
      </div>

      {incident.aiSummary && (
        <p className="text-sm text-gray-300 leading-relaxed">{incident.aiSummary}</p>
      )}

      {(tc.attackType || incident.mitre?.primaryTactic) && (
        <div className="p-3 rounded-lg bg-black/20 border border-white/[0.06] space-y-2">
          <p className="text-xs text-gray-500">Threat Classification</p>
          {tc.attackType && <p className="text-sm text-white">{tc.attackType}</p>}
          <MitreTechniqueBadge
            tactic={tc.mitreTactic || incident.mitre?.primaryTactic}
            technique={tc.mitreTechnique || incident.mitre?.techniques?.[0]?.technique}
            techniqueId={tc.techniqueId || incident.mitre?.techniques?.[0]?.techniqueId}
          />
        </div>
      )}

      {incident.recommendations?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Recommendations</p>
          <ul className="space-y-2">
            {incident.recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-gray-400 pl-3 border-l-2 border-soc-accent/40">
                <span className="text-gray-300 capitalize">{rec.actionType?.replace(/_/g, ' ')}</span>
                {' — '}
                {rec.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
