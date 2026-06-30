import { parseCliArgs, runSimulation } from '../lib/runner.js';
import { runScenario } from '../lib/scenarios/index.js';
import { config } from '../config.js';

const args = parseCliArgs(process.argv);
const { events, expectations, scenario } = runScenario('attack');

console.log(`Backend: ${config.backendUrl}`);
runSimulation({
  name: 'Attack Scenario',
  scenario,
  events,
  expectations,
  delayMs: args.delayMs,
  dryRun: args.dryRun,
});
