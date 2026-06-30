export default function AISummaryPanel({ incident }) {
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
      <p className="text-sm text-red-300">
        Investigation failed. Ensure the AI service is running on port 8000 and try again.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {incident.aiSummary && (
        <p className="text-sm text-gray-300 leading-relaxed">{incident.aiSummary}</p>
      )}

      {incident.threatClassification?.attackType && (
        <div className="p-3 rounded-lg bg-soc-bg border border-soc-border">
          <p className="text-xs text-gray-500 mb-1">Threat Classification</p>
          <p className="text-sm text-white">{incident.threatClassification.attackType}</p>
          <p className="text-xs text-gray-400 mt-1">{incident.threatClassification.category}</p>
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

      {incident.report?.markdown && (
        <details className="group">
          <summary className="text-xs text-soc-accent cursor-pointer hover:underline">
            View full SOC report
          </summary>
          <pre className="mt-3 p-4 rounded-lg bg-soc-bg border border-soc-border text-xs text-gray-400 whitespace-pre-wrap overflow-x-auto max-h-96">
            {incident.report.markdown}
          </pre>
        </details>
      )}
    </div>
  );
}
