# ThreatLens AI — MongoDB Atlas + Railway + Vercel

Deploy ThreatLens with:

| Layer | Service | Free tier |
|-------|---------|-----------|
| Database | **MongoDB Atlas** M0 | Free (card for verification) |
| Backend + AI | **Railway** (2 services) | $5 trial credit, then usage-based |
| Frontend | **Vercel** | Free hobby plan |

## Architecture

```
Browser
   │
   ▼
your-app.vercel.app  ──HTTPS API calls──▶  backend.up.railway.app
                                                    │
                                                    ├── MongoDB Atlas (MONGODB_URI)
                                                    └── ai-service.up.railway.app
```

**Deploy order:** Atlas → Railway (AI, then backend) → Vercel (frontend) → seed users → test.

**Time:** ~45–60 minutes first time.

---

## Part 1 — MongoDB Atlas

### 1. Create account and cluster

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → **Try Free**.
2. Create a **M0 FREE** cluster (any cloud provider/region close to you).
3. Wait until cluster status is **Active**.

### 2. Database user

1. **Database Access** → **Add New Database User**.
2. Authentication: **Password**.
3. Username: e.g. `threatlens`.
4. Password: generate a strong password — **save it**.
5. Role: **Atlas admin** (or readWrite on `threatlens` db for tighter security).
6. **Add User**.

### 3. Network access

1. **Network Access** → **Add IP Address**.
2. Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so Railway can connect.
3. **Confirm**.

> Demo only. For production, restrict to Railway egress IPs if available.

### 4. Connection string

1. **Database** → **Connect** → **Drivers**.
2. Copy the connection string, e.g.:
   ```
   mongodb+srv://threatlens:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Replace `<password>` with your URL-encoded password (`@` → `%40`, etc.).
4. Add database name before `?`:
   ```
   mongodb+srv://threatlens:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/threatlens?retryWrites=true&w=majority
   ```

**Save this as `MONGODB_URI`** — you’ll paste it into Railway.

---

## Part 2 — Railway (AI service + backend)

### 1. Create project

1. Go to [railway.app](https://railway.app) → sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo**.
3. Select `johnadel112/ThreatLens-AI` (or your fork).

Railway may create one service from the repo root — we need **two** services.

### 2. Service A — AI service

1. In the project, **+ New** → **GitHub Repo** → same repo (or **Empty Service** → connect repo).
2. Open the service → **Settings**:
   - **Name:** `threatlens-ai`
   - **Root Directory:** `ai-service`
   - **Builder:** Dockerfile (`ai-service/Dockerfile`)
3. **Variables** tab:

| Variable | Value |
|----------|-------|
| `OPENAI_API_KEY` | Your OpenAI key (optional — omit for fallback agents) |
| `MODEL_NAME` | `gpt-4o-mini` |
| `PORT` | Railway sets automatically — leave unless missing |

4. **Settings** → **Networking** → **Generate Domain**.
5. Copy the public URL, e.g. `https://threatlens-ai-production.up.railway.app`
6. Test: `curl https://YOUR-AI-URL/health`

### 3. Service B — Backend

1. **+ New** → **GitHub Repo** → same repo again.
2. **Settings**:
   - **Name:** `threatlens-backend`
   - **Root Directory:** `backend`
   - **Builder:** Dockerfile (`backend/Dockerfile`)
3. **Variables** tab:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Atlas connection string from Part 1 |
| `JWT_SECRET` | Long random string, e.g. `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `8h` |
| `NODE_ENV` | `production` |
| `AI_SERVICE_URL` | `https://YOUR-AI-URL` (no trailing slash) |
| `SIMULATOR_API_KEY` | Random string, e.g. `simulator-prod-key-abc123` |
| `CORS_ORIGINS` | Leave blank for now — set after Vercel deploy |

4. **Networking** → **Generate Domain**.
5. Copy backend URL, e.g. `https://threatlens-backend-production.up.railway.app`
6. Test:
   ```bash
   curl https://YOUR-BACKEND-URL/health
   curl https://YOUR-BACKEND-URL/api/health/ai
   ```

If `/health` fails with DB error, recheck `MONGODB_URI` and Atlas IP allowlist.

### 4. Seed demo users (Railway)

1. Open **threatlens-backend** service.
2. **Settings** → use **Railway CLI** or one-off deploy command.

**Option A — Railway CLI (recommended):**

```powershell
npm i -g @railway/cli
railway login
cd "C:\Users\Hp\Desktop\ThreatLens AI\backend"
railway link
railway run node scripts/seed-users.js
```

