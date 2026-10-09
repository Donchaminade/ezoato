<?php
/**
 * Réassigne les demandes de correction dont le délai est dépassé.
 *
 *   php backend-php/cron/corrections_reassigner.php
 *
 * Crontab (toutes les heures) :
 *   0 * * * * /usr/bin/php /var/www/zovu/backend-php/cron/corrections_reassigner.php
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
  http_response_code(403);
  header('Content-Type: text/plain; charset=utf-8');
  echo "CLI only\n";
  exit(1);
}

require __DIR__ . '/../helpers.php';
require __DIR__ . '/../lib/corrections/bootstrap.php';

$result = correction_service_reassigner_echues(db(), [
  'now' => date('Y-m-d H:i:s'),
  'credit' => 'correction_credit_portefeuille',
  'user' => ['id' => '', 'role' => 'systeme'],
]);
echo '[' . date('c') . '] ' . json_encode($result, JSON_UNESCAPED_UNICODE) . PHP_EOL;
