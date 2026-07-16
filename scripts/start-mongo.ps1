$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dataPath = Join-Path $root ".mongodb-data"
$logPath = Join-Path $root "logs"

New-Item -ItemType Directory -Force -Path $dataPath, $logPath | Out-Null

$client = New-Object Net.Sockets.TcpClient
try {
  $connection = $client.BeginConnect("127.0.0.1", 27017, $null, $null)
  if ($connection.AsyncWaitHandle.WaitOne(500)) {
    $client.EndConnect($connection)
    Write-Host "MongoDB is already running on 127.0.0.1:27017."
    exit 0
  }
} catch {
} finally {
  $client.Close()
}

$mongod = (Get-Command mongod -ErrorAction SilentlyContinue).Source
if (-not $mongod) {
  $defaultPath = "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
  if (Test-Path $defaultPath) {
    $mongod = $defaultPath
  }
}

if (-not $mongod) {
  throw "Could not find mongod.exe. Install MongoDB Community Server or add mongod to PATH."
}

& $mongod --dbpath $dataPath --bind_ip 127.0.0.1 --port 27017 --logpath (Join-Path $logPath "mongod.log") --logappend
