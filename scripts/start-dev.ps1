# ThreatLens AI — start all dev services (Windows PowerShell)
# Usage: .\scripts\start-dev.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Stop-PortListener {
    param([int]$Port)
    $seen = @{}
    $lines = netstat -ano | Select-String ":$Port\s"
    foreach ($line in $lines) {
        if ($line -match '\s+(\d+)\s*$') {
            $processId = [int]$Matches[1]
            if ($processId -gt 0 -and $processId -ne $PID -and -not $seen[$processId]) {
                $seen[$processId] = $true
                Write-Host "Stopping PID $processId on port $Port..."
                cmd /c "taskkill /PID $processId /F >nul 2>&1"
            }
        }
    }
}

Write-Host "Freeing ports 4000, 8000, 5173..."
Stop-PortListener 4000
Stop-PortListener 8000
Stop-PortListener 5173
Start-Sleep -Seconds 2

Write-Host "Starting backend (port 4000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev"

Write-Host "Starting AI service (port 8000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\ai-service'; python -m uvicorn app.main:app --port 8000"

Write-Host "Starting frontend (port 5173)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Services starting:"
Write-Host "  Backend:    http://localhost:4000/health"
Write-Host "  AI service: http://localhost:8000/health"
Write-Host "  Frontend:   http://localhost:5173"
Write-Host ""
Write-Host "Login: analyst@threatlens.local / Analyst123!"
