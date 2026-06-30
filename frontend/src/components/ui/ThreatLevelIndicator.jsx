function levelMeta(score) {
  if (score >= 75) return { label: 'Critical', color: 'text-red-300', bar: 'bg-red-500', glow: 'shadow-glow-critical' };
  if (score >= 50) return { label: 'High', color: 'text-orange-300', bar: 'bg-orange-500', glow: '' };
  if (score >= 25) return { label: 'Elevated', color: 'text-amber-300', bar: 'bg-amber-500', glow: '' };
  return { label: 'Low', color: 'text-emerald-300', bar: 'bg-emerald-500', glow: '' };
}

export function computeThreatLevel(stats) {
  if (!stats) return 0;
  const criticalIncidents =
    stats.incidents?.bySeverity?.find((s) => s.severity === 'critical')?.count || 0;
  const highAlerts = stats.alerts?.bySeverity?.find((s) => s.severity === 'high')?.count || 0;
  const openIncidents = stats.incidents?.openCount || 0;
  const openAlerts = stats.alerts?.openCount || 0;
  const raw = criticalIncidents * 35 + highAlerts * 15 + openIncidents * 12 + openAlerts * 3;
  return Math.min(100, Math.round(raw));
}

export default function ThreatLevelIndicator({ score = 0 }) {
  const meta = levelMeta(score);

  return (
    <div className={`glass-panel p-5 ${meta.glow}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">Threat Level</p>
        <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold text-white leading-none">{score}</span>
        <span className="text-sm text-gray-500 mb-1">/ 100</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${meta.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
