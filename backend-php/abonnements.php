<?php
// backend-php/abonnements.php — Abonnement plateforme (6 mois / 1000 FCFA)
declare(strict_types=1);
require __DIR__ . '/helpers.php';
cors();

$action = $_GET['action'] ?? '';
$cfg = cfg();
$user = require_user();

if ($action === 'status') {
  if (!table_exists('abonnements')) {
    json_out(map_subscription_status($user['id']));
  }
  json_out(map_subscription_status($user['id']));
}

if (!table_exists('abonnements')) {
  fail('Abonnements non configurés — exécutez migration-abonnements.sql', 503);
}

if ($action === 'subscribe') {
  $body = json_input();
  $reference = trim($body['reference'] ?? '');

  if ($reference !== '') {
    $stmt = db()->prepare("SELECT * FROM abonnements WHERE reference=? AND user_id=? LIMIT 1");
    $stmt->execute([$reference, $user['id']]);
    $ab = $stmt->fetch();
    if (!$ab) fail('Abonnement introuvable', 404);
    if ($ab['statut'] === 'actif') {
      json_out(['ok' => true, 'alreadyActive' => true, ...map_subscription_status($user['id'])]);
    }
    if ($ab['statut'] !== 'en_attente') fail('Paiement non modifiable');

    $months = subscription_duration_months();
    db()->prepare("UPDATE abonnements SET statut='actif', date_debut=NOW(),
      date_fin=DATE_ADD(NOW(), INTERVAL ? MONTH) WHERE id=?")
        ->execute([$months, $ab['id']]);

    dispatch_notification_event('paiement_confirme', [
      'montant' => number_format((int)$ab['montant'], 0, ',', ' '),
      'titre' => 'Abonnement EZOA-TO (6 mois)',
    ], ['userId' => $user['id'], 'url' => '/account/abonnement']);

    json_out(['ok' => true, ...map_subscription_status($user['id'])]);
  }

  if (user_has_active_subscription($user['id'])) {
    json_out(['alreadyActive' => true, ...map_subscription_status($user['id'])]);
  }

  $methode = $body['methode'] ?? '';
  $telephone = preg_replace('/\D/', '', $body['telephone'] ?? '');
  if (!in_array($methode, ['flooz', 'tmoney'], true)) fail('Méthode invalide');
  if (strlen($telephone) < 8) fail('Numéro de téléphone invalide');

  $montant = subscription_price();
  $expMin = (int)($cfg['abonnement']['expiration_minutes'] ?? 15);

  $pending = db()->prepare("SELECT id, reference, statut FROM abonnements
    WHERE user_id=? AND statut='en_attente'
    AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE) LIMIT 1");
  $pending->execute([$user['id'], $expMin]);
  $existing = $pending->fetch();
  if ($existing) {
    json_out([
      'id' => $existing['id'],
      'reference' => $existing['reference'],
      'montant' => $montant,
      'methode' => $methode,
      'instructions' => build_mobile_money_instructions($methode, $existing['reference'], $montant),
    ]);
  }

  $id = uuid();
  $ref = payment_reference();
  db()->prepare("INSERT INTO abonnements (id,user_id,montant,methode,telephone,reference,statut)
    VALUES (?,?,?,?,?,?,'en_attente')")
      ->execute([$id, $user['id'], $montant, $methode, $telephone, $ref]);

  json_out([
    'id' => $id,
    'reference' => $ref,
    'montant' => $montant,
    'methode' => $methode,
    'instructions' => build_mobile_money_instructions($methode, $ref, $montant),
  ]);
}

fail('Action inconnue', 404);
