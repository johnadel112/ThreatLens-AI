# ThreatLens AI — Event Simulator

Professional simulated security event generator for SOC demos, detection testing, and portfolio presentations.

**All events flow through `POST /api/events`** — never written directly to MongoDB.

## Quick start

```bash
cd simulator
cp .env.example .env   # set SIMULATOR_API_KEY (match backend/.env)
npm install

npm run simulate:full-demo    # Best portfolio demo (deterministic seed 42)
npm run simulate:normal       # Benign traffic
npm run simulate:attack       # Brute force + data exfiltration
npm run simulate:mixed        # Normal + attack interleaved
npm run simulate:edge         # Edge cases
npm run simulate:stress       # 500 events (add --count=1000)
```

## Generic CLI

```bash
node scripts/simulate.js --scenario=portScan --instant --seed=42
node scripts/simulate.js --scenario=malware --delay=100
node scripts/simulate.js --scenario=falsePositive --dry-run
```

## Folder structure

```
simulator/
├── config.js                 # API URL + key
├── docs/
│   ├── EVENT_SCHEMA.md       # Event JSON schema
│   └── SCENARIOS.md          # Scenario matrix
├── lib/
│   ├── apiClient.js          # sendEventToApi()
│   ├── rng.js                # Seeded random + utilities
│   ├── runner.js             # runSimulation(), CLI parser
│   ├── summary.js            # Console summary output
│   ├── dataset/index.js      # Users, IPs, metadata pools
│   ├── generators/events.js  # Event factory functions
│   └── scenarios/index.js    # All 15 scenarios
└── scripts/
    ├── simulate.js           # Main entry point
    ├── run-normal.js
    ├── run-attack.js
    ├── run-mixed.js
    ├── run-edge.js
    ├── run-stress.js
    └── run-full-demo.js
```

## Documentation

- [Event Schema](docs/EVENT_SCHEMA.md)
- [Scenarios](docs/SCENARIOS.md)

## Requirements

- Backend running on `http://localhost:4000`
- `SIMULATOR_API_KEY` in `simulator/.env` matching `backend/.env`
