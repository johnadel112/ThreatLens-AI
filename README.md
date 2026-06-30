# ThreatLens AI

**AI-Powered Security Operations Platform**

ThreatLens AI is a full-stack SOC-style platform that collects simulated security events, detects suspicious activity using rule-based detection, groups alerts into incidents, and uses a multi-agent AI workflow to generate timelines, root-cause analysis, mitigation recommendations, and professional SOC reports.

> This project uses **safe, simulated JSON security logs** — not real company data or harmful traffic.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Simulator  │────▶│   Backend    │────▶│   MongoDB   │
└─────────────┘     │  (Express)   │     └─────────────┘
                    │              │
┌─────────────┐     │  Detection   │     ┌─────────────┐
│   React     │────▶│  Engine      │────▶│ AI Service  │
│  Dashboard  │     └──────────────┘     │  (FastAPI)  │
└─────────────┘                          └─────────────┘
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT |
| AI Service | Python, FastAPI, LangGraph |
| DevOps | Docker, Docker Compose, GitHub Actions |

## Project Structure

```
threatlens-ai/
├── backend/        # Express API, detection engine, auth
├── frontend/       # React SOC dashboard
├── ai-service/     # Multi-agent AI workflow (FastAPI)
├── simulator/      # Event traffic generator scripts
└── docs/           # Architecture and deployment guides
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB 7+ (local or Docker)

### 1. Clone and configure

```bash
git clone <repo-url>
cd threatlens-ai
cp .env.example .env
# Edit .env with your values
```

### 2. Start MongoDB

```bash
# Local install, or:
docker run -d -p 27017:27017 --name threatlens-mongo mongo:7
```

### 3. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed    # optional: create demo users
npm run seed:events  # optional: send sample security events
npm run dev
# → http://localhost:4000/health
```

**Demo accounts** (after `npm run seed`):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@threatlens.local | Admin123! |
| Analyst | analyst@threatlens.local | Analyst123! |
| Viewer | viewer@threatlens.local | Viewer123! |

### 4. AI Service

```bash
cd ai-service
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/health
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 6. Simulator

```bash
cd simulator
npm install
npm run attack    # brute force demo scenario
npm run normal    # baseline traffic
npm run mixed     # normal + attack + normal
```

## Docker (recommended for demos)

```bash
# From repository root
docker compose up --build -d

# Seed demo users
docker compose exec backend node scripts/seed-users.js
```

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3000 |
| Backend | http://localhost:4000/health |
| AI Service | http://localhost:8000/health |

See [docs/deployment.md](docs/deployment.md) for full Docker documentation.

## Health Checks

| Service | Endpoint |
|---------|----------|
| Backend | `GET http://localhost:4000/health` |
| AI Service | `GET http://localhost:8000/health` |
| Frontend (dev) | `http://localhost:5173` |
| Frontend (Docker) | `http://localhost:3000` |

## Development Roadmap

| Week | Focus |
|------|-------|
| 1 | Project setup, health endpoints, README |
| 2 | Authentication, JWT, RBAC, login/register |
| 3 | Event collector API and Events page |
| 4 | Event simulator (normal, attack, mixed) |
| 5 | Detection engine and Alerts page |
| 6 | Incident management and detail pages |
| 7 | Basic AI integration and incident summaries |
| 8 | Multi-agent LangGraph workflow |
| 9 | Playbook automation |
| 10 | UI polish and reporting |
| 11 | Docker and CI/CD |
| 12 | Portfolio package |

## License

MIT
