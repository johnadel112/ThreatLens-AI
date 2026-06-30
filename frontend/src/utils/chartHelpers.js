const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22d3ee',
  info: '#60a5fa',
};

const STATUS_COLORS = {
  open: '#ef4444',
  new: '#ef4444',
  investigating: '#22d3ee',
  acknowledged: '#f59e0b',
  contained: '#f59e0b',
  resolved: '#10b981',
  closed: '#6b7280',
  false_positive: '#6b7280',
  pending: '#f59e0b',
  approved: '#60a5fa',
  executed: '#10b981',
};

export function severityChartData(bySeverity = []) {
  const order = ['critical', 'high', 'medium', 'low', 'info'];
  const map = Object.fromEntries(bySeverity.map((s) => [s.severity, s.count]));
  return order
    .filter((sev) => map[sev])
    .map((sev) => ({
      name: sev.charAt(0).toUpperCase() + sev.slice(1),
      count: map[sev],
      fill: SEVERITY_COLORS[sev] || '#6b7280',
    }));
}

export function statusChartData(byStatus = [], key = 'status') {
  return byStatus.map((s) => ({
    name: (s[key] || 'unknown').replace(/_/g, ' '),
    count: s.count,
    fill: STATUS_COLORS[s[key]] || '#6b7280',
  }));
}

export function typeChartData(byType = []) {
  return byType.slice(0, 8).map((t, i) => ({
    name: (t.eventType || 'unknown').replace(/_/g, ' '),
    count: t.count,
    fill: `hsl(${190 + i * 18}, 70%, 55%)`,
  }));
}

/** Bucket events into hourly counts for the last 24 hours */
export function hourlyVolumeFromEvents(events = []) {
  const now = Date.now();
  const buckets = Array.from({ length: 24 }, (_, i) => {
    const hourStart = new Date(now - (23 - i) * 60 * 60 * 1000);
    hourStart.setMinutes(0, 0, 0);
    return {
      hour: hourStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      count: 0,
      ts: hourStart.getTime(),
    };
  });

  for (const event of events) {
    const ts = new Date(event.timestamp).getTime();
    if (Number.isNaN(ts) || ts < buckets[0].ts - 3600000) continue;
    for (let i = buckets.length - 1; i >= 0; i -= 1) {
      if (ts >= buckets[i].ts) {
        buckets[i].count += 1;
        break;
      }
    }
  }

  return buckets;
}
