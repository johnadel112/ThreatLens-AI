function levelMeta(score) {
  if (score >= 91) return { label: 'Critical', color: 'text-red-300', bar: 'bg-red-500', glow: 'shadow-glow-critical', badge: 'bg-red-500/15 border-red-500/30' };
  if (score >= 76) return { label: 'High', color: 'text-orange-300', bar: 'bg-orange-500', glow: '', badge: 'bg-orange-500/15 border-orange-500/30' };
  if (score >= 51) return { label: 'Elevated', color: 'text-amber-300', bar: 'bg-amber-500', glow: '', badge: 'bg-amber-500/15 border-amber-500/30' };
  if (score >= 26) return { label: 'Guarded', color: 'text-cyan-300', bar: 'bg-cyan-500', glow: '', badge: 'bg-cyan-500/15 border-cyan-500/30' };
  return { label: 'Low', color: 'text-emerald-300', bar: 'bg-emerald-500', glow: '', badge: 'bg-emerald-500/15 border-emerald-500/30' };
}

export function computeThreatLevel(stats) {
  if (!stats) return 0;

  const criticalIncidents =
    stats.incidents?.bySeverity?.find((s) => s.severity === 'critical')?.count || 0;
  const highIncidents =
    stats.incidents?.bySeverity?.find((s) => s.severity === 'high')?.count || 0;
  const criticalAlerts =
    stats.alerts?.bySeverity?.find((s) => s.severity === 'critical')?.count || 0;
  const highAlerts =
    stats.alerts?.bySeverity?.find((s) => s.severity === 'high')?.count || 0;
  const openIncidents = stats.incidents?.openCount || 0;
  const openAlerts = stats.alerts?.openCount || 0;
  const pendingPlaybooks = stats.playbooks?.pendingCount || 0;

  let score = 0;
  score += Math.min(criticalIncidents * 22, 44);
  score += Math.min(highIncidents * 10, 20);
  score += Math.min(criticalAlerts * 12, 24);
  score += Math.min(highAlerts * 5, 15);
  score += Math.min(openIncidents * 4, 12);
  score += Math.min(openAlerts * 1.5, 9);
  score += Math.min(pendingPlaybooks * 2, 6);

  // Diminishing returns — harder to hit 100
  const raw = Math.round(score * 0.85);
  return Math.min(100, Math.max(0, raw));
}

export default function ThreatLevelIndicator({ score = 0 }) {
  const meta = levelMeta(score);

  return (
    <div className={`glass-panel p-5 ${meta.glow}`}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-sm text-gray-400">Threat Level</p>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.badge} ${meta.color}`}>
          {meta.label}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold text-white leading-none tabular-nums">{score}</span>
        <span className="text-sm text-gray-500 mb-1">/ 100</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${meta.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-600 mt-3 leading-relaxed">
        Based on open incidents, alert severity, and playbook queue.
      </p>
    </div>
  );
}
