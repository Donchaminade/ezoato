<?php
// Webhook / callback opérateur — active le Pro pour 6 mois, une seule fois par événement.
declare(strict_types=1);
require __DIR__ . '/helpers.php';
require_once __DIR__ . '/lib/paiement-fournisseur.php';
require_once __DIR__ . '/lib/correction-encaissement.php';

$raw = file_get_contents('php://input') ?: '';
$headers = function_exists('getallheaders') ? (getallheaders() ?: []) : [];
$fournisseur = paiement_fournisseur();

try {
  $verif = $fournisseur->verifierNotification($raw, $headers);
} catch (Throwable $e) {
  json_out(['ok' => false, 'error' => 'Vérification impossible'], 400);
}

if (empty($verif['ok'])) {
  json_out(['ok' => false, 'error' => $verif['erreur'] ?? 'Notification refusée'], 400);
}

$reference = (string)($verif['reference'] ?? '');
$providerRef = $verif['providerRef'] ?? null;
if (column_exists('abonnements', 'provider_ref') && $providerRef) {
  $stmt = db()->prepare('SELECT * FROM abonnements WHERE reference=? OR provider_ref=? ORDER BY created_at DESC LIMIT 1');
  $stmt->execute([$reference, $providerRef]);
} else {
  $stmt = db()->prepare('SELECT * FROM abonnements WHERE reference=? ORDER BY created_at DESC LIMIT 1');
  $stmt->execute([$reference]);
}
$ab = $stmt->fetch();
if (!$ab) {
  $corr = correction_encaissement_notifier(db(), $verif);
  if ($corr === null) {
    json_out(['ok' => false, 'error' => 'Paiement introuvable'], 404);
  }
  json_out([
    'ok' => $corr['ok'],
    'error' => $corr['error'],
    'resultat' => $corr['resultat'] ?? null,
    'duplicate' => !empty($corr['duplicate']),
  ], $corr['ok'] ? 200 : (int)$corr['code']);
}

$evenement = [
  'providerEventId' => (string)($verif['providerEventId'] ?? ''),
  'paye' => !empty($verif['paye']),
  'now' => time(),
];
$resultat = persister_activation_pro($ab, $evenement, $fournisseur->code());

if ($resultat['prolonge'] && function_exists('dispatch_notification_event')) {
  dispatch_notification_event('paiement_confirme', [
    'montant' => number_format((int)$ab['montant'], 0, ',', ' '),
    'titre' => 'Abonnement EZOA-TO (6 mois)',
  ], ['userId' => $ab['user_id'], 'url' => '/account/abonnement']);
}

json_out([
  'ok' => true,
  'resultat' => $resultat['resultat'],
  'prolonge' => $resultat['prolonge'],
]);
