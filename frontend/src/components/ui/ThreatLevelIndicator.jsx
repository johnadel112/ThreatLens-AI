import { buildThreatDrivers } from '../../utils/dashboardMetrics';

function levelMeta(score) {
  if (score >= 91) return { label: 'Critical', color: 'text-red-300', bar: 'bg-red-500', glow: 'shadow-glow-critical', badge: 'bg-red-500/15 border-red-500/30' };
  if (score >= 76) return { label: 'High', color: 'text-orange-300', bar: 'bg-orange-500', glow: '', badge: 'bg-orange-500/15 border-orange-500/30' };
  if (score >= 51) return { label: 'Elevated', color: 'text-amber-300', bar: 'bg-amber-500', glow: '', badge: 'bg-amber-500/15 border-amber-500/30' };
  if (score >= 26) return { label: 'Guarded', color: 'text-cyan-300', bar: 'bg-cyan-500', glow: '', badge: 'bg-cyan-500/15 border-cyan-500/30' };
  return { label: 'Low', color: 'text-emerald-300', bar: 'bg-emerald-500', glow: '', badge: 'bg-emerald-500/15 border-emerald-500/30' };
}

function openSeverityCount(bySeverity = [], severity) {
  return bySeverity.find((s) => s.severity === severity)?.count || 0;
}

/** Score based on OPEN threats only — resolved items should not inflate the meter. */
export function computeThreatLevel(stats) {
  if (!stats) return 0;

  const openCriticalIncidents = openSeverityCount(stats.incidents?.openBySeverity, 'critical');
  const openHighIncidents = openSeverityCount(stats.incidents?.openBySeverity, 'high');
  const openCriticalAlerts = openSeverityCount(stats.alerts?.openBySeverity, 'critical');
  const openHighAlerts = openSeverityCount(stats.alerts?.openBySeverity, 'high');
  const openIncidents = stats.incidents?.openCount || 0;
  const openAlerts = stats.alerts?.openCount || 0;
  const pendingPlaybooks = stats.playbooks?.pendingCount || 0;

  const criticalIncidents = openCriticalIncidents || openSeverityCount(stats.incidents?.bySeverity, 'critical');
  const highIncidents = openHighIncidents || openSeverityCount(stats.incidents?.bySeverity, 'high');
  const criticalAlerts = openCriticalAlerts || openSeverityCount(stats.alerts?.bySeverity, 'critical');
  const highAlerts = openHighAlerts || openSeverityCount(stats.alerts?.bySeverity, 'high');

  let score = 0;
  score += Math.min(criticalIncidents * 14, 28);
  score += Math.min(highIncidents * 6, 18);
  score += Math.min(criticalAlerts * 8, 20);
  score += Math.min(highAlerts * 3, 12);
  score += Math.min(Math.max(openIncidents - criticalIncidents - highIncidents, 0) * 2, 6);
  score += Math.min(Math.max(openAlerts - criticalAlerts - highAlerts, 0) * 0.5, 5);
  score += Math.min(pendingPlaybooks * 1.5, 6);

  const raw = Math.round(score * 0.72);

  if (raw >= 91 && (openCriticalIncidents < 2 || openCriticalAlerts < 2)) {
    return Math.min(90, raw);
  }

  return Math.min(100, Math.max(0, raw));
}

export default function ThreatLevelIndicator({ score = 0, stats = null, drivers }) {
  const meta = levelMeta(score);
  const driverList = drivers || buildThreatDrivers(stats);

  return (
    <div className={`glass-panel p-4 sm:p-5 ${meta.glow}`}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-sm text-gray-400">Threat Level</p>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${meta.badge} ${meta.color}`}>
          {meta.label}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl sm:text-4xl font-bold text-white leading-none tabular-nums">{score}</span>
        <span className="text-sm text-gray-500 mb-1">/ 100</span>
      </div>
      <div className="mt-4 h-2.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${meta.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {driverList.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Drivers</p>
          <ul className="space-y-1.5">
            {driverList.map((driver) => (
              <li key={driver} className="text-xs text-gray-400 flex items-start gap-2">
                <span className="text-soc-accent mt-0.5">•</span>
                <span>{driver}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
