# EZOA-TO — exécute toutes les migrations SQL sur la base locale (PowerShell / XAMPP)
# Usage : cd backend-php ; .\migrate-all.ps1
#         .\migrate-all.ps1 -DbName zovu -Mysql "C:\xampp\mysql\bin\mysql.exe"

param(
  [string]$DbName = "zovu",
  [string]$Mysql = "C:\xampp\mysql\bin\mysql.exe"
)

$ErrorActionPreference = "Continue"
$here = $PSScriptRoot

if (-not (Test-Path $Mysql)) {
  Write-Host "mysql introuvable : $Mysql" -ForegroundColor Red
  Write-Host "Indiquez le chemin avec -Mysql" -ForegroundColor Yellow
  exit 1
}

$migrations = @(
  "migration-paiements.sql",
  "migration-portefeuille.sql",
  "migration-faq.sql",
  "migration-corriges.sql",
  "migration-partenaires.sql",
  "migration-password-reset.sql",
  "migration-user-telephone.sql",
  "migration-user-profile-classe.sql",
  "migration-platform-settings.sql",
  "migration-platform-settings-contact.sql",
  "migration-push-notifications.sql",
  "migration-notification-rules.sql",
  "migration-abonnements.sql",
  "migration-abonnements-rappels.sql",
  "migration-villes-togo.sql",
  "migration-villes-cleanup.sql",
  "migration-etablissements-cleanup.sql",
  "migration-etablissements-encoding-fix.sql",
  "migration-classes.sql",
  "migration-classes-techniques.sql",
  "migration-favoris.sql"
)

Write-Host "Base cible : $DbName" -ForegroundColor Cyan
$failed = @()

foreach ($file in $migrations) {
  $path = Join-Path $here $file
  if (-not (Test-Path $path)) {
    Write-Host "[SKIP] $file (fichier absent)" -ForegroundColor Yellow
    continue
  }
  Write-Host "[RUN]  $file ..." -NoNewline
  $out = Get-Content $path -Raw -Encoding UTF8 | & $Mysql -u root $DbName 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host $out
    $failed += $file
  } else {
    Write-Host " OK" -ForegroundColor Green
  }
}

$seed = Join-Path $here "seed.sql"
if (Test-Path $seed) {
  Write-Host "[RUN]  seed.sql (données de référence) ..." -NoNewline
  $out = Get-Content $seed -Raw -Encoding UTF8 | & $Mysql -u root $DbName 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host $out
    $failed += "seed.sql"
  } else {
    Write-Host " OK" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "=== Tables ===" -ForegroundColor Cyan
& $Mysql -u root $DbName -e "SHOW TABLES;"

if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "Échecs : $($failed -join ', ')" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Toutes les migrations sont à jour." -ForegroundColor Green
