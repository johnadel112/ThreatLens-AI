#!/usr/bin/env node
import { config } from '../config.js';
import { setSeed } from '../lib/rng.js';
import { runScenario } from '../lib/scenarios/index.js';
import { parseCliArgs, runSimulation } from '../lib/runner.js';

const args = parseCliArgs(process.argv);

if (args.seed !== undefined) {
  setSeed(args.seed);
  console.log(`Random seed: ${args.seed}`);
}

console.log(`Backend: ${config.backendUrl}`);
console.log(`API Key: ${config.apiKey ? 'configured' : 'MISSING — set SIMULATOR_API_KEY in simulator/.env'}`);

const { scenario: scenarioName, events, expectations } = runScenario(args.scenario, {
  count: args.count,
  startTime: args.startTime,
});

runSimulation({
  name: scenarioName,
  scenario: scenarioName,
  events,
  expectations,
  delayMs: args.delayMs,
  dryRun: args.dryRun,
});
