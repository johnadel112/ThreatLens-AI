# ThreatLens AI — Cloudflare named tunnel helper (Windows)
# Usage:
#   .\scripts\start-cloudflare-tunnel.ps1 -Hostname threatlens.yourdomain.com
#   .\scripts\start-cloudflare-tunnel.ps1 -Hostname threatlens.yourdomain.com -CreateTunnel
#   .\scripts\start-cloudflare-tunnel.ps1 -Run

param(
    [string]$Hostname = "",
    [string]$TunnelName = "threatlens",
    [switch]$CreateTunnel,
    [switch]$RouteDns,
    [switch]$Run,
    [switch]$Login
)

$ErrorActionPreference = "Stop"
$CloudflaredDir = Join-Path $env:USERPROFILE ".cloudflared"
$ConfigPath = Join-Path $CloudflaredDir "config.yml"

function Ensure-Cloudflared {
    if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
        Write-Host "cloudflared not found. Install with: winget install Cloudflare.cloudflared" -ForegroundColor Red
        exit 1
    }
}

function Get-TunnelId {
    param([string]$Name)
    $list = cloudflared tunnel list 2>&1 | Out-String
    if ($list -match "$Name\s+([0-9a-f-]{36})") {
        return $Matches[1]
    }
    return $null
}

Ensure-Cloudflared
New-Item -ItemType Directory -Force -Path $CloudflaredDir | Out-Null

if ($Login) {
    Write-Host "Opening browser to authorize cloudflared with your Cloudflare account..."
    cloudflared tunnel login
    exit 0
}

if ($CreateTunnel) {
    Write-Host "Creating tunnel '$TunnelName'..."
    cloudflared tunnel create $TunnelName
    $id = Get-TunnelId $TunnelName
    if ($id) { Write-Host "Tunnel ID: $id" -ForegroundColor Green }
    exit 0
}

if ($RouteDns) {
    if (-not $Hostname) {
        Write-Host "Pass -Hostname threatlens.yourdomain.com" -ForegroundColor Red
        exit 1
    }
    Write-Host "Routing DNS: $Hostname -> tunnel $TunnelName"
    cloudflared tunnel route dns $TunnelName $Hostname
    exit 0
}

if ($Hostname) {
    $tunnelId = Get-TunnelId $TunnelName
    if (-not $tunnelId) {
        Write-Host "Tunnel '$TunnelName' not found. Run with -CreateTunnel first:" -ForegroundColor Yellow
        Write-Host "  .\scripts\start-cloudflare-tunnel.ps1 -CreateTunnel"
        exit 1
    }

    $credsFile = Join-Path $CloudflaredDir "$tunnelId.json"
    if (-not (Test-Path $credsFile)) {
        Write-Host "Credentials file missing: $credsFile" -ForegroundColor Red
        exit 1
    }

    $config = @"
tunnel: $tunnelId
credentials-file: $credsFile

ingress:
  - hostname: $Hostname
    service: http://localhost:3000
  - service: http_status:404
"@

    Set-Content -Path $ConfigPath -Value $config -Encoding UTF8
    Write-Host "Wrote $ConfigPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. docker compose up -d   (in repo root)"
    Write-Host "  2. cloudflared tunnel route dns $TunnelName $Hostname"
    Write-Host "  3. .\scripts\start-cloudflare-tunnel.ps1 -Run"
    Write-Host ""
    Write-Host "Stable URL: https://$Hostname"
    exit 0
}

if ($Run) {
    if (-not (Test-Path $ConfigPath)) {
        Write-Host "No config at $ConfigPath — run with -Hostname first." -ForegroundColor Red
        exit 1
    }
    Write-Host "Starting tunnel (Ctrl+C to stop)..."
    cloudflared tunnel --config $ConfigPath run
    exit 0
}

Write-Host @"
ThreatLens Cloudflare Tunnel helper

  Login (once):
    .\scripts\start-cloudflare-tunnel.ps1 -Login

  Create tunnel (once):
    .\scripts\start-cloudflare-tunnel.ps1 -CreateTunnel

  Write config.yml (replace yourdomain.com):
    .\scripts\start-cloudflare-tunnel.ps1 -Hostname threatlens.yourdomain.com

  Add DNS record (once):
    .\scripts\start-cloudflare-tunnel.ps1 -RouteDns -Hostname threatlens.yourdomain.com

  Start tunnel:
    .\scripts\start-cloudflare-tunnel.ps1 -Run

Full guide: docs/cloudflare-tunnel.md
"@
