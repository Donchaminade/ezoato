<?php
/**
 * Cron quotidien — rappels d'abonnement (sans renouvellement automatique).
 *
 * Usage CLI (Windows / Linux) :
 *   php backend-php/cron/abonnement_rappels.php
 *
 * Planification Windows (Planificateur de tâches) :
 *   Programme : C:\xampp\php\php.exe
 *   Arguments : C:\xampp\htdocs\zovu-project\backend-php\cron\abonnement_rappels.php
 *   Déclencheur : quotidien, ex. 08:00
 *
 * Linux crontab :
 *   0 8 * * * /usr/bin/php /var/www/zovu/backend-php/cron/abonnement_rappels.php >> /var/log/zovu-abonnement-rappels.log 2>&1
 */
declare(strict_types=1);

require __DIR__ . '/../helpers.php';

$result = process_abonnement_reminders();
$line = '[' . date('c') . '] ' . json_encode($result, JSON_UNESCAPED_UNICODE) . PHP_EOL;
echo $line;

if (php_sapi_name() !== 'cli') {
  header('Content-Type: application/json; charset=utf-8');
  json_out(['ok' => true, 'result' => $result]);
}
