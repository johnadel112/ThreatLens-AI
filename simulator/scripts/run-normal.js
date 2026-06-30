import { buildNormalTrafficEvents } from '../lib/templates/eventTemplates.js';
import { parseArgs, runScenario } from '../lib/runner.js';
import { config } from '../config.js';

const args = parseArgs(process.argv);
const count = parseInt(process.env.NORMAL_EVENT_COUNT || '15', 10);

console.log(`Backend: ${config.backendUrl}`);

const events = buildNormalTrafficEvents(count);

runScenario({
  name: 'Normal Traffic',
  events,
  delayMs: args.delayMs,
  dryRun: args.dryRun,
});
