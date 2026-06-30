# ThreatLens AI — Stable Cloudflare Tunnel URL

Get a **fixed HTTPS URL** (e.g. `https://threatlens.yourdomain.com`) that always points to your local Docker stack. Free on Cloudflare — no VM, no MongoDB Atlas.

**You need:** a domain added to your Cloudflare account (any registrar; Cloudflare DNS is free).

---

## Overview

```
Browser → https://threatlens.yourdomain.com (Cloudflare)
       → cloudflared on your PC
       → http://localhost:3000 (Docker frontend)
       → nginx /api → backend → MongoDB
```

The frontend proxies `/api` to the backend, so **login works** without extra CORS setup.

---

## Part 1 — Domain on Cloudflare

Skip if you already see your domain under **Websites** in the Cloudflare dashboard.

1. Buy a domain (Namecheap, Google Domains, Porkbun, etc.) **or** use one you own.
2. In Cloudflare: **Websites → Add a site** → enter the domain.
3. Choose the **Free** plan.
4. Cloudflare shows two nameservers — set those at your registrar.
5. Wait until the site status is **Active** (often 5–30 minutes).

You will use a **subdomain** for ThreatLens, e.g. `threatlens.yourdomain.com` — you do not need a separate domain.

---

## Part 2 — Install cloudflared (Windows)

```powershell
winget install Cloudflare.cloudflared
```

Or download: [cloudflared Windows amd64](https://github.com/cloudflare/cloudflared/releases/latest)

Close and reopen PowerShell, then:

```powershell
cloudflared --version
```

---

## Part 3 — Log in cloudflared to your account

This links the CLI to Cloudflare (separate from logging into the website):

```powershell
cloudflared tunnel login
```

1. Browser opens → pick the **zone (domain)** you want to use.
2. Click **Authorize**.
3. A certificate is saved to `%USERPROFILE%\.cloudflared\cert.pem`.

---

## Part 4 — Create the tunnel

```powershell
cloudflared tunnel create threatlens
```

Note the **Tunnel ID** (UUID) in the output. Credentials are saved to:

```
%USERPROFILE%\.cloudflared\<TUNNEL-ID>.json
```

List tunnels anytime:

```powershell
cloudflared tunnel list
```

---

## Part 5 — DNS: stable hostname

Replace `yourdomain.com` with your real domain:

```powershell
cloudflared tunnel route dns threatlens threatlens.yourdomain.com
```

This creates a CNAME: `threatlens.yourdomain.com` → your tunnel.

Check in Cloudflare dashboard: **DNS → Records** — you should see the CNAME (proxied, orange cloud).

---

## Part 6 — Config file

Create `%USERPROFILE%\.cloudflared\config.yml`.

**Option A — copy the project template** (edit tunnel ID and hostname):

```powershell
cd "C:\Users\Hp\Desktop\ThreatLens AI"
.\scripts\start-cloudflare-tunnel.ps1 -Hostname threatlens.yourdomain.com
```

**Option B — manual** — edit `config.yml`:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: C:\Users\Hp\.cloudflared\<YOUR-TUNNEL-ID>.json

ingress:
  - hostname: threatlens.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

Use your Windows username in the path if not `Hp`.

---

## Part 7 — Start ThreatLens + tunnel

**Terminal 1 — Docker** (if not already running):

```powershell
cd "C:\Users\Hp\Desktop\ThreatLens AI"
docker compose up -d
docker compose exec backend node scripts/seed-users.js
```

Confirm http://localhost:3000 works locally.

**Terminal 2 — Tunnel:**

```powershell
cloudflared tunnel run threatlens
```

Or without a named tunnel in config:

```powershell
cloudflared tunnel --config $env:USERPROFILE\.cloudflared\config.yml run
```

Open **https://threatlens.yourdomain.com** — login: `analyst@threatlens.local` / `Analyst123!`

---

## Part 8 — Run tunnel on Windows startup (optional)

Install as a Windows service (run PowerShell **as Administrator**):

```powershell
cloudflared service install
```

The service reads `%USERPROFILE%\.cloudflared\config.yml`. Start it:

```powershell
Start-Service cloudflared
```

To remove later:

```powershell
cloudflared service uninstall
```

> Docker must also start on boot if you want the site up without manual steps (`docker compose up -d` or Docker Desktop “Start on login”).

---

## Simulator (demo events)

The simulator posts to the backend on your PC (not through the public URL):

```env
# simulator/.env
BACKEND_URL=http://localhost:4000/api
SIMULATOR_API_KEY=simulator-docker-key
```

```powershell
cd "C:\Users\Hp\Desktop\ThreatLens AI\simulator"
npm run simulate:full-demo -- --instant
```

Refresh your stable URL to see events.

---

## Troubleshooting

### `cloudflared tunnel login` — no zones listed

- Domain must be **Active** on Cloudflare (nameservers updated at registrar).

### 502 / 1033 error on the URL

- Docker running? `docker compose ps`
- Tunnel running? `cloudflared tunnel run threatlens`
- Local check: http://localhost:3000

### Wrong tunnel or credentials

```powershell
cloudflared tunnel list
cloudflared tunnel info threatlens
```

Confirm `tunnel:` and `credentials-file:` in `config.yml` match the tunnel ID.

### Login works locally but not on Cloudflare URL

Rare with Docker (same-origin `/api`). If you changed `API_URL` to an absolute backend URL, revert to `/api` in Docker or tunnel **only** port 3000.

### URL shows Cloudflare error after PC sleep

Restart tunnel and ensure Docker is up:

```powershell
docker compose up -d
cloudflared tunnel run threatlens
```

---

## Quick reference

| Item | Value |
|------|--------|
| Stable URL | `https://threatlens.yourdomain.com` |
| Local dashboard | http://localhost:3000 |
| Config | `%USERPROFILE%\.cloudflared\config.yml` |
| Tunnel name | `threatlens` |
| Demo login | `analyst@threatlens.local` / `Analyst123!` |

---

## vs Oracle VM

| | Cloudflare Tunnel | Oracle VM |
|---|-------------------|-----------|
| Stable HTTPS URL | Yes (your subdomain) | HTTP on IP unless you add TLS |
| PC must be on | Yes | No |
| Setup | Domain + tunnel | VM + firewall + SSH |

For portfolio demos with a **professional URL**, Cloudflare Tunnel is usually the better fit.
