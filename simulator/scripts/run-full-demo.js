import { parseCliArgs, runSimulation } from '../lib/runner.js';
import { runScenario } from '../lib/scenarios/index.js';
import { setSeed } from '../lib/rng.js';
import { config } from '../config.js';

const args = parseCliArgs(process.argv);
setSeed(args.seed ?? 42);

const { events, expectations, scenario } = runScenario('fullDemo');

console.log(`Backend: ${config.backendUrl}`);
console.log('Portfolio demo — full attack story with deterministic seed 42');
runSimulation({
  name: 'Full Portfolio Demo',
  scenario,
  events,
  expectations,
  delayMs: args.delayMs,
  dryRun: args.dryRun,
});
