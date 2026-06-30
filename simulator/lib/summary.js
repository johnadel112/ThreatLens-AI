export function buildSummary({ scenario, sent, failed, events, expectations, durationMs }) {
  const bySeverity = {};
  const byType = {};

  for (const event of events) {
    bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
    byType[event.eventType] = (byType[event.eventType] || 0) + 1;
  }

  const topTypes = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const lines = [
    '',
    '='.repeat(48),
    'Simulation completed.',
    '='.repeat(48),
    '',
    `Scenario:            ${scenario}`,
    `Duration:            ${(durationMs / 1000).toFixed(1)}s`,
    `Total events sent:   ${events.length}`,
    `Successful requests: ${sent}`,
    `Failed requests:     ${failed}`,
    '',
    'Events by severity:',
    ...['info', 'low', 'medium', 'high', 'critical'].map(
      (s) => `  ${s}: ${bySeverity[s] || 0}`
    ),
    '',
    'Events by type (top):',
    ...topTypes.map(([type, count]) => `  ${type}: ${count}`),
    '',
  ];

  if (expectations?.alerts?.length) {
    lines.push('Expected alerts triggered:');
    expectations.alerts.forEach((a) => lines.push(`  - ${a}`));
    lines.push('');
  }

  if (expectations?.incidents?.length) {
    lines.push('Expected incidents:');
    expectations.incidents.forEach((i) => lines.push(`  - ${i}`));
    lines.push('');
  }

  lines.push('Next steps:');
  lines.push('  1. Check Alerts page for detection rule output');
  lines.push('  2. Open Incidents and run AI investigation');
  lines.push('  3. Review Dashboard charts and Reports');
  lines.push('');

  return lines.join('\n');
}

export function printSummary(result) {
  console.log(buildSummary(result));
}
