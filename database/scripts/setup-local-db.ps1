# Creates the local role and databases for the portfolio project.
# Usage (from C:\proyectos-portafolio\portafolio):
#   powershell -ExecutionPolicy Bypass -File .\database\scripts\setup-local-db.ps1
# psql will ask for the password of the PostgreSQL superuser (default: postgres).
#
# The application role password is read from database\local\credentials.local.env
# (PORTFOLIO_APP_PASSWORD, gitignored). If that file does not exist, a random
# password is generated and saved there.
param(
  [string]$PgUser = 'postgres',
  [string]$PgHost = 'localhost',
  [int]$PgPort = 5432,
  [string]$AppUser = 'portafolioayllescas',
  [string]$DevDb = 'portafolio_ayllescas',
  [string]$TestDb = 'portafolio_ayllescas_test',
  [string]$PsqlPath = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
)
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $PsqlPath)) { throw "No se encontro psql en $PsqlPath. Usa -PsqlPath para indicarlo." }
if (-not $TestDb.EndsWith('_test')) { throw 'La base de pruebas debe terminar en _test.' }

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$localDir = Join-Path $root 'database\local'
$credFile = Join-Path $localDir 'credentials.local.env'
New-Item -ItemType Directory -Force $localDir | Out-Null

$appPassword = $null
if (Test-Path $credFile) {
  $line = Get-Content $credFile | Where-Object { $_ -like 'PORTFOLIO_APP_PASSWORD=*' } | Select-Object -First 1
  if ($line) { $appPassword = $line.Substring('PORTFOLIO_APP_PASSWORD='.Length) }
}
if (-not $appPassword) {
  $chars = [char[]]'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $appPassword = -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

$env:PORTFOLIO_APP_USER = $AppUser
$env:PORTFOLIO_APP_PASSWORD = $appPassword
$env:PORTFOLIO_DEV_DB = $DevDb
$env:PORTFOLIO_TEST_DB = $TestDb
try {
  Write-Host "Conectando a PostgreSQL como '$PgUser' en ${PgHost}:$PgPort ..."
  & $PsqlPath -U $PgUser -h $PgHost -p $PgPort -d postgres -f (Join-Path $PSScriptRoot 'setup-local-db.sql')
  if ($LASTEXITCODE -ne 0) { throw "psql termino con codigo $LASTEXITCODE" }
} finally {
  'PORTFOLIO_APP_USER', 'PORTFOLIO_APP_PASSWORD', 'PORTFOLIO_DEV_DB', 'PORTFOLIO_TEST_DB' |
    ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
}

# Special characters (/, *, @, ...) must be percent-encoded inside a URL.
$encoded = [uri]::EscapeDataString($appPassword)
$base = "postgresql://${AppUser}:$encoded@${PgHost}:$PgPort"
@(
  '# Generado por setup-local-db.ps1. NO versionar.',
  "PORTFOLIO_APP_USER=$AppUser",
  "PORTFOLIO_APP_PASSWORD=$appPassword",
  "DATABASE_URL=$base/${DevDb}?schema=public",
  "TEST_DATABASE_URL=$base/${TestDb}?schema=public"
) | Set-Content -Encoding ascii $credFile

Write-Host 'Listo. Credenciales locales guardadas en database\local\credentials.local.env'
