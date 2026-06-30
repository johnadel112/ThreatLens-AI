# ThreatLens AI — Simulated Event Schema

All events are ingested via `POST /api/events` with API key authentication.

## Required fields

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Originating system (`web-app`, `auth-service`, etc.) |
| `eventType` | string | Canonical type or alias (`failed_login` → `login_failed`) |
| `timestamp` | ISO 8601 | Event time |
| `severity` | string | `info`, `low`, `medium`, `high`, `critical` |

## Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `username` | string | Affected or acting user |
| `ip` | string | Source IPv4 (documentation ranges only) |
| `metadata` | object | Rich context for dashboard, AI, and detection |

## Metadata fields (recommended)

`userAgent`, `country`, `city`, `deviceId`, `sessionId`, `endpoint`, `httpMethod`, `statusCode`, `resource`, `fileName`, `fileSizeMB`, `downloadCount`, `requestCount`, `port`, `processName`, `commandLine`, `riskScore`, `department`, `role`, `action`, `previousValue`, `newValue`, `reason`

## Severity mapping (default guidance)

| Severity | Example event types |
|----------|---------------------|
| info | `backup_completed`, `logout`, `mfa_success`, `api_request` |
| low | `login_success`, `file_download`, `file_upload` |
| medium | `login_failed`, `mfa_failed`, `config_change` |
| high | `bulk_file_download`, `port_scan`, `malware_alert` |
| critical | `ransomware_behavior`, `audit_log_cleared`, `privilege_escalation` |

## Type aliases (normalized on ingest)

- `failed_login` → `login_failed`
- `successful_login` → `login_success`

See `backend/src/config/eventTypes.js` for the full canonical list.
