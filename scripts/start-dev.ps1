$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "client\dist\index.html"

if (-not (Test-Path $dist)) {
  Write-Host "The React build is missing, so building it once..."
  npm run build --prefix client
}

Write-Host ""
Write-Host "Starting Hour Calculator at http://127.0.0.1:5000"
Write-Host "Press Ctrl+C here to stop the app."
node (Join-Path $root "server/index.js")
