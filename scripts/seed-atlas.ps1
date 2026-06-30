# Seed ThreatLens demo users into MongoDB Atlas
# Usage: .\scripts\seed-atlas.ps1 -Password "your-atlas-password"

param(
    [Parameter(Mandatory = $true)]
    [string]$Password
)

$ErrorActionPreference = "Stop"
$encoded = [uri]::EscapeDataString($Password)
$uri = "mongodb+srv://johnadel02_db_user:${encoded}@cluster0.buoz3kp.mongodb.net/threatlens?retryWrites=true&w=majority&appName=Cluster0"

Write-Host "Seeding demo users to Atlas..."
Push-Location (Join-Path $PSScriptRoot "..\backend")
$env:MONGODB_URI = $uri
node scripts/seed-users.js
Pop-Location

Write-Host ""
Write-Host "Done. Login with analyst@threatlens.local / Analyst123!"
