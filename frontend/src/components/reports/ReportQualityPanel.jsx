function QualityBar({ label, value }) {
  const score = value ?? 0;
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono tabular-nums">{value != null ? `${value}%` : '—'}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function hasReportQualityData(quality) {
  if (!quality) return false;
  if (quality.overallConfidence > 0) return true;
  return [
    quality.evidenceCompleteness,
    quality.timelineQuality,
    quality.threatClassificationConfidence,
    quality.mitigationQuality,
    quality.reportClarity,
  ].some((v) => v > 0);
}

export default function ReportQualityPanel({ quality }) {
  if (!hasReportQualityData(quality)) {
    return (
      <p className="text-sm text-gray-500">
        Report quality scores appear after AI investigation completes.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Overall Report Confidence</p>
          <p className="text-3xl font-bold text-white tabular-nums mt-1">
            {quality.overallConfidence ?? '—'}
            <span className="text-sm text-gray-500 font-normal">%</span>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <QualityBar label="Evidence Completeness" value={quality.evidenceCompleteness} />
        <QualityBar label="Timeline Quality" value={quality.timelineQuality} />
        <QualityBar label="Threat Classification Confidence" value={quality.threatClassificationConfidence} />
        <QualityBar label="Mitigation Quality" value={quality.mitigationQuality} />
        <QualityBar label="Report Clarity" value={quality.reportClarity} />
      </div>

      {quality.warnings?.length > 0 && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
          <p className="text-xs font-medium text-amber-300 mb-2">Reviewer Warnings</p>
          <ul className="space-y-1">
            {quality.warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-200/90">• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {quality.missingEvidence?.length > 0 && (
        <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Missing Evidence</p>
          <ul className="space-y-1">
            {quality.missingEvidence.map((m, i) => (
              <li key={i} className="text-xs text-gray-400">• {m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
