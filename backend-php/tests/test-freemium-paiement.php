<?php
/**
 * Freemium, paywall concours, déduplication, barème contributeur, idempotence webhook.
 * Usage : php tests/test-freemium-paiement.php
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

function set_env(string $key, ?string $value): void {
  if ($value === null) {
    unset($_ENV[$key]);
    putenv($key);
    return;
  }
  $_ENV[$key] = $value;
  putenv($key . '=' . $value);
}

if (!function_exists('fail')) {
  function fail(string $msg, int $code = 400): void {
    throw new RuntimeException($msg, $code);
  }
}
if (!function_exists('normalize_text')) {
  function normalize_text(string $s): string {
    return trim(preg_replace('/\s+/u', ' ', $s) ?? $s);
  }
}
if (!function_exists('normalize_ville')) {
  function normalize_ville(string $s): string { return normalize_text($s); }
}
if (!function_exists('repair_display_text')) {
  function repair_display_text(?string $s): ?string { return $s; }
}
if (!function_exists('load_meta_classes')) {
  function load_meta_classes(): array {
    return [
      'college' => ['6e', '5e', '4e', '3e'],
      'lycee' => ['2nde A', 'Tle C'],
    ];
  }
}

require dirname(__DIR__) . '/lib/niveau-soumission.php';
require dirname(__DIR__) . '/lib/freemium.php';
require dirname(__DIR__) . '/lib/paiement-fournisseur.php';

foreach ([
  'EZOATO_FREEMIUM_QUOTA',
  'EZOATO_FREEMIUM_QUOTA_MODE',
  'EZOATO_FREEMIUM_QUOTA_DEVOIR',
  'EZOATO_FREEMIUM_QUOTA_COMPOSITION',
  'EZOATO_PAYMENT_PROVIDER',
  'PAYGATE_AUTH_TOKEN',
  'FEDAPAY_SECRET_KEY',
] as $k) {
  set_env($k, null);
}

echo "=== Quota commun (50) ===\n";
$cfg = freemium_config();
assert_true($cfg['mode'] === 'shared' && $cfg['quota'] === 50, 'défaut shared 50');

$devoir = ['type' => 'devoir', 'niveau' => 'college'];
$ok49 = freemium_decision([
  'tier' => epreuve_access_tier($devoir),
  'isPro' => false,
  'used' => 49,
  'limit' => 50,
]);
assert_true($ok49['allowed'] && $ok49['consume'], '49/50 autorise et consomme');

$stop = freemium_decision([
  'tier' => 'quota',
  'isPro' => false,
  'used' => 50,
  'limit' => 50,
]);
assert_true(!$stop['allowed'] && $stop['reason'] === 'quota_exceeded', '50/50 bloque');

$deja = freemium_decision([
  'tier' => 'quota',
  'isPro' => false,
  'alreadyCounted' => true,
  'used' => 50,
  'limit' => 50,
]);
assert_true($deja['allowed'] && !$deja['consume'], 'épreuve déjà comptée reste accessible');

$pro = freemium_decision(['tier' => 'quota', 'isPro' => true, 'used' => 50, 'limit' => 50]);
assert_true($pro['allowed'] && $pro['reason'] === 'pro', 'Pro ignore le quota');

echo "\n=== Quotas séparés ===\n";
set_env('EZOATO_FREEMIUM_QUOTA_MODE', 'separate');
set_env('EZOATO_FREEMIUM_QUOTA_DEVOIR', '50');
set_env('EZOATO_FREEMIUM_QUOTA_COMPOSITION', '50');
$sep = freemium_config();
assert_true($sep['mode'] === 'separate', 'mode separate');
$bucketD = freemium_bucket(['type' => 'devoir'], 'separate');
$bucketC = freemium_bucket(['type' => 'composition'], 'separate');
assert_true($bucketD === 'devoir' && $bucketC === 'composition', 'seaux distincts');
$bloqueDevoir = freemium_decision([
  'tier' => 'quota', 'isPro' => false, 'used' => 50, 'limit' => freemium_limit($sep, 'devoir'),
]);
$okCompo = freemium_decision([
  'tier' => 'quota', 'isPro' => false, 'used' => 0, 'limit' => freemium_limit($sep, 'composition'),
]);
assert_true(!$bloqueDevoir['allowed'] && $okCompo['allowed'], 'devoir plein n\'empêche pas une composition');
set_env('EZOATO_FREEMIUM_QUOTA_MODE', null);

echo "\n=== Paywall examens officiels et concours ===\n";
$concours = ['type' => 'examen', 'niveau' => 'concours', 'examen' => null];
$bepc = ['type' => 'examen', 'niveau' => 'college', 'examen' => 'BEPC'];
$bac = ['type' => 'examen', 'niveau' => 'lycee', 'examen' => 'BAC2'];
$cepd = ['type' => 'examen', 'niveau' => 'college', 'examen' => 'CEPD'];
$compo = ['type' => 'composition', 'niveau' => 'lycee'];
assert_true(epreuve_access_tier($concours) === 'pro', 'concours = pro');
assert_true(epreuve_access_tier($bepc) === 'pro', 'BEPC = pro');
assert_true(epreuve_access_tier($bac) === 'pro', 'BAC = pro');
assert_true(epreuve_access_tier($cepd) === 'pro', 'CEPD = pro');
assert_true(epreuve_access_tier($compo) === 'quota', 'composition = quota');
$mur = freemium_decision(['tier' => epreuve_access_tier($concours), 'isPro' => false, 'used' => 0, 'limit' => 50]);
assert_true(!$mur['allowed'] && $mur['reason'] === 'pro_required', 'concours bloqué dès la première');
$murPaye = freemium_decision(['tier' => 'pro', 'isPro' => true, 'used' => 0, 'limit' => 50]);
assert_true($murPaye['allowed'], 'Pro ouvre le concours');
$legacy = freemium_decision(['tier' => 'pro', 'isPro' => false, 'legacyAccess' => true]);
assert_true($legacy['allowed'] && $legacy['reason'] === 'legacy', 'ancien achat unitaire conservé');

echo "\n=== Déduplication ===\n";
$baseDevoir = [
  'niveau' => 'college', 'type' => 'devoir', 'matiere' => 'Mathématiques',
  'classe' => '3e', 'annee' => 2024, 'periode' => 'T1', 'examen' => null,
  'etablissement' => 'Collège A',
];
$autreEtab = $baseDevoir;
$autreEtab['etablissement'] = 'Collège B';
$compoA = [
  'niveau' => 'college', 'type' => 'composition', 'matiere' => 'Mathématiques',
  'classe' => '3e', 'annee' => 2024, 'periode' => 'T1', 'etablissement' => 'Collège A',
];
$compoB = $compoA;
$compoB['etablissement'] = 'Collège B';
assert_true(epreuve_dedup_key($baseDevoir) !== epreuve_dedup_key($autreEtab), 'devoir : établissement dans la clé');
assert_true(epreuve_dedup_key($compoA) === epreuve_dedup_key($compoB), 'composition : établissement ignoré');
assert_true(!dedup_inclut_etablissement($compoA) && dedup_inclut_etablissement($baseDevoir), 'règle d\'inclusion');

$univA = [
  'niveau' => 'universite', 'type' => 'composition', 'matiere' => 'Droit',
  'classe' => 'L2', 'annee' => 2024, 'periode' => 'S1',
  'etablissement' => 'Université de Lomé',
  'meta_niveau' => ['universite' => 'Université de Lomé', 'filiere' => 'Droit'],
];
$univB = $univA;
$univB['etablissement'] = 'Université de Kara';
$univB['meta_niveau'] = ['universite' => 'Université de Kara', 'filiere' => 'Droit'];
assert_true(epreuve_dedup_key($univA) !== epreuve_dedup_key($univB), 'composition universitaire : université dans la clé');

$avecEtab = validate_soumission_payload([
  'niveau' => 'college', 'titre' => 'Compo', 'matiere' => 'Mathématiques',
  'classe' => '3e', 'annee' => 2024, 'type' => 'composition', 'periode' => 'T1',
  'ville' => 'Lomé', 'etablissement' => 'Ne doit pas rester',
]);
assert_true($avecEtab['etablissement'] === null, 'composition collège : établissement retiré');

echo "\n=== Barème contributeur ===\n";
$zero = calculer_recompense_palier(49, 0, 50, 1000);
$palier = calculer_recompense_palier(50, 0, 50, 1000);
$deux = calculer_recompense_palier(100, 0, 50, 1000);
$dejaVerse = calculer_recompense_palier(100, 2, 50, 1000);
assert_true($zero['credite'] === 0, '49 validées = 0 FCFA');
assert_true($palier['credite'] === 1000, '50 validées = 1 000 FCFA');
assert_true($deux['credite'] === 2000, '100 validées = 2 000 FCFA');
assert_true($dejaVerse['credite'] === 0, 'paliers déjà versés non recrédités');
assert_true(retrait_autorise(2000, 2000, 2000), 'retrait dès 2 000 FCFA');
assert_true(!retrait_autorise(1500, 1500, 2000), 'sous 2 000 FCFA refusé');

echo "\n=== Idempotence activation Pro ===\n";
$now = strtotime('2026-01-15 10:00:00 UTC');
$etat = ['statut' => 'en_attente', 'date_debut' => null, 'date_fin' => null, 'evenements' => []];
$evt = ['providerEventId' => 'paygate:tx1:paid', 'paye' => true, 'now' => $now];
$une = appliquer_evenement_pro($etat, $evt, 6);
$deuxFois = appliquer_evenement_pro($une, $evt, 6);
assert_true($une['prolonge'] && $une['statut'] === 'actif', 'premier webhook active');
assert_true($une['date_fin'] !== null && $une['date_fin'] > $now, 'fin dans 6 mois');
assert_true($deuxFois['resultat'] === 'idempotent' && $deuxFois['date_fin'] === $une['date_fin'], 'second webhook identique ne prolonge pas');
$autre = appliquer_evenement_pro($une, ['providerEventId' => 'paygate:tx2:paid', 'paye' => true, 'now' => $now + 86400], 6);
assert_true($autre['resultat'] === 'deja_actif' && $autre['date_fin'] === $une['date_fin'] && !$autre['prolonge'], 'nouvel événement sur Pro actif ne prolonge pas');

echo "\n=== Fournisseur de paiement ===\n";
assert_true(resoudre_code_fournisseur() === 'simulated', 'sans clé : simulé');
set_env('PAYGATE_AUTH_TOKEN', 'jeton-test');
assert_true(resoudre_code_fournisseur() === 'paygate', 'auto + PayGate');
set_env('EZOATO_PAYMENT_PROVIDER', 'simulated');
assert_true(resoudre_code_fournisseur() === 'simulated', 'forced simulated malgré la clé');
set_env('EZOATO_PAYMENT_PROVIDER', 'paygate');
set_env('PAYGATE_AUTH_TOKEN', null);
assert_true(resoudre_code_fournisseur() === 'simulated', 'paygate sans clé : repli simulé');
set_env('EZOATO_PAYMENT_PROVIDER', 'auto');
set_env('FEDAPAY_SECRET_KEY', 'sk_test');
assert_true(resoudre_code_fournisseur() === 'fedapay', 'auto + FedaPay si pas de PayGate');
set_env('PAYGATE_AUTH_TOKEN', 'jeton-test');
assert_true(resoudre_code_fournisseur() === 'paygate', 'PayGate prioritaire sur FedaPay');
assert_true(confirmation_client_peut_activer(true, false), 'simulé : le client peut confirmer');
assert_true(!confirmation_client_peut_activer(false, false), 'opérateur : confirmation client sans paiement refusée');
assert_true(confirmation_client_peut_activer(false, true), 'opérateur : paiement vérifié accepté');

echo "\n=== Visionneuse ===\n";
$mini = visionneuse_decision($devoir, ['page' => 1, 'used' => 49, 'limit' => 50]);
assert_true($mini['reason'] === 'miniature' && !$mini['consume'], 'miniature page 1 ne consomme pas');
$lire = visionneuse_decision($devoir, ['page' => 1, 'lire' => true, 'used' => 49, 'limit' => 50]);
assert_true($lire['allowed'] && $lire['consume'], 'ouvrir la visionneuse compte dans le quota');
$lirePlein = visionneuse_decision($devoir, ['page' => 1, 'lire' => true, 'used' => 50, 'limit' => 50]);
assert_true(!$lirePlein['allowed'] && $lirePlein['reason'] === 'quota_exceeded', 'visionneuse bloquée à 50/50');
$lireDeja = visionneuse_decision($devoir, ['page' => 2, 'lire' => true, 'alreadyCounted' => true, 'used' => 50, 'limit' => 50]);
assert_true($lireDeja['allowed'] && !$lireDeja['consume'], 'épreuve déjà comptée reste lisible');
$lireConcours = visionneuse_decision($concours, ['page' => 1, 'lire' => true, 'isPro' => false, 'used' => 0, 'limit' => 50]);
assert_true(!$lireConcours['allowed'] && $lireConcours['reason'] === 'pro_required', 'visionneuse concours réservée au Pro');
$lirePro = visionneuse_decision($concours, ['lire' => true, 'isPro' => true]);
assert_true($lirePro['allowed'] && !$lirePro['consume'], 'Pro lit le concours sans quota');

echo "\n=== Concours = examens officiels ===\n";
assert_true(epreuve_categorie_contenu($concours) === 'officiel', 'ENAM classé officiel');
assert_true(epreuve_categorie_contenu($bepc) === 'officiel', 'BEPC classé officiel');
assert_true(epreuve_categorie_contenu($concours) === epreuve_categorie_contenu($bepc), 'même catégorie concours et examen officiel');
assert_true(epreuve_categorie_contenu($compo) === 'quota', 'composition hors catégorie officielle');
$enamA = [
  'niveau' => 'concours', 'type' => 'examen', 'matiere' => 'Culture générale',
  'classe' => 'ENAM', 'annee' => 2024, 'etablissement' => 'Lomé',
  'meta_niveau' => ['concours' => 'ENAM', 'session' => '2024', 'nomEpreuve' => 'Culture générale'],
];
$enamB = $enamA;
$enamB['etablissement'] = 'Kara';
assert_true(!dedup_inclut_etablissement($enamA), 'concours : établissement hors clé, comme un examen officiel');
assert_true(epreuve_dedup_key($enamA) === epreuve_dedup_key($enamB), 'deux soumissions ENAM identiques = un doublon');
$bepcRow = [
  'niveau' => 'college', 'type' => 'examen', 'matiere' => 'Mathématiques',
  'classe' => '3e', 'annee' => 2024, 'examen' => 'BEPC', 'etablissement' => 'Collège A',
];
$bepcRowB = $bepcRow;
$bepcRowB['etablissement'] = 'Collège B';
assert_true(epreuve_dedup_key($bepcRow) === epreuve_dedup_key($bepcRowB), 'BEPC : établissement ignoré');
$recompenseConcours = calculer_recompense_palier(50, 0, 50, 1000);
assert_true($recompenseConcours['credite'] === 1000, 'concours rémunéré au même barème (50 = 1 000)');

echo "\n=== Redirections annales ===\n";
assert_true(legacy_redirect_cible('/annales') === '/docs', '/annales → /docs');
assert_true(legacy_redirect_cible('/annale/') === '/docs', '/annale/ → /docs');
assert_true(legacy_redirect_cible('/docs') === null, '/docs inchangé');
assert_true(legacy_redirect_cible('/epreuves/abc') === null, 'fiche épreuve inchangée');
$ts = file_get_contents(dirname(__DIR__, 2) . '/src/lib/legacy-redirects.ts');
assert_true(is_string($ts) && str_contains($ts, '"/annales": "/docs"') && str_contains($ts, '"/annale": "/docs"'), 'même table côté web');

echo "\n=== Hors ligne ===\n";
$futur = date('c', strtotime('2026-06-01 00:00:00 UTC'));
$passe = date('c', strtotime('2025-01-01 00:00:00 UTC'));
$now = strtotime('2026-03-01 00:00:00 UTC');
assert_true(lecture_hors_ligne_autorisee(null, $now), 'quota : relecture sans échéance');
assert_true(lecture_hors_ligne_autorisee($futur, $now), 'Pro encore valide hors ligne');
assert_true(!lecture_hors_ligne_autorisee($passe, $now), 'Pro expiré : relecture refusée');

echo "\n=== Resultat : $passed OK, $failed echec(s) ===\n";
exit($failed > 0 ? 1 : 0);
