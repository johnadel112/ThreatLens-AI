import { sendEvent } from './apiClient.js';
import { sleep } from './utils.js';

export async function runScenario({
  name,
  events,
  delayMs = 300,
  dryRun = false,
}) {
  console.log('');
  console.log(`ThreatLens Event Simulator — ${name}`);
  console.log('='.repeat(40));
  console.log(`Events:  ${events.length}`);
  console.log(`Delay:   ${delayMs}ms between events`);
  console.log(`Mode:    ${dryRun ? 'DRY RUN (no API calls)' : 'LIVE (POST /api/events)'}`);
  console.log('');

  let sent = 0;
  let failed = 0;

  for (const [index, event] of events.entries()) {
    const label = `[${index + 1}/${events.length}] ${event.eventType} — ${event.username || 'system'} @ ${event.ip}`;

    if (dryRun) {
      console.log(`  ${label}`);
      sent++;
      continue;
    }

    try {
      const result = await sendEvent(event);
      console.log(`  ✓ ${label} → ${result.event.id}`);
      sent++;
    } catch (err) {
      console.error(`  ✗ ${label} — ${err.message}`);
      failed++;
    }

    if (delayMs > 0 && index < events.length - 1) {
      await sleep(delayMs);
    }
  }

  console.log('');
  console.log(`Done: ${sent} sent, ${failed} failed`);
  console.log('');

  if (failed > 0) {
    process.exitCode = 1;
  }

  return { sent, failed };
}

export function parseArgs(argv) {
  const args = { delayMs: 300, dryRun: false };

  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--delay' && argv[i + 1]) {
      args.delayMs = parseInt(argv[i + 1], 10);
      i++;
    } else if (argv[i]?.startsWith('--delay=')) {
      args.delayMs = parseInt(argv[i].split('=')[1], 10);
    } else if (argv[i] === '--dry-run') {
      args.dryRun = true;
    } else if (argv[i] === '--fast') {
      args.delayMs = 50;
    } else if (argv[i] === '--instant') {
      args.delayMs = 0;
    }
  }

  return args;
}
