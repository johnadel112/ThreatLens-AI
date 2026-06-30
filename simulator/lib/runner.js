import { sendEvent } from './apiClient.js';
import { sleep } from './rng.js';
import { printSummary } from './summary.js';

export async function runSimulation({
  name,
  scenario,
  events,
  expectations = {},
  delayMs = 300,
  dryRun = false,
}) {
  console.log('');
  console.log(`ThreatLens Event Simulator — ${name}`);
  console.log('='.repeat(48));
  console.log(`Scenario: ${scenario}`);
  console.log(`Events:   ${events.length}`);
  console.log(`Delay:    ${delayMs}ms`);
  console.log(`Mode:     ${dryRun ? 'DRY RUN' : 'LIVE → POST /api/events'}`);
  console.log('');

  const start = Date.now();
  let sent = 0;
  let failed = 0;
  const failures = [];

  for (const [index, event] of events.entries()) {
    const label = `[${index + 1}/${events.length}] ${event.eventType} — ${event.username || 'system'} @ ${event.ip || '—'}`;

    if (dryRun) {
      console.log(`  ${label}`);
      sent++;
      continue;
    }

    try {
      const result = await sendEvent(event);
      const alertNote = result.alertsCreated > 0 ? ` (${result.alertsCreated} alert(s))` : '';
      console.log(`  ✓ ${label}${alertNote}`);
      sent++;
    } catch (err) {
      console.error(`  ✗ ${label} — ${err.message}`);
      failed++;
      failures.push({ event, error: err.message });
    }

    if (delayMs > 0 && index < events.length - 1) {
      await sleep(delayMs);
    }
  }

  const durationMs = Date.now() - start;

  printSummary({
    scenario,
    sent,
    failed,
    events,
    expectations,
    durationMs,
  });

  if (failed > 0) {
    process.exitCode = 1;
  }

  return { sent, failed, failures, durationMs };
}

export function parseCliArgs(argv) {
  const args = {
    scenario: 'normal',
    delayMs: 300,
    dryRun: false,
    seed: undefined,
    count: undefined,
    startTime: undefined,
    instant: false,
    fast: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--scenario' && argv[i + 1]) {
      args.scenario = argv[++i];
    } else if (arg.startsWith('--scenario=')) {
      args.scenario = arg.split('=')[1];
    } else if (arg === '--delay' && argv[i + 1]) {
      args.delayMs = parseInt(argv[++i], 10);
    } else if (arg.startsWith('--delay=')) {
      args.delayMs = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--seed' && argv[i + 1]) {
      args.seed = argv[++i];
    } else if (arg.startsWith('--seed=')) {
      args.seed = arg.split('=')[1];
    } else if (arg === '--count' && argv[i + 1]) {
      args.count = parseInt(argv[++i], 10);
    } else if (arg.startsWith('--count=')) {
      args.count = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--start' && argv[i + 1]) {
      args.startTime = argv[++i];
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--instant') {
      args.instant = true;
    } else if (arg === '--fast') {
      args.fast = true;
    }
  }

  if (args.instant) args.delayMs = 0;
  if (args.fast) args.delayMs = 50;

  return args;
}
