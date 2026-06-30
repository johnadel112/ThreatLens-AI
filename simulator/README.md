# ThreatLens Event Simulator

Generates realistic **simulated** JSON security logs and sends them through the backend API (`POST /api/events`). No direct database access.

## Prerequisites

- Backend running on `http://localhost:4000`
- `SIMULATOR_API_KEY` in `simulator/.env` must match backend `.env`

## Usage

```bash
cd simulator
npm install

# Baseline legitimate activity (~15 events)
npm run normal

# Brute force demo scenario (6 failures → login → 35 downloads)
npm run attack

# Normal traffic + attack + normal traffic
npm run mixed
```

## Options

Pass flags to any script:

```bash
node scripts/run-attack.js --fast      # 50ms delay between events
node scripts/run-attack.js --instant   # no delay
node scripts/run-attack.js --delay 500 # custom delay in ms
node scripts/run-attack.js --dry-run   # preview without API calls
```

## Attack Scenario (Demo Story)

| Phase | Events | Target |
|-------|--------|--------|
| Brute force | 6× `login_failed` | `jdoe` @ `203.0.113.45` |
| Compromise | 1× `login_success` | same user/IP |
| Exfiltration | 35× `file_download` | same user/IP |

These thresholds align with Week 5 detection rules (>5 failures in 5 min, >30 downloads in 10 min).

## Event Types Generated

- `login_failed`, `login_success`, `logout`
- `file_download`, `file_upload`
- `network_access`
- `permission_change`, `admin_action` (attack/mixed variants)

All IPs use RFC 5737 documentation ranges — safe for portfolio demos.