**Option B — Local with production URI:**

```powershell
cd backend
$env:MONGODB_URI="mongodb+srv://..."
node scripts/seed-users.js
```

Demo logins after seed:

| Email | Password |
|-------|----------|
| `analyst@threatlens.local` | `Analyst123!` |
| `admin@threatlens.local` | `Admin123!` |

---

## Part 3 — Vercel (frontend)

### 1. Import project

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub.
2. **Add New** → **Project** → import `ThreatLens-AI`.
3. **Root Directory:** click **Edit** → set to `frontend`.

### 2. Build settings

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |

### 3. Environment variables

Add **before** first deploy:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://YOUR-BACKEND-URL/api` (optional) |

Also edit `frontend/vercel.json` — set the `/api` proxy destination to your Railway backend URL:

```json
"destination": "https://YOUR-BACKEND-URL/api/:path*"
```

This proxy lets login work via `/api` on your Vercel domain (no CORS issues).

### 4. Deploy

Click **Deploy**. When finished, copy your Vercel URL, e.g. `https://threatlens-ai.vercel.app`.

### 5. Fix CORS on Railway backend

Go back to Railway → **threatlens-backend** → **Variables**:

```
CORS_ORIGINS=https://your-app.vercel.app
```

Use your exact Vercel URL (no trailing slash). Multiple origins: comma-separated.

Redeploy backend (Railway usually auto-redeploys on env change).

### 6. Test the app

1. Open `https://your-app.vercel.app`
2. Log in: `analyst@threatlens.local` / `Analyst123!`
3. Check dashboard loads without CORS errors (browser DevTools → Network).

---

## Part 4 — Simulator (optional)

On your PC, edit `simulator/.env`:

```env
BACKEND_URL=https://YOUR-BACKEND-URL/api
SIMULATOR_API_KEY=simulator-prod-key-abc123
```

Use the same `SIMULATOR_API_KEY` as Railway backend.

```powershell
cd "C:\Users\Hp\Desktop\ThreatLens AI\simulator"
npm run simulate:full-demo -- --instant
```

Refresh the Vercel dashboard.

---

## Health check checklist

```bash
curl https://YOUR-BACKEND-URL/health
curl https://YOUR-BACKEND-URL/api/health/ai
curl https://YOUR-AI-URL/health
```

| Check | Expected |
|-------|----------|
| Backend `/health` | `{"status":"ok",...}` |
| Backend `/api/health/ai` | AI reachable |
| Vercel site | Login works |
| Simulator | Events appear on dashboard |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Atlas connection failed** | Password URL-encoded? IP `0.0.0.0/0` allowed? DB name `threatlens` in URI? |
| **CORS error on login** | `CORS_ORIGINS` on backend = exact Vercel URL (`https://...`) |
| **API 404 on Vercel** | `VITE_API_URL` must be full backend URL + `/api`, then redeploy Vercel |
| **AI investigation fails** | `AI_SERVICE_URL` on backend = AI Railway URL with `https://` |
| **Login 401** | Run `seed-users.js` against Atlas URI |
| **Simulator 401** | `SIMULATOR_API_KEY` matches backend env |
| **Railway build fails** | Confirm **Root Directory** is `backend` or `ai-service`, not repo root |
| **AI health fails on Railway** | AI Dockerfile uses `$PORT` — pull latest repo |

---

## Cost notes

| Service | Typical demo cost |
|---------|-------------------|
| MongoDB Atlas M0 | Free |
| Vercel Hobby | Free |
| Railway | Trial credit, then ~few $/month if always on |

For a **fully free** stack without a card, use [cloud-deployment-no-atlas.md](./cloud-deployment-no-atlas.md) (Oracle VM + DuckDNS).

---

## Quick reference

| Component | Where | Key env vars |
|-----------|-------|--------------|
| MongoDB | Atlas | Connection string |
| AI | Railway `ai-service/` | `OPENAI_API_KEY` |
| Backend | Railway `backend/` | `MONGODB_URI`, `AI_SERVICE_URL`, `CORS_ORIGINS`, `JWT_SECRET` |
| Frontend | Vercel `frontend/` | `VITE_API_URL` |
| Simulator | Your PC | `BACKEND_URL`, `SIMULATOR_API_KEY` |

---

## Alternative: all on Render

Same Atlas database, all three app services on Render via `render.yaml`. See [cloud-deployment.md](./cloud-deployment.md).
