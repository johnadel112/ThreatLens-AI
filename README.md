# ThreatLens AI

ThreatLens AI is a security operations dashboard for working with simulated SIEM-style events. It ingests JSON security logs, runs detection rules, groups alerts into cases, and can run an AI-assisted investigation workflow that produces SOC reports.

All event data is simulated — nothing in this project connects to real production systems.

## What's in the repo

| Folder | What it does |
|--------|----------------|
| `frontend/` | React dashboard (Vite + Tailwind) |
| `backend/` | Express API, auth, detection engine, cases |
| `ai-service/` | FastAPI service for multi-agent investigations |
| `simulator/` | Scripts that send sample event traffic |

See [architecture.md](architecture.md) for how the pieces connect.

## Run locally

**Requirements:** Node 18+, Python 3.11+, MongoDB

```bash
cp .env.example .env

# Terminal 1 — backend
cd backend && npm install && npm run dev

# Terminal 2 — AI service
cd ai-service && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 3 — frontend
cd frontend && npm install && npm run dev
```

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:5173 |
| API | http://localhost:4000/health |
| AI service | http://localhost:8000/health |

### Docker

```bash
docker compose up --build -d
```

Dashboard: http://localhost:3000

## Roles

Three roles are supported:

| Role | Access |
|------|--------|
| **Viewer** | Read events, alerts, cases, reports, audit logs |
| **Analyst** | Everything a viewer can do, plus investigate cases, update alerts, approve SOAR actions |
| **Admin** | Everything an analyst can do, plus detection rule sync |

You can pick a role when registering. Demo seed users may also exist if you run the backend seed script.

## Health checks

- Backend: `GET /health`
- AI service: `GET /health` (not `/api/health`)

## License

MIT
