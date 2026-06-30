import { buildAttackScenarioEvents } from '../lib/templates/eventTemplates.js';
import { parseArgs, runScenario } from '../lib/runner.js';
import { config } from '../config.js';

const args = parseArgs(process.argv);

console.log(`Backend: ${config.backendUrl}`);
console.log('');
console.log('Demo scenario: Brute Force → Account Compromise → Data Exfiltration');
console.log('  • 6 failed logins for jdoe from 203.0.113.45');
console.log('  • 1 successful login');
console.log('  • 35 file downloads (triggers detection in Week 5)');

const events = buildAttackScenarioEvents();

runScenario({
  name: 'Attack Scenario',
  events,
  delayMs: args.delayMs,
  dryRun: args.dryRun,
});
