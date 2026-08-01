# Installe une tâche planifiée Windows pour les rappels d'abonnement (quotidien 08:00).
# Usage (PowerShell en admin recommandé) :
#   cd backend-php\cron
#   .\install-abonnement-rappels-task.ps1
#   .\install-abonnement-rappels-task.ps1 -Hour 7 -Minute 30

param(
  [string]$TaskName = "EZOA-TO Abonnement Rappels",
  [string]$Php = "C:\xampp\php\php.exe",
  [int]$Hour = 8,
  [int]$Minute = 0
)

$ErrorActionPreference = "Stop"
$script = Join-Path $PSScriptRoot "abonnement_rappels.php"

if (-not (Test-Path $Php)) {
  Write-Host "php.exe introuvable : $Php" -ForegroundColor Red
  exit 1
}
if (-not (Test-Path $script)) {
  Write-Host "Script cron introuvable : $script" -ForegroundColor Red
  exit 1
}

$action = New-ScheduledTaskAction -Execute $Php -Argument "`"$script`""
$trigger = New-ScheduledTaskTrigger -Daily -At (Get-Date -Hour $Hour -Minute $Minute -Second 0)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host "Tâche installée : $TaskName ($Hour`:$("{0:D2}" -f $Minute) quotidien)" -ForegroundColor Green
Write-Host "  $Php `"$script`""
Write-Host "Test manuel : & `"$Php`" `"$script`""
