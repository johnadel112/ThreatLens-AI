# ThreatLens AI — Docker Deployment

## Prerequisites

- Docker Desktop 4.x+ (or Docker Engine + Compose v2)
- 4 GB RAM minimum recommended

## Quick start (all services)

```bash
# From repository root
cp .env.example .env
# Optional: set JWT_SECRET, OPENAI_API_KEY, SIMULATOR_API_KEY in .env

docker compose up --build -d
```

| Service | URL |
|---------|-----|
| **Dashboard** | http://localhost:3000 |
| Backend API | http://localhost:4000/health |
| AI Service | http://localhost:8000/health |
| MongoDB | localhost:27017 |

The frontend container proxies `/api` to the backend — no CORS issues when using port 3000.

## Seed demo data

After containers are healthy:

```bash
docker compose exec backend node scripts/seed-users.js
```

Then run the simulator from your host (not inside Docker):

```bash
cd simulator
# Set BACKEND_URL=http://localhost:4000/api and matching SIMULATOR_API_KEY
npm run simulate:full-demo
```

## Useful commands

```bash
docker compose ps
docker compose logs -f backend
docker compose down
docker compose down -v   # removes MongoDB volume
```

## Environment variables

| Variable | Service | Default |
|----------|---------|---------|
| `JWT_SECRET` | backend | `change-me-docker-jwt-secret` |
| `SIMULATOR_API_KEY` | backend | `simulator-docker-key` |
| `OPENAI_API_KEY` | ai-service | empty (fallback agents) |
| `CORS_ORIGIN` | backend | `http://localhost:3000` |

## Architecture (Docker network)

```
Browser → frontend:80 (/api proxied)
              ↓
         backend:4000 → mongo:27017
              ↓
         ai-service:8000
```

## Production notes

- Change `JWT_SECRET` and `SIMULATOR_API_KEY` before any public deployment
- Put TLS termination behind a reverse proxy (nginx, Caddy, cloud load balancer)
- Do not expose MongoDB port 27017 publicly
- Set `OPENAI_API_KEY` only on the AI service container
