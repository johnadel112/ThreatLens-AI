# ThreatLens AI — Deploy Without MongoDB Atlas

MongoDB Atlas often asks for a credit card even on the free tier. You **do not need Atlas** — ThreatLens already runs MongoDB inside Docker Compose.

## Choose your path

| Option | Cost | Best for |
|--------|------|----------|
| **[A] Cloudflare Tunnel** | Free, no card | Portfolio demo URL from your PC |
| **[B] Oracle Cloud VM** | Free forever (no card on OCI signup in many regions) | Always-on public deployment |
| **[C] Local Docker** | Free | Development / interviews (screen share) |
| **[D] MongoDB Atlas M0** | Free tier (card for verification only) | If you're OK adding a card |

---

## Option A — Cloudflare Tunnel (easiest, no Atlas, no VM)

Run ThreatLens locally with Docker, expose it on a **public HTTPS URL** for free.

### 1. Start the stack locally

```powershell
cd "ThreatLens AI"
docker compose up -d
docker compose exec backend node scripts/seed-users.js
```

Open http://localhost:3000 to confirm it works.

### 2. Install Cloudflare Tunnel

Download [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) for Windows.

### 3. Quick public URL (no account needed)

```powershell
cloudflared tunnel --url http://localhost:3000
```

Cloudflared prints a URL like:

```
https://random-words.trycloudflare.com
```

Share that link on your portfolio — it routes to your local dashboard.

> Your PC must stay on and Docker running while the demo is live. Free trycloudflare URLs change each time you restart the tunnel.

### 4. Stable URL (named tunnel) — recommended for portfolio

You’re logged into Cloudflare — use a **fixed subdomain** like `https://threatlens.yourdomain.com`.

**Full walkthrough:** [docs/cloudflare-tunnel.md](cloudflare-tunnel.md)

Quick commands (replace `yourdomain.com`):

```powershell
cd "ThreatLens AI"
.\scripts\start-cloudflare-tunnel.ps1 -Login
.\scripts\start-cloudflare-tunnel.ps1 -CreateTunnel
.\scripts\start-cloudflare-tunnel.ps1 -Hostname threatlens.yourdomain.com
.\scripts\start-cloudflare-tunnel.ps1 -RouteDns -Hostname threatlens.yourdomain.com
docker compose up -d
.\scripts\start-cloudflare-tunnel.ps1 -Run
```

---

## Option B — Oracle Cloud Free VM (always-on, no Atlas)

Run the **full Docker Compose stack** including MongoDB on a free VM. No external database.

**Full walkthrough (Windows + OCI console):** [docs/oracle-cloud-vm.md](oracle-cloud-vm.md)

### Quick summary

1. Sign up at [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. Create an **Always Free** Ampere VM (Ubuntu 22.04, 1–4 OCPU, 6–24 GB RAM).
3. Download your SSH private key.

### 2. Open firewall ports

In Oracle **Networking → Virtual Cloud Network → Security List**:

| Port | Purpose |
|------|---------|
| 22 | SSH |
| 3000 | Frontend dashboard |
| 4000 | Backend API (optional, for simulator) |

### 3. Install Docker on the VM

SSH into the VM, then:

```bash
sudo apt update && sudo apt install -y git docker.io docker-compose-v2
sudo usermod -aG docker $USER
# log out and back in
```

### 4. Deploy ThreatLens

```bash
git clone https://github.com/johnadel112/ThreatLens-AI.git
cd ThreatLens-AI

# Optional: set secrets
cp .env.example .env
nano .env   # set JWT_SECRET, SIMULATOR_API_KEY

docker compose up -d --build
docker compose exec backend node scripts/seed-users.js
```

### 5. Access the app

```
http://YOUR_VM_PUBLIC_IP:3000
```

Login: `analyst@threatlens.local` / `Analyst123!`

### Load demo data from your PC

```env
# simulator/.env
BACKEND_URL=http://YOUR_VM_PUBLIC_IP:4000/api
SIMULATOR_API_KEY=simulator-docker-key
```

```bash
npm run simulate:full-demo -- --instant
```

MongoDB runs **inside Docker** on the VM (`mongodb://mongo:27017/threatlens`) — no Atlas.

---

## Option C — Local Docker only (no cloud)

What you already have deployed:

```powershell
docker compose up -d
```

Use for development, recordings, and live demos via screen share. No cloud costs at all.

---

## Option D — MongoDB Atlas (if card is OK)

Atlas **M0 is free** (512 MB) — the card is usually for identity verification, not a monthly charge. If that works for you, see [cloud-deployment.md](./cloud-deployment.md) for Render + Atlas.

---

## Render without Atlas?

Render’s free tier **does not include persistent MongoDB storage**. To use Render for app services you still need a database somewhere:

- Atlas (card required), or
- MongoDB on a separate VM (Option B), pointing `MONGODB_URI` to `mongodb://YOUR_VM_IP:27017/threatlens` (not recommended — expose DB carefully), or
- Skip Render and use **Option A or B** instead.

**Recommendation:** Use **Option A** for quick portfolio links, or **Option B** for a permanent public deployment — both avoid Atlas entirely.

---

## Comparison summary

```
Option A (Tunnel):     Your PC → Docker (with Mongo) → cloudflared → public HTTPS
Option B (Oracle VM):  VM → Docker Compose (mongo + backend + ai + frontend)
Option C (Local):      Your PC → Docker Compose only
Render + Atlas:        Render services → Atlas MongoDB (card required)
```
