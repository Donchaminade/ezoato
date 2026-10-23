<?php
/**
 * Contrôles de sécurité partagés (session, paiement, chemins).
 * Fonctions pures : testables sans MySQL.
 */
declare(strict_types=1);

function ezoa_requete_locale(): bool {
  $host = strtolower(trim((string)($_SERVER['HTTP_HOST'] ?? '')));
  if ($host === '') return true;
  $host = preg_replace('/:\d+$/', '', $host) ?? $host;
  if (in_array($host, ['localhost', '127.0.0.1', '::1'], true)) return true;
  return (bool)preg_match(
    '/^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/',
    $host
  );
}

function ezoa_est_production(): bool {
  $raw = function_exists('ezoa_env') ? ezoa_env('EZOATO_ENV') : getenv('EZOATO_ENV');
  return strtolower(trim((string)$raw)) === 'production';
}

function jwt_secret_est_placeholder(string $secret): bool {
  $secret = trim($secret);
  return $secret === '' || $secret === 'CHANGE_ME_LONG_RANDOM_STRING';
}

/**
 * Secret HMAC effectif. Chaîne vide = refus (aucun jeton émis ni accepté).
 * Le placeholder versionné n'est toléré qu'en local, hors production.
 */
function jwt_secret_effectif(array $cfg): string {
  $secret = trim((string)($cfg['jwt_secret'] ?? ''));
  if (!jwt_secret_est_placeholder($secret)) return $secret;
  if (ezoa_est_production()) return '';
  $allow = function_exists('ezoa_env') ? ezoa_env('EZOATO_ALLOW_INSECURE_JWT') : getenv('EZOATO_ALLOW_INSECURE_JWT');
  if ($allow === '1' || (!empty($cfg['dev']['allow_insecure_jwt']) && ezoa_requete_locale())) {
    return $secret !== '' ? $secret : 'CHANGE_ME_LONG_RANDOM_STRING';
  }
  if (ezoa_requete_locale()) {
    return $secret !== '' ? $secret : 'CHANGE_ME_LONG_RANDOM_STRING';
  }
  return '';
}

function jwt_entete_accepte(?array $header): bool {
  if (!is_array($header)) return false;
  if (($header['alg'] ?? '') !== 'HS256') return false;
  $typ = $header['typ'] ?? 'JWT';
  return $typ === 'JWT';
}

function session_version_accepte(?int $tokenSv, int $dbSv, bool $colonnePresente): bool {
  if (!$colonnePresente) return true;
  return (int)$tokenSv === $dbSv;
}

function compte_test_emails(): array {
  return ['admin@tea.test', 'gestion@tea.test', 'afi@tea.test', 'kodjo@tea.test'];
}

function compte_test_interdit(string $email): bool {
  if (!in_array(strtolower(trim($email)), compte_test_emails(), true)) return false;
  $allow = function_exists('ezoa_env') ? ezoa_env('EZOATO_ALLOW_TEST_ACCOUNTS') : getenv('EZOATO_ALLOW_TEST_ACCOUNTS');
  if ($allow === '1') return false;
  if (ezoa_est_production()) return true;
  return !ezoa_requete_locale();
}

function simulation_paiement_cliente_autorisee(): bool {
  $raw = function_exists('ezoa_env')
    ? (ezoa_env('EZOATO_ALLOW_SIMULATED_PAYMENTS') ?? '')
    : (getenv('EZOATO_ALLOW_SIMULATED_PAYMENTS') ?: '');
  $flag = strtolower(trim((string)$raw));
  if (in_array($flag, ['0', 'false', 'off'], true)) return false;
  if (in_array($flag, ['1', 'true', 'on'], true)) return true;
  if (ezoa_est_production()) return false;
  return ezoa_requete_locale();
}

function webhook_secret_correspond(array $headers, string $secret): bool {
  $secret = trim($secret);
  if ($secret === '') return false;
  $given = '';
  foreach ($headers as $k => $v) {
    if (strtolower((string)$k) === 'x-ezoato-webhook-secret') {
      $given = is_array($v) ? '' : trim((string)$v);
      break;
    }
  }
  return $given !== '' && hash_equals($secret, $given);
}

function montant_notification_compatible(int $attendu, ?int $recu): bool {
  if ($recu === null) return true;
  return $recu === $attendu;
}

function path_is_within(string $base, string $full): bool {
  $base = rtrim(str_replace('\\', '/', $base), '/');
  $full = rtrim(str_replace('\\', '/', $full), '/');
  if ($base === '' || $full === '') return false;
  return $full === $base || str_starts_with($full, $base . '/');
}

function fichier_dans_uploads(string $path, string $uploadsDir): bool {
  $root = realpath($uploadsDir);
  $full = realpath($path);
  if ($root === false || $full === false) return false;
  return path_is_within($root, $full);
}

function url_interne_sure(string $url): ?string {
  $url = trim($url);
  if ($url === '') return null;
  if (!str_starts_with($url, '/') || str_starts_with($url, '//')) return null;
  if (preg_match('/[\r\n\0\\\\]/', $url)) return null;
  return $url;
}

function soumission_recompense_pour_validateur(string $validateurId, string $auteurId): bool {
  return $validateurId !== '' && $validateurId !== $auteurId;
}

function retrait_approuve_par_tiers(string $acteurId, string $beneficiaireId): bool {
  return $acteurId !== '' && $acteurId !== $beneficiaireId;
}

function auth_fenetre_saturee(array $timestamps, int $now, int $windowSec, int $max): bool {
  $n = 0;
  foreach ($timestamps as $t) {
    if ((int)$t > $now - $windowSec) $n++;
  }
  return $n >= $max;
}

function auth_client_ip(): string {
  $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
  return $ip !== '' ? $ip : 'cli';
}

function auth_throttle_dir(): string {
  return sys_get_temp_dir() . '/ezoa-auth-rl';
}

/** Enregistre une tentative et répond 429 si le plafond est atteint. */
function auth_throttle_consume(string $bucket, int $max, int $windowSec): void {
  $dir = auth_throttle_dir();
  if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) return;
  $file = $dir . '/' . hash('sha256', $bucket) . '.json';
  $fh = @fopen($file, 'c+');
  if (!$fh) return;
  try {
    if (!flock($fh, LOCK_EX)) return;
    $data = json_decode(stream_get_contents($fh) ?: '[]', true);
    if (!is_array($data)) $data = [];
    $now = time();
    $hits = [];
    foreach ($data as $t) {
      if ((int)$t > $now - $windowSec) $hits[] = (int)$t;
    }
    if (auth_fenetre_saturee($hits, $now, $windowSec, $max)) {
      fail('Trop de tentatives. Réessayez dans quelques minutes.', 429);
    }
    $hits[] = $now;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($hits));
    fflush($fh);
  } finally {
    flock($fh, LOCK_UN);
    fclose($fh);
  }
}

function auth_throttle_reset(string $bucket): void {
  $file = auth_throttle_dir() . '/' . hash('sha256', $bucket) . '.json';
  if (is_file($file)) @unlink($file);
}
