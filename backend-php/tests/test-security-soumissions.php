<?php
/**
 * Tests de régression sécurité (défensifs) — authz admin similaires / validation.
 * Usage : php tests/test-security-soumissions.php
 *         (nécessite Apache/XAMPP + API joignable, sinon skip HTTP)
 *
 * Ces tests vérifient que les tentatives d'accès non autorisées
 * renvoient 401/403 — PAS d'outils offensifs.
 */
declare(strict_types=1);

$failed = 0;
$passed = 0;
$skipped = 0;

function assert_true(bool $cond, string $msg): void {
  global $failed, $passed;
  if ($cond) { echo "  OK  $msg\n"; $passed++; }
  else { echo " FAIL $msg\n"; $failed++; }
}

function skip(string $msg): void {
  global $skipped;
  echo " SKIP $msg\n";
  $skipped++;
}

$cfgPath = dirname(__DIR__) . '/config.php';
if (!is_file($cfgPath)) {
  echo "config.php introuvable — abandon\n";
  exit(1);
}
$cfg = require $cfgPath;
$base = rtrim((string)($cfg['api_base_url'] ?? ''), '/');
if ($base === '') {
  $base = 'http://localhost/zovu-project/backend-php';
}

echo "=== Authz (HTTP) base=$base ===\n";

function http_status(string $method, string $url, ?string $token = null, ?string $body = null): int {
  if (!function_exists('curl_init')) return -1;
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => array_values(array_filter([
      'Accept: application/json',
      $token ? "Authorization: Bearer $token" : null,
      $body !== null ? 'Content-Type: application/json' : null,
    ])),
    CURLOPT_POSTFIELDS => $body,
  ]);
  curl_exec($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return $code;
}

$fakeId = '00000000-0000-4000-8000-000000000099';

$code = http_status('GET', "$base/admin/soumissions/$fakeId/similaires");
if ($code < 0) {
  skip('curl indisponible');
} elseif ($code === 0) {
  skip('API injoignable (serveur arrêté ?) — lancez XAMPP puis retestez');
} else {
  assert_true(in_array($code, [401, 403], true), "sans token → $code (401/403 attendu)");
}

$codeList = http_status('GET', "$base/admin/soumissions");
if ($codeList > 0) {
  assert_true(in_array($codeList, [401, 403], true), "liste soumissions sans token → $codeList");
}

$codeVal = http_status('POST', "$base/admin/soumissions/$fakeId/valider", null, '{}');
if ($codeVal > 0) {
  assert_true(in_array($codeVal, [401, 403], true), "valider sans token → $codeVal");
}

echo "\n=== Requêtes paramétrées (statique) ===\n";
$src = file_get_contents(dirname(__DIR__) . '/lib/niveau-soumission.php') ?: '';
assert_true(
  str_contains($src, 'WHERE e.statut = \'validee\' AND e.niveau = ?'),
  'find_similar_epreuves utilise des placeholders PDO'
);
assert_true(
  !preg_match('/WHERE.*\$niveau[^?]/', $src),
  'pas de concaténation SQL directe du niveau'
);

$soum = file_get_contents(dirname(__DIR__) . '/soumissions.php') ?: '';
assert_true(
  str_contains($soum, 'validate_soumission_payload'),
  'POST /soumissions passe par validate_soumission_payload'
);

$ht = file_get_contents(dirname(__DIR__) . '/.htaccess') ?: '';
assert_true(
  str_contains($ht, 'similaires'),
  'route admin similaires exposée'
);

echo "\n=== IDOR (statique) ===\n";
$admin = file_get_contents(dirname(__DIR__) . '/admin.php') ?: '';
assert_true(
  str_contains($admin, "require_user(['gestionnaire', 'admin'])")
    && preg_match("/action === 'similaires'/", $admin) === 1,
  'endpoint similaires protégé gestionnaire/admin'
);

echo "\n=== Résultat : $passed OK, $failed échec(s), $skipped skip ===\n";
exit($failed > 0 ? 1 : 0);
