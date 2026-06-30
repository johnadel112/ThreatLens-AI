import { parseCliArgs, runSimulation } from '../lib/runner.js';
import { runScenario } from '../lib/scenarios/index.js';
import { config } from '../config.js';

const args = parseCliArgs(process.argv);
const count = args.count || 500;
const { events, expectations, scenario } = runScenario('stress', { count });

console.log(`Backend: ${config.backendUrl}`);
runSimulation({
  name: `Stress Test (${count} events)`,
  scenario,
  events,
  expectations,
  delayMs: args.delayMs,
  dryRun: args.dryRun,
});
