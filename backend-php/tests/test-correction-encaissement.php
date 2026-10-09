<?php
/**
 * Encaissement Mobile Money des demandes de correction.
 * Usage : php backend-php/tests/test-correction-encaissement.php
 */
declare(strict_types=1);

$failed = 0;
$passed = 0;

function assert_true(bool $cond, string $msg): void
{
  global $failed, $passed;
  if ($cond) {
    echo "  OK  $msg\n";
    $passed++;
  } else {
    echo " FAIL $msg\n";
    $failed++;
  }
}

require dirname(__DIR__) . '/lib/correction-encaissement.php';

function nouveau_pdo(): PDO
{
  $pdo = new PDO('sqlite::memory:');
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
  correction_sqlite_schema($pdo);
  return $pdo;
}

function definir_secret(?string $secret): void
{
  if ($secret === null || $secret === '') {
    putenv('EZOATO_CORRECTIONS_REGLEMENT_SECRET');
    unset($_ENV['EZOATO_CORRECTIONS_REGLEMENT_SECRET'], $_SERVER['EZOATO_CORRECTIONS_REGLEMENT_SECRET']);
    return;
  }
  putenv('EZOATO_CORRECTIONS_REGLEMENT_SECRET=' . $secret);
  $_ENV['EZOATO_CORRECTIONS_REGLEMENT_SECRET'] = $secret;
  $_SERVER['EZOATO_CORRECTIONS_REGLEMENT_SECRET'] = $secret;
}

function eleve(): array
{
  return ['id' => 'eleve-1', 'role' => 'eleve', 'nom' => 'Awa'];
}

function creer_attente(PDO $pdo): array
{
  $pdo->prepare('INSERT INTO users (id, nom, role) VALUES (?,?,?)')->execute(['eleve-1', 'Awa', 'eleve']);
  $res = correction_service_creer($pdo, [
    'epreuve' => ['id' => 'ep-1', 'titre' => 'Maths 4e', 'matiere' => 'Mathématiques', 'niveau' => '4e', 'type' => 'devoir'],
    'exercices' => ['exercice 2'],
    'blocage_texte' => 'explique la proportionnalité avec un exemple',
  ], [
    'user' => eleve(),
    'is_pro' => false,
    'periode' => '',
    'now' => '2026-10-09 12:00:00',
    'credit' => static function (): void {},
  ]);
  assert_true($res['ok'] === true, 'la demande hors quota est créée');
  assert_true(($res['demande']['statut'] ?? '') === 'en_attente_reglement', 'elle attend le règlement');
  assert_true((int)($res['demande']['montant'] ?? 0) === 1500, 'le montant est 1 500 FCFA');
  return $res['demande'];
}

definir_secret('secret-reglement-test');
putenv('EZOATO_PAYMENT_PROVIDER=simulated');
$_ENV['EZOATO_PAYMENT_PROVIDER'] = 'simulated';

echo "\n=== Secret de règlement ===\n";
assert_true(correction_reglement_header_valide('secret-reglement-test'), 'le secret attendu est accepté');
assert_true(!correction_reglement_header_valide('autre'), 'un secret différent est refusé');
assert_true(!correction_reglement_header_valide(''), 'un en-tête vide est refusé');

echo "\n=== Initiation et confirmation simulées ===\n";
$pdo = nouveau_pdo();
$demande = creer_attente($pdo);
$init = correction_encaissement_initier($pdo, eleve(), [
  'id' => $demande['id'],
  'statut' => 'en_attente_reglement',
  'montant' => $demande['montant'],
], 'flooz', '90001122');
assert_true($init['ok'] === true, 'Flooz est initié');
assert_true(($init['paiement']['simulated'] ?? false) === true, 'sans clé opérateur le fournisseur est simulé');
assert_true((int)($init['paiement']['montant'] ?? 0) === 1500, 'l\'encaissement reprend le montant de la demande');
assert_true(str_starts_with((string)($init['paiement']['reference'] ?? ''), 'EZOA-COR-'), 'la référence est distincte de l\'abonnement');

$conf = correction_encaissement_confirmer($pdo, eleve(), $demande['id'], (string)$init['paiement']['reference']);
assert_true($conf['ok'] === true, 'la confirmation simulée règle la demande');
assert_true(($conf['demande']['statut'] ?? '') !== 'en_attente_reglement', 'le triage démarre après le règlement');

$encore = correction_encaissement_confirmer($pdo, eleve(), $demande['id'], (string)$init['paiement']['reference']);
assert_true($encore['ok'] === true && !empty($encore['duplicate']), 'une seconde confirmation ne relance pas le règlement');

echo "\n=== Webhook idempotent ===\n";
$pdo2 = nouveau_pdo();
$demande2 = creer_attente($pdo2);
$init2 = correction_encaissement_initier($pdo2, eleve(), [
  'id' => $demande2['id'],
  'statut' => 'en_attente_reglement',
  'montant' => 1500,
], 'tmoney', '70001122');
$ref = (string)$init2['paiement']['reference'];
$refus = correction_encaissement_notifier($pdo2, [
  'reference' => $ref,
  'paye' => false,
  'providerEventId' => 'evt-1',
]);
assert_true($refus !== null && $refus['ok'] === false, 'un webhook impayé ne règle pas');
$ok = correction_encaissement_notifier($pdo2, [
  'reference' => $ref,
  'paye' => true,
  'providerEventId' => 'evt-1',
  'montant' => 1500,
]);
assert_true($ok !== null && $ok['ok'] === true, 'le webhook payé confirme via le secret');
$bis = correction_encaissement_notifier($pdo2, [
  'reference' => $ref,
  'paye' => true,
  'providerEventId' => 'evt-1',
]);
assert_true($bis !== null && !empty($bis['duplicate']), 'le même événement webhook est ignoré');
assert_true(correction_encaissement_notifier($pdo2, ['reference' => 'EZOA-COR-INCONNUE', 'paye' => true]) === null, 'une référence inconnue ne concerne pas les corrections');

echo "\n=== Secret absent ===\n";
definir_secret(null);
assert_true(!correction_reglement_header_valide('secret-reglement-test'), 'sans variable le contrôle refuse');
$pdo3 = nouveau_pdo();
$demande3 = creer_attente($pdo3);
$init3 = correction_encaissement_initier($pdo3, eleve(), [
  'id' => $demande3['id'],
  'statut' => 'en_attente_reglement',
  'montant' => 1500,
], 'flooz', '90001122');
$bloque = correction_encaissement_confirmer($pdo3, eleve(), $demande3['id'], (string)$init3['paiement']['reference']);
assert_true($bloque['ok'] === false && (int)$bloque['code'] === 503, 'sans secret la confirmation système est refusée');
$reste = correction_charger($pdo3, $demande3['id']);
assert_true(($reste['statut'] ?? '') === 'en_attente_reglement', 'la demande reste en attente de règlement');

echo "\n$passed OK, $failed FAIL\n";
exit($failed > 0 ? 1 : 0);
