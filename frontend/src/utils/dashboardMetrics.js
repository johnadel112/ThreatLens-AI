export function formatCompactNumber(value = 0) {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function severityMap(bySeverity = []) {
  return Object.fromEntries(bySeverity.map((s) => [s.severity, s.count]));
}

export function formatSeverityLine(bySeverity = [], keys = ['critical', 'high', 'medium', 'low']) {
  const map = severityMap(bySeverity);
  return keys
    .filter((k) => map[k])
    .map((k) => `${map[k]} ${k}`)
    .join(' • ');
}

export function computeHourlyTrend(current = 0, previous = 0) {
  if (previous === 0 && current === 0) return { label: 'No change', direction: 'flat', delta: 0 };
  if (previous === 0) return { label: `+${current} in the last hour`, direction: 'up', delta: current };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { label: `↑ ${pct}% from previous hour`, direction: 'up', delta: pct };
  if (pct < 0) return { label: `↓ ${Math.abs(pct)}% from previous hour`, direction: 'down', delta: pct };
  return { label: 'Stable vs previous hour', direction: 'flat', delta: 0 };
}

export function computeChartVolumeStats(hourlyTimeline = []) {
  const counts = hourlyTimeline.map((d) => d.count || 0);
  if (!counts.length) return { peak: 0, average: 0, current: 0 };
  const peak = Math.max(...counts);
  const average = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);
  const current = counts[counts.length - 1] || 0;
  return { peak, average, current };
}

export function buildThreatDrivers(stats) {
  if (!stats) return [];
  const drivers = [];
  const openCriticalCases = severityMap(stats.incidents?.openBySeverity).critical || 0;
  const openCriticalAlerts = severityMap(stats.alerts?.openBySeverity).critical || 0;
  const openHighAlerts = severityMap(stats.alerts?.openBySeverity).high || 0;

  if (openCriticalCases) drivers.push(`${openCriticalCases} critical case${openCriticalCases === 1 ? '' : 's'}`);
  if (stats.alerts?.openCount) drivers.push(`${stats.alerts.openCount.toLocaleString()} unresolved alerts`);
  if (stats.playbooks?.pendingCount) {
    drivers.push(`${stats.playbooks.pendingCount} pending SOAR action${stats.playbooks.pendingCount === 1 ? '' : 's'}`);
  }
  if (openHighAlerts) drivers.push(`${openHighAlerts} high-severity open alerts`);
  if (stats.events?.lastHour > 0) drivers.push(`${stats.events.lastHour} events in the last hour`);

  const topType = stats.events?.byType?.[0];
  if (topType?.eventType) {
    drivers.push(`Frequent ${topType.eventType.replace(/_/g, ' ')} activity`);
  }

  return drivers.slice(0, 5);
}

export function buildSecurityBriefing(stats) {
  if (!stats) {
    return {
      situation: 'Collecting telemetry for your workspace.',
      focus: ['Wait for live events to populate the dashboard'],
      level: 'Guarded',
    };
  }

  const threatScore = stats._threatScore ?? 0;
  const openCriticalAlerts = severityMap(stats.alerts?.openBySeverity).critical || 0;
  const pendingSoar = stats.playbooks?.pendingCount || 0;
  const openCases = stats.incidents?.openCount || 0;
  const topTactic = stats.intelligence?.mitreByTactic?.[0]?.tactic;

  let situation = 'Security posture is stable with routine monitoring activity.';
  if (threatScore >= 76) {
    situation = 'High-priority threat activity requires immediate analyst attention across cases and alerts.';
  } else if (threatScore >= 51) {
    situation = 'Elevated threat activity driven by unresolved alerts, open cases, and recent suspicious events.';
  } else if (threatScore >= 26) {
    situation = 'Guarded posture with moderate event volume and some items awaiting review.';
  }

  if (topTactic) {
    situation += ` Primary MITRE focus: ${topTactic}.`;
  }

  const focus = [];
  if (openCriticalAlerts) focus.push(`Review ${openCriticalAlerts} critical unresolved alerts`);
  if (openCases) focus.push(`Triage ${openCases} active cases`);
  if (pendingSoar) focus.push(`Approve ${pendingSoar} pending SOAR actions`);
  if (stats.operations?.unassignedCases) {
    focus.push(`Assign ${stats.operations.unassignedCases} unassigned cases`);
  }
  if (!focus.length) focus.push('Continue monitoring live telemetry and detection pipeline');

  return { situation, focus: focus.slice(0, 4), level: threatScore >= 76 ? 'High' : threatScore >= 51 ? 'Elevated' : 'Guarded' };
}

export function formatLastUpdated(date) {
  if (!date) return 'Updated just now';
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return 'Updated just now';
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `Updated ${minutes}m ago`;
}
