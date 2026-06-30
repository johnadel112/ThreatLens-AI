# ThreatLens AI — Architecture Overview

## System Components

| Component | Tech | Port | Purpose |
|-----------|------|------|---------|
| Frontend | React + Vite + Tailwind | 5173 | SOC analyst dashboard |
| Backend | Node.js + Express | 4000 | API, auth, detection, incidents |
| AI Service | Python + FastAPI + LangGraph | 8000 | Multi-agent investigation |
| Simulator | Node.js scripts | — | Generates simulated security events |
| Database | MongoDB | 27017 | Events, alerts, incidents, users |

## Data Flow

1. **Simulator** sends JSON events → `POST /api/events`
2. **Backend** validates, stores event, runs detection rules
3. **Detection engine** creates alerts, groups into incidents
4. **Analyst** triggers investigation → backend calls AI service
5. **AI agents** (triage → investigation → classification → mitigation → report → reviewer) produce outputs
6. **Analyst** reviews evidence, approves playbook actions

## Security Model

- JWT authentication with roles: `admin`, `analyst`, `viewer`
- Simulator uses API key (not user JWT)
- AI service is internal-only (backend proxy)
- Playbook actions require human approval before simulated execution

## Week 2 Status

- [x] Monorepo structure
- [x] Backend health endpoint + MongoDB connection
- [x] Frontend shell with SOC-themed layout
- [x] AI service health endpoint
- [x] Simulator CLI stub
- [x] User registration and login (JWT)
- [x] Role-based access control (admin, analyst, viewer)
- [x] Protected dashboard routes
- [x] Demo user seed script
- [x] SecurityEvent model and event ingestion API
- [x] GET /api/events with filtering and pagination
- [x] Events page with searchable table
- [x] Event simulator — normal, attack, and mixed traffic scripts
- [x] Rule-based detection engine with 6 detection rules
- [x] Alert creation and Alerts API
- [x] Alerts dashboard page
- [x] Incident model, grouping, and timeline builder
- [x] Incidents list and detail pages
- [x] AI service integration with evidence-based summary (LLM or fallback)
- [x] POST /api/incidents/:id/investigate and AgentOutput storage
- [x] LangGraph multi-agent workflow (6 agents)
- [x] Agent Activity page with workflow stepper
- [x] PlaybookAction model with approve/reject/execute flow
- [x] Simulated playbook execution with audit log
- [x] Mitigation Playbook panel on incident detail
- [x] SOC dashboard with Recharts (KPIs, severity, status, timeline)
- [x] Reports page with markdown viewer and export (MD download, print/PDF)
- [x] Docker Compose stack (MongoDB, backend, AI service, frontend)
- [x] GitHub Actions CI (tests, builds, Docker compose build)
- [x] Render blueprint (`render.yaml`) + MongoDB Atlas cloud deployment guide
