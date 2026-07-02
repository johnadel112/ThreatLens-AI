# Load ThreatLens demo events into production (Railway) or local backend
# Prerequisite: SIMULATOR_API_KEY must match backend env (Railway → Variables)

$ErrorActionPreference = "Stop"
$simDir = Join-Path $PSScriptRoot "..\simulator"
$envFile = Join-Path $simDir ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "Missing simulator/.env — copy from .env.example" -ForegroundColor Red
    exit 1
}

Write-Host "Simulator config ($envFile):"
Get-Content $envFile | ForEach-Object { Write-Host "  $_" }
Write-Host ""
Write-Host "Railway backend must have the same SIMULATOR_API_KEY set, or events will be rejected."
Write-Host ""

Push-Location $simDir
npm run simulate:full-demo -- --instant
Pop-Location
