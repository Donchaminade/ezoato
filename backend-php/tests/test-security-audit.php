<?php
/**
 * Non-régression des correctifs d'audit (fonctions pures + JWT local).
 * Usage : php tests/test-security-audit.php
 */
declare(strict_types=1);

$failed = 0;
$passed = 0;

function assert_true(bool $cond, string $msg): void {
  global $failed, $passed;
  if ($cond) {
    echo "  OK  $msg\n";
    $passed++;
  } else {
    echo " FAIL $msg\n";
    $failed++;
  }
}

require dirname(__DIR__) . '/helpers.php';

echo "=== Chemins ===\n";
assert_true(path_is_within('/var/uploads/epreuves', '/var/uploads/epreuves/2024/a.pdf'), 'fichier sous la racine');
assert_true(!path_is_within('/var/uploads/epreuves', '/var/uploads/epreuves-secret/a.pdf'), 'préfixe frère refusé');
assert_true(!path_is_within('/var/uploads/epreuves', '/etc/passwd'), 'hors racine refusé');

echo "=== Session / comptes seed ===\n";
assert_true(session_version_accepte(2, 2, true), 'version de session identique');
assert_true(!session_version_accepte(0, 1, true), 'ancien jeton refusé après changement de mot de passe');
assert_true(session_version_accepte(null, 4, false), 'sans colonne, les jetons restent valides');
assert_true(!soumission_recompense_pour_validateur('admin-1', 'admin-1'), 'pas de récompense si le validateur est l\'auteur');
assert_true(soumission_recompense_pour_validateur('admin-2', 'user-1'), 'un autre validateur rémunère');
assert_true(!retrait_approuve_par_tiers('u1', 'u1'), 'pas d\'auto-approbation de retrait');
assert_true(auth_fenetre_saturee([100, 200, 300], 350, 300, 3), 'plafond de tentatives atteint');
assert_true(!auth_fenetre_saturee([10], 500, 60, 8), 'fenêtre expirée');

$_SERVER['HTTP_HOST'] = 'ezoato.example';
putenv('EZOATO_ENV=production');
$_ENV['EZOATO_ENV'] = 'production';
assert_true(compte_test_interdit('admin@tea.test'), 'compte seed refusé en production');
assert_true(!compte_test_interdit('eleve@example.com'), 'compte réel conservé');
assert_true(!simulation_paiement_cliente_autorisee(), 'confirmation simulée refusée en production');
assert_true(jwt_secret_effectif(['jwt_secret' => 'CHANGE_ME_LONG_RANDOM_STRING']) === '', 'placeholder JWT refusé en production');
assert_true(jwt_secret_effectif(['jwt_secret' => 'secret-long-aleatoire-de-production']) === 'secret-long-aleatoire-de-production', 'secret local honoré');

putenv('EZOATO_ALLOW_SIMULATED_PAYMENTS=1');
$_ENV['EZOATO_ALLOW_SIMULATED_PAYMENTS'] = '1';
assert_true(simulation_paiement_cliente_autorisee(), 'opt-in explicite autorise la simulation');
putenv('EZOATO_ALLOW_SIMULATED_PAYMENTS');
unset($_ENV['EZOATO_ALLOW_SIMULATED_PAYMENTS']);

echo "=== Webhook ===\n";
assert_true(!webhook_secret_correspond([], ''), 'webhook simulé sans secret refusé');
assert_true(!webhook_secret_correspond(['X-Ezoato-Webhook-Secret' => 'non'], 'oui'), 'mauvais secret refusé');
assert_true(webhook_secret_correspond(['X-Ezoato-Webhook-Secret' => 'oui'], 'oui'), 'secret webhook accepté');
assert_true(!montant_notification_compatible(1000, 1), 'montant webhook divergent refusé');
assert_true(montant_notification_compatible(1000, null), 'montant absent toléré');
assert_true(montant_notification_compatible(1000, 1000), 'montant identique accepté');
assert_true(!confirmation_client_peut_activer(true, false), 'client simulé bloqué en production');
assert_true(confirmation_client_peut_activer(false, true), 'opérateur réel peut confirmer');
assert_true(!confirmation_client_peut_activer(false, false), 'opérateur impayé ne confirme pas');

echo "=== URL internes ===\n";
assert_true(url_interne_sure('/account/notifications') === '/account/notifications', 'chemin relatif conservé');
assert_true(url_interne_sure('https://evil.example') === null, 'URL absolue refusée');
assert_true(url_interne_sure('//evil.example') === null, 'URL protocole-relatif refusée');

echo "=== JWT ===\n";
putenv('EZOATO_ENV');
unset($_ENV['EZOATO_ENV']);
$_SERVER['HTTP_HOST'] = 'localhost';
$payload = ['sub' => 'a0000001-0000-4000-8000-000000000099', 'exp' => time() + 60, 'sv' => 0];
$token = jwt_encode($payload);
$decoded = jwt_decode($token);
assert_true(is_array($decoded) && $decoded['sub'] === $payload['sub'], 'jeton local décodé');

$parts = explode('.', $token);
$header = json_decode(base64_decode(strtr($parts[0], '-_', '+/')), true);
assert_true(($header['alg'] ?? '') === 'HS256', 'algorithme forcé HS256');
$none = rtrim(strtr(base64_encode(json_encode(['alg' => 'none', 'typ' => 'JWT'])), '+/', '-_'), '=');
assert_true(jwt_decode($none . '.' . $parts[1] . '.') === null, 'alg none refusé');
assert_true(jwt_decode($parts[0] . '.' . $parts[1] . '.AAAA') === null, 'signature invalide refusée');

$_SERVER['HTTP_HOST'] = 'ezoato.example';
putenv('EZOATO_ENV=production');
$_ENV['EZOATO_ENV'] = 'production';
assert_true(jwt_decode($token) === null, 'jeton placeholder refusé sur hôte public en production');

$helpers = file_get_contents(dirname(__DIR__) . '/helpers.php') ?: '';
assert_true(str_contains($helpers, 'jwt_secret_effectif(load_config())'), 'JWT lit load_config');
assert_true(!str_contains($helpers, "require __DIR__ . '/config.php'"), 'JWT n\'ignore plus config.local.php');
$ht = file_get_contents(dirname(__DIR__) . '/.htaccess') ?: '';
assert_true(str_contains($ht, 'RewriteRule ^uploads/ - [F,L]'), 'uploads interdits en HTTP direct');
$uploadsHt = file_get_contents(dirname(__DIR__) . '/uploads/.htaccess') ?: '';
assert_true(str_contains($uploadsHt, 'Require all denied'), 'répertoire uploads fermé');
$payments = file_get_contents(dirname(__DIR__) . '/payments.php') ?: '';
assert_true(str_contains($payments, 'confirmation_client_peut_activer'), 'confirmation unitaire passe par le garde-fou');
$wallet = file_get_contents(dirname(__DIR__) . '/helpers.php') ?: '';
assert_true(str_contains($wallet, 'AND solde >= ?'), 'débit conditionnel au solde');

echo "\n=== Résultat : $passed OK, $failed échec(s) ===\n";
exit($failed > 0 ? 1 : 0);
