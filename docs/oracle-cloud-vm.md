# ThreatLens AI — Oracle Cloud VM Setup (Step by Step)

Deploy the full stack (MongoDB + backend + AI + frontend) on Oracle Cloud **Always Free** — no MongoDB Atlas, no credit card charges on the free tier.

**Time:** ~30–45 minutes first time.

---

## Part 1 — Create Oracle Cloud account

1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/).
2. Click **Start for free** and complete signup.
3. Choose your **Home Region** carefully — Always Free resources only exist in that region and **cannot be moved later**.
4. Verify email and complete account setup.

---

## Part 2 — Create the VM

### 2.1 Open Compute

1. Sign in to [cloud.oracle.com](https://cloud.oracle.com).
2. Open the **navigation menu** (☰) → **Compute** → **Instances**.
3. Click **Create instance**.

### 2.2 Name and image

| Field | Value |
|-------|-------|
| Name | `threatlens-vm` |
| Compartment | (keep default root) |
| Image | **Canonical Ubuntu 22.04** (or 24.04) |
| Shape | **Ampere** → `VM.Standard.A1.Flex` |
| OCPUs | `2` (or up to 4 on free tier) |
| Memory | `12 GB` (or up to 24 GB) |

> If Ampere is unavailable in your region, pick **AMD** `VM.Standard.E2.1.Micro` (Always Free eligible).

### 2.3 Networking

- **Virtual cloud network:** Create new VCN (default wizard is fine).
- **Subnet:** Public subnet.
- **Public IPv4 address:** **Assign a public IPv4 address** ✅ (required).

### 2.4 SSH key (important)

Under **Add SSH keys**:

- Choose **Generate a key pair for me**.
- Click **Save private key** → save as `oci-threatlens.key` (e.g. in `C:\Users\Hp\.ssh\`).
- Click **Save public key** (optional backup).

You need the **private key** to connect from Windows.

### 2.5 Create

Click **Create**. Wait until the instance state is **Running** (green).

Copy the **Public IP address** (e.g. `129.146.xxx.xxx`).

---

## Part 3 — Open firewall ports (Oracle Security List)

Oracle blocks traffic until you add **Ingress Rules**.

1. On the instance page, click the **Subnet** link (under Instance details).
2. Click the **Security List** name.
3. Click **Add Ingress Rules** and add these **one at a time** (or one rule with multiple ports):

| Source CIDR | Protocol | Dest port | Description |
|-------------|----------|-----------|-------------|
| `0.0.0.0/0` | TCP | 22 | SSH |
| `0.0.0.0/0` | TCP | 3000 | ThreatLens dashboard |
| `0.0.0.0/0` | TCP | 4000 | Backend API (simulator) |

Click **Add Ingress Rules** after each (or add one rule with port range if your UI allows).

> Using `0.0.0.0/0` allows access from anywhere — fine for a demo VM. For production, restrict to your IP.

---

## Part 4 — Connect from Windows (PowerShell)

### 4.1 Fix key permissions (first time only)

```powershell
# Move key to .ssh if needed
mkdir $env:USERPROFILE\.ssh -ErrorAction SilentlyContinue
# If key is elsewhere, adjust path:
$key = "$env:USERPROFILE\.ssh\oci-threatlens.key"

# OpenSSH on Windows often works without chmod; if SSH fails, use:
icacls $key /inheritance:r
icacls $key /grant:r "$($env:USERNAME):(R)"
```

### 4.2 SSH into the VM

Replace `YOUR_PUBLIC_IP` with the IP from Part 2.5:

```powershell
ssh -i $env:USERPROFILE\.ssh\oci-threatlens.key ubuntu@YOUR_PUBLIC_IP
```

First connection: type `yes` when asked about host authenticity.

You should see an `ubuntu@threatlens-vm` prompt.

---

## Part 5 — Deploy ThreatLens on the VM

Run these commands **on the VM** (after SSH):

### Option A — Automated script

```bash
curl -fsSL https://raw.githubusercontent.com/johnadel112/ThreatLens-AI/master/scripts/deploy-vm.sh -o deploy-vm.sh
chmod +x deploy-vm.sh
./deploy-vm.sh
```

If Docker was just installed, **log out and SSH back in**, then run `./deploy-vm.sh` again.

### Option B — Manual steps

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-v2
sudo usermod -aG docker $USER
```

Log out and SSH back in, then:

```bash
git clone https://github.com/johnadel112/ThreatLens-AI.git
cd ThreatLens-AI

# Set CORS so login works from your public IP
PUBLIC_IP=$(curl -s ifconfig.me)
echo "CORS_ORIGIN=http://${PUBLIC_IP}:3000" >> .env
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env

docker compose up -d --build
sleep 20
docker compose exec backend node scripts/seed-users.js
```

---

## Part 5b — Free hostname with DuckDNS (optional)

Instead of bookmarking a raw IP, use a free subdomain like `threatlens.duckdns.org`.

### 1. Create the hostname

1. Sign in at [duckdns.org](https://www.duckdns.org/).
2. Create a subdomain (e.g. `threatlens` → `threatlens.duckdns.org`).
3. Set **current IP** to your VM **public IP** (same IP shown on the Oracle instance page).

### 2. Deploy with DuckDNS CORS (on the VM)

```bash
export DUCKDNS_DOMAIN=threatlens.duckdns.org
./deploy-vm.sh
```

Or if already deployed, fix CORS and restart:

```bash
cd ~/ThreatLens-AI
sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=http://threatlens.duckdns.org:3000|' .env
docker compose up -d --force-recreate backend
```

Replace `threatlens.duckdns.org` with your subdomain.

### 3. Open the app

```
http://threatlens.duckdns.org:3000
```

> **Include `:3000`** — DuckDNS only maps the hostname to your IP; the port is still required.

Health check: `http://threatlens.duckdns.org:4000/health`

### 4. Keep IP in sync

If Oracle assigns a new public IP after a reboot, update DuckDNS (website or API). DuckDNS also offers a simple update URL you can cron on the VM.

---

## Part 6 — Open the app

In your browser (on your PC):

```
http://YOUR_PUBLIC_IP:3000
```

**Login:**

| Email | Password |
|-------|----------|
| `analyst@threatlens.local` | `Analyst123!` |

Health check:

```
http://YOUR_PUBLIC_IP:4000/health
```

---

## Part 7 — Load demo security events (optional)

On your **Windows PC**:

```powershell
cd "C:\Users\Hp\Desktop\ThreatLens AI\simulator"
```

Edit `simulator/.env`:

```env
BACKEND_URL=http://YOUR_PUBLIC_IP:4000/api
SIMULATOR_API_KEY=simulator-docker-key
```

```powershell
npm run simulate:full-demo -- --instant
```

Then refresh the dashboard on the VM URL.

---

## Troubleshooting

### SSH: Permission denied (publickey)

- Confirm username is `ubuntu` (for Canonical Ubuntu image).
- Confirm key path: `ssh -i path\to\oci-threatlens.key ubuntu@IP`
- Re-download key only by recreating instance if lost (you cannot recover a lost private key).

### SSH: Connection timed out

- Instance must be **Running**.
- Security List must allow port **22**.
- Instance must have a **public IP**.

### Browser: Cannot reach `:3000`

- Security List allows ports **3000** and **4000**.
- On VM, check containers: `docker compose ps`
- On VM, check logs: `docker compose logs backend`

### Login fails / CORS error

On the VM:

```bash
cd ~/ThreatLens-AI
PUBLIC_IP=$(curl -s ifconfig.me)
grep CORS_ORIGIN .env || echo "CORS_ORIGIN=http://${PUBLIC_IP}:3000" >> .env
docker compose up -d --force-recreate backend frontend
```

### `docker compose` not found

```bash
sudo apt install -y docker-compose-v2
# or use: docker compose (with space)
```

### Out of memory during build

Use a smaller parallel build or add swap:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## Useful VM commands

```bash
cd ~/ThreatLens-AI
docker compose ps              # status
docker compose logs -f backend # backend logs
docker compose restart         # restart all
docker compose down            # stop all
docker compose up -d           # start again
```

---

## Cost

**Always Free** Ampere + Ubuntu + Docker MongoDB = **$0/month** as long as you stay within Oracle Free Tier limits.

No MongoDB Atlas required.
