<?php
/**
 * Cron quotidien — rappels d'abonnement (sans renouvellement automatique).
 *
 * Usage CLI uniquement (Windows / Linux) :
 *   php backend-php/cron/abonnement_rappels.php
 *
 * Planification Windows (Planificateur de tâches) :
 *   Programme : C:\xampp\php\php.exe
 *   Arguments : C:\xampp\htdocs\zovu-project\backend-php\cron\abonnement_rappels.php
 *   Déclencheur : quotidien, ex. 08:00
 *   Ou : .\backend-php\cron\install-abonnement-rappels-task.ps1
 *
 * Linux crontab :
 *   0 8 * * * /usr/bin/php /var/www/zovu/backend-php/cron/abonnement_rappels.php >> /var/log/zovu-abonnement-rappels.log 2>&1
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
  http_response_code(403);
  header('Content-Type: text/plain; charset=utf-8');
  echo "CLI only\n";
  exit(1);
}

require __DIR__ . '/../helpers.php';

$result = process_abonnement_reminders();
$line = '[' . date('c') . '] ' . json_encode($result, JSON_UNESCAPED_UNICODE) . PHP_EOL;
echo $line;
