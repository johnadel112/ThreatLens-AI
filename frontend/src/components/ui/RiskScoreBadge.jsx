const BAND_STYLES = {
  Low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Guarded: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  Elevated: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  High: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  Critical: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export function riskLabel(score = 0) {
  if (score >= 91) return 'Critical';
  if (score >= 76) return 'High';
  if (score >= 51) return 'Elevated';
  if (score >= 26) return 'Guarded';
  return 'Low';
}

export default function RiskScoreBadge({ score, showLabel = true, size = 'sm' }) {
  if (score == null) return null;
  const label = riskLabel(score);
  const sizeClass = size === 'lg' ? 'text-sm px-2.5 py-1' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold border tabular-nums ${sizeClass} ${BAND_STYLES[label]}`}
      title={`Risk score ${score}/100`}
    >
      <span>{score}</span>
      {showLabel && <span className="font-medium opacity-80">{label}</span>}
    </span>
  );
}
