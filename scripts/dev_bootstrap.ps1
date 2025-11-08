param(
  [switch]$Install,
  [switch]$Dev,
  [switch]$Playwright,
  [int]$Port = 3020
)

$ErrorActionPreference = 'Stop'

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

function Ensure-Node {
  Step 'Node version'
  node -v
  try { corepack enable } catch { Write-Warning 'corepack enable skipped' }
}

function Install-Deps {
  Step 'Installing deps (npm ci)'
  npm ci
}

function Start-Dev($Port) {
  Step "Starting Next.js dev on port $Port"
  $env:PORT = [string]$Port
  $env:NODE_OPTIONS = '--max_old_space_size=4096'
  # Forward port to next via args for надежности
  npm run dev -- --port $Port
}

function Start-PlaywrightUI {
  Step 'Installing Playwright deps'
  npm i -D @playwright/test | Out-Null
  npx playwright install
  Step 'Launching Playwright UI'
  npx playwright test --ui
}

Push-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location ..  # go to repo root (scripts/..)

if (-not ($Install -or $Dev -or $Playwright)) { $Install=$true; $Dev=$true }

if ($Install) { Ensure-Node; Install-Deps }
if ($Dev) { Start-Dev -Port $Port }
if ($Playwright) { Start-PlaywrightUI }

Pop-Location
