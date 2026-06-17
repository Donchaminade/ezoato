<?php
/**
 * Génère une paire de clés VAPID pour les notifications push.
 *
 * Méthode 1 (recommandée sur XAMPP) :
 *   npx web-push generate-vapid-keys --json
 *
 * Méthode 2 (si OpenSSL EC fonctionne) :
 *   php generate-vapid-keys.php
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
  http_response_code(403);
  exit('CLI only');
}

$autoload = __DIR__ . '/vendor/autoload.php';
if (!is_file($autoload)) {
  fwrite(STDERR, "Exécutez d'abord : composer install\n");
  exit(1);
}

require $autoload;

use Minishlink\WebPush\VAPID;

try {
  $keys = VAPID::createVapidKeys();
} catch (Throwable $e) {
  fwrite(STDERR, "Échec OpenSSL PHP : {$e->getMessage()}\n");
  fwrite(STDERR, "Utilisez plutôt : npx web-push generate-vapid-keys --json\n");
  exit(1);
}

echo "=== Clés VAPID EZOA-TO ===\n\n";
echo "Public  : {$keys['publicKey']}\n";
echo "Private : {$keys['privateKey']}\n\n";
echo "config.local.php → section 'push'\n";
echo ".env → VITE_VAPID_PUBLIC_KEY={$keys['publicKey']}\n";
