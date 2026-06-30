export const SEVERITY_COLORS = {
  info: '#64748b',
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export const CHART_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export function severityChartData(items = []) {
  const order = ['info', 'low', 'medium', 'high', 'critical'];
  const map = Object.fromEntries(items.map((i) => [i.severity, i.count]));
  return order
    .filter((s) => map[s])
    .map((severity) => ({
      name: severity,
      count: map[severity],
      fill: SEVERITY_COLORS[severity],
    }));
}

export function statusChartData(items = [], key = 'status') {
  return items.map((item, idx) => ({
    name: item[key]?.replace(/_/g, ' ') || 'unknown',
    count: item.count,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }));
}

export function typeChartData(items = []) {
  return items.map((item, idx) => ({
    name: item.eventType?.replace(/_/g, ' ') || 'unknown',
    count: item.count,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }));
}
