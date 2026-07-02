# Architecture

## Components

| Component | Stack | Default port | Role |
|-----------|-------|--------------|------|
| Frontend | React, Vite, Tailwind | 5173 | Analyst dashboard |
| Backend | Node.js, Express, MongoDB | 4000 | API, auth, detection, cases |
| AI service | Python, FastAPI, LangGraph | 8000 | Investigation agents |
| Simulator | Node.js scripts | — | Sends fake security events |

## Data flow

```
Simulator / live generator
        │
        ▼
  POST /api/events  ──►  MongoDB (events)
        │
        ▼
  Detection engine  ──►  alerts  ──►  cases (incidents)
        │
        ▼
  Analyst triggers investigation
        │
        ▼
  Backend calls AI service  ──►  agent outputs stored on case
        │
        ▼
  SOC report generated  ──►  reports list
```

1. Events arrive as JSON and are stored per workspace user.
2. Detection rules evaluate incoming events and create alerts.
3. Related alerts are correlated into cases.
4. An analyst runs AI investigation; the backend proxies to the AI service.
5. Agents (triage, investigation, classification, mitigation, report, reviewer) write structured outputs.
6. Playbook actions are created but need human approval before simulated execution.

## Security model

- JWT auth on all dashboard API routes.
- Roles: `viewer` (read-only), `analyst` (operate), `admin` (includes rule sync).
- Write endpoints use middleware that checks role before the controller runs.
- The simulator uses an API key for event ingestion, separate from user JWTs.
- The AI service is internal — the frontend talks to it through the backend only.

## Main backend modules

- `routes/` — HTTP endpoints
- `services/detection/` — rule engine
- `services/incident/` — case grouping and timeline
- `services/ai/` — investigation orchestration + fallback when AI service is down
- `services/playbook/` — SOAR action queue with approval flow
- `models/` — MongoDB schemas (User, SecurityEvent, Alert, Incident, etc.)

## Frontend structure

- `pages/` — route-level views (Dashboard, Events, Alerts, Cases, …)
- `components/layout/` — sidebar, top bar, mobile nav
- `components/dashboard/` — dashboard widgets
- `api/` — axios client with JWT interceptor

## Deployment notes

The repo includes `docker-compose.yml` and `render.yaml` for container-based deploys. Environment variables are documented in `.env.example` at the repo root and in each service folder.
