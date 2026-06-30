import { buildMixedTrafficEvents } from '../lib/templates/eventTemplates.js';
import { parseArgs, runScenario } from '../lib/runner.js';
import { config } from '../config.js';

const args = parseArgs(process.argv);

console.log(`Backend: ${config.backendUrl}`);
console.log('');
console.log('Mixed traffic: normal baseline → attack scenario → resumed normal activity');

const events = buildMixedTrafficEvents();

runScenario({
  name: 'Mixed Traffic',
  events,
  delayMs: args.delayMs,
  dryRun: args.dryRun,
});
