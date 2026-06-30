# ThreatLens AI — Simulator Scenarios

## Run modes

```bash
npm run simulate:normal          # Benign business day
npm run simulate:attack          # Brute force + exfiltration
npm run simulate:mixed           # Normal + full attack chain
npm run simulate:edge            # Edge cases & validation
npm run simulate:stress          # 500 events (use --count=1000)
npm run simulate:full-demo       # Portfolio end-to-end story (seed 42)

# Generic CLI
npm run simulate -- --scenario=portScan --instant --seed=42
```

## Scenario matrix

| # | Scenario | Key events | Expected detection |
|---|----------|------------|-------------------|
| 1 | normal | logins, downloads, API, backups | None |
| 2 | bruteForce | 7× failed_login same user/IP | Brute Force Login Attempt |
| 3 | accountCompromise | failures → success → new country | Account Compromise |
| 4 | dataExfiltration | 35+ downloads, bulk, DB export | Data Exfiltration |
| 5 | fullAttackChain | Full kill chain | Multiple alerts → one incident |
| 6 | suspiciousAdmin | Off-hours admin_login + policy change | Suspicious Admin Activity |
| 7 | portScan | 15 recon events same IP | Port Scan / Reconnaissance |
| 8 | privilegeEscalation | Login + permission/role change | Privilege Escalation |
| 9 | malware | malware_alert, C2 beacon | Endpoint Malware Activity |
| 10 | ransomware | ransomware_behavior + backup_failed | Critical malware incident |
| 11 | apiAbuse | 85+ api_request, rate limits | API Abuse |
| 12 | falsePositive | 4 failures, 20 downloads | No high/critical alerts |
| 13 | edge | Missing metadata, out-of-order | No crash; invalid rejected |
| 14 | stress | 500–5000 mixed events | Stable ingestion |
| 15 | fullDemo | ~300 events, all attack types | Full SOC demo dataset |

## CLI options

| Flag | Description |
|------|-------------|
| `--scenario=<name>` | Scenario key from table above |
| `--count=<n>` | Event count (normal, stress) |
| `--delay=<ms>` | Delay between POSTs |
| `--instant` | No delay |
| `--seed=<n>` | Deterministic RNG |
| `--start=<ISO>` | Base timestamp |
| `--dry-run` | Print events without sending |

## Duplicate alert prevention

The backend uses `hasOpenAlert()` per rule ID within the detection window. Re-running the same scenario quickly may not create duplicate alerts for the same user/IP.

## Dashboard tips

- Run `simulate:full-demo` for rich charts across severities and event types
- Investigate grouped incidents for AI reports and playbook actions
- Use `--seed=42` for repeatable portfolio demos
