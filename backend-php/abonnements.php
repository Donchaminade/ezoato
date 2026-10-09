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
  $fournisseur = paiement_fournisseur();

  if ($reference !== '') {
    $stmt = db()->prepare("SELECT * FROM abonnements WHERE reference=? AND user_id=? LIMIT 1");
    $stmt->execute([$reference, $user['id']]);
    $ab = $stmt->fetch();
    if (!$ab) fail('Abonnement introuvable', 404);
    if ($ab['statut'] === 'actif') {
      json_out(['ok' => true, 'alreadyActive' => true, 'simulated' => $fournisseur->estSimule(), ...map_subscription_status($user['id'])]);
    }
    if ($ab['statut'] !== 'en_attente') fail('Paiement non modifiable');

    $paye = $fournisseur->estSimule();
    $eventId = 'simulated:' . $reference . ':client';
    if (!$fournisseur->estSimule()) {
      $providerRef = column_exists('abonnements', 'provider_ref') ? ($ab['provider_ref'] ?? null) : null;
      try {
        $statut = $fournisseur->consulterStatut($reference, $providerRef ? (string)$providerRef : null);
      } catch (Throwable $e) {
        fail('Vérification opérateur impossible', 502);
      }
      if (!confirmation_client_peut_activer(false, !empty($statut['paye']))) {
        fail($statut['erreur'] ?? 'Paiement non confirmé par l\'opérateur', 402);
      }
      $paye = true;
      $eventId = (string)($statut['providerEventId'] ?? ('pay:' . $reference));
    }

    $resultat = persister_activation_pro($ab, [
      'providerEventId' => $eventId,
      'paye' => $paye,
      'now' => time(),
    ], $fournisseur->code());

    if (!empty($resultat['prolonge'])) {
      dispatch_notification_event('paiement_confirme', [
        'montant' => number_format((int)$ab['montant'], 0, ',', ' '),
        'titre' => 'Abonnement EZOA-TO (6 mois)',
      ], ['userId' => $user['id'], 'url' => '/account/abonnement']);
    }

    json_out([
      'ok' => true,
      'simulated' => $fournisseur->estSimule(),
      'resultat' => $resultat['resultat'],
      ...map_subscription_status($user['id']),
    ]);
  }

  if (user_has_active_subscription($user['id'])) {
    json_out(['alreadyActive' => true, 'simulated' => $fournisseur->estSimule(), ...map_subscription_status($user['id'])]);
  }

  $methode = $body['methode'] ?? '';
  $telephone = preg_replace('/\D/', '', $body['telephone'] ?? '');
  if (!in_array($methode, ['flooz', 'tmoney'], true)) fail('Méthode invalide');
  if (strlen($telephone) < 8) fail('Numéro de téléphone invalide');

  $montant = subscription_price();
  $expMin = (int)($cfg['abonnement']['expiration_minutes'] ?? 15);

  $pending = db()->prepare("SELECT * FROM abonnements
    WHERE user_id=? AND statut='en_attente'
    AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE) LIMIT 1");
  $pending->execute([$user['id'], $expMin]);
  $existing = $pending->fetch();
  if ($existing) {
    json_out(reponse_init_abonnement($existing, $methode, $montant, $fournisseur));
  }

  $id = uuid();
  $ref = payment_reference();
  $hasProvider = column_exists('abonnements', 'provider');
  if ($hasProvider) {
    db()->prepare("INSERT INTO abonnements (id,user_id,montant,methode,telephone,reference,provider,statut)
      VALUES (?,?,?,?,?,?,?,'en_attente')")
      ->execute([$id, $user['id'], $montant, $methode, $telephone, $ref, $fournisseur->code()]);
  } else {
    db()->prepare("INSERT INTO abonnements (id,user_id,montant,methode,telephone,reference,statut)
      VALUES (?,?,?,?,?,?,'en_attente')")
      ->execute([$id, $user['id'], $montant, $methode, $telephone, $ref]);
  }

  $row = ['id' => $id, 'reference' => $ref, 'provider_ref' => null];
  try {
    $init = $fournisseur->initier([
      'reference' => $ref,
      'montant' => $montant,
      'methode' => $methode,
      'telephone' => $telephone,
      'description' => 'Abonnement EZOA-TO Pro ' . subscription_duration_months() . ' mois',
    ]);
  } catch (Throwable $e) {
    db()->prepare("UPDATE abonnements SET statut='annule' WHERE id=?")->execute([$id]);
    fail($e->getMessage() !== '' ? $e->getMessage() : 'Initiation du paiement impossible', 502);
  }
  if ($hasProvider && !empty($init['providerRef'])) {
    db()->prepare('UPDATE abonnements SET provider_ref=? WHERE id=?')->execute([$init['providerRef'], $id]);
    $row['provider_ref'] = $init['providerRef'];
  }

  json_out(reponse_init_abonnement($row, $methode, $montant, $fournisseur, $init));
}

function reponse_init_abonnement(array $row, string $methode, int $montant, FournisseurPaiement $fournisseur, ?array $init = null): array {
  $instructions = $init['instructions'] ?? build_mobile_money_instructions($methode, (string)$row['reference'], $montant);
  return [
    'id' => $row['id'],
    'reference' => $row['reference'],
    'montant' => $montant,
    'methode' => $methode,
    'provider' => $fournisseur->code(),
    'simulated' => $fournisseur->estSimule(),
    'redirectUrl' => $init['redirectUrl'] ?? null,
    'instructions' => $instructions,
  ];
}

fail('Action inconnue', 404);
