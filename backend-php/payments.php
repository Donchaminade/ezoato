<?php
// backend-php/payments.php — Paiement Mobile Money (examens + corrigés type)
declare(strict_types=1);
require __DIR__ . '/helpers.php';
cors();

$action = $_GET['action'] ?? '';
$cfg = cfg();

if ($action === 'acces') {
  $user = require_user();
  $epreuveId = $_GET['epreuve_id'] ?? '';
  if (!$epreuveId) fail('epreuve_id requis');

  $stmt = db()->prepare("SELECT * FROM epreuves WHERE id=? AND statut='validee'");
  $stmt->execute([$epreuveId]);
  $ep = $stmt->fetch();
  if (!$ep) fail('Épreuve introuvable', 404);

  $montant = prix_epreuve($ep);
  if (!requires_payment($ep)) {
    json_out(['requiresPayment' => false, 'hasAccess' => true, 'montant' => 0]);
  }

  $hasAccess = user_has_access($user['id'], $epreuveId);
  json_out([
    'requiresPayment' => true,
    'hasAccess' => $hasAccess,
    'expiresAt' => $hasAccess ? user_access_expires_at($user['id'], $epreuveId) : null,
    'montant' => $montant,
    'devise' => $cfg['paiement']['devise'],
  ]);
}

$user = require_user();

if ($action === 'initier') {
  $body = json_input();
  $epreuveId = trim($body['epreuveId'] ?? '');
  $methode = $body['methode'] ?? '';
  $telephone = preg_replace('/\D/', '', $body['telephone'] ?? '');

  if (!$epreuveId) fail('epreuveId requis');
  if (!in_array($methode, ['flooz', 'tmoney'], true)) fail('Méthode invalide');
  if (strlen($telephone) < 8) fail('Numéro de téléphone invalide');

  $stmt = db()->prepare("SELECT * FROM epreuves WHERE id=? AND statut='validee'");
  $stmt->execute([$epreuveId]);
  $ep = $stmt->fetch();
  if (!$ep) fail('Épreuve introuvable', 404);
  if (!requires_payment($ep)) fail('Cette épreuve est gratuite');

  $montant = prix_epreuve($ep);

  if (user_has_access($user['id'], $epreuveId)) {
    json_out([
      'alreadyPaid' => true,
      'hasAccess' => true,
      'expiresAt' => user_access_expires_at($user['id'], $epreuveId),
    ]);
  }

  $pending = db()->prepare("SELECT id, reference, statut FROM paiements
    WHERE user_id=? AND epreuve_id=? AND statut='en_attente'
    AND cree_le > DATE_SUB(NOW(), INTERVAL ? MINUTE) LIMIT 1");
  $pending->execute([$user['id'], $epreuveId, $cfg['paiement']['expiration_minutes']]);
  $existing = $pending->fetch();
  if ($existing) {
    json_out([
      'id' => $existing['id'],
      'reference' => $existing['reference'],
      'montant' => $montant,
      'methode' => $methode,
      'instructions' => build_instructions($methode, $existing['reference'], $montant),
    ]);
  }

  $id = uuid();
  $ref = payment_reference();
  db()->prepare("INSERT INTO paiements (id,user_id,epreuve_id,montant,methode,telephone,reference,statut)
    VALUES (?,?,?,?,?,?,?,'en_attente')")
    ->execute([$id, $user['id'], $epreuveId, $montant, $methode, $telephone, $ref]);

  json_out([
    'id' => $id,
    'reference' => $ref,
    'montant' => $montant,
    'methode' => $methode,
    'instructions' => build_instructions($methode, $ref, $montant),
  ]);
}

if ($action === 'confirmer') {
  $body = json_input();
  $reference = trim($body['reference'] ?? '');
  if (!$reference) fail('reference requise');

  $stmt = db()->prepare("SELECT * FROM paiements WHERE reference=? AND user_id=? LIMIT 1");
  $stmt->execute([$reference, $user['id']]);
  $pay = $stmt->fetch();
  if (!$pay) fail('Paiement introuvable', 404);
  if ($pay['statut'] === 'confirme') {
    json_out([
      'ok' => true,
      'hasAccess' => user_has_access($user['id'], $pay['epreuve_id']),
      'expiresAt' => user_access_expires_at($user['id'], $pay['epreuve_id']),
      'alreadyConfirmed' => true,
    ]);
  }
  if ($pay['statut'] !== 'en_attente') fail('Paiement non modifiable');

  db()->prepare("UPDATE paiements SET statut='confirme', confirme_le=NOW() WHERE id=?")
      ->execute([$pay['id']]);

  $ep = db()->prepare('SELECT titre FROM epreuves WHERE id = ?');
  $ep->execute([$pay['epreuve_id']]);
  dispatch_notification_event('paiement_confirme', [
    'montant' => number_format((int)$pay['montant'], 0, ',', ' '),
    'titre' => $ep->fetchColumn() ?: 'Épreuve',
  ], ['userId' => $user['id'], 'url' => '/account/bibliotheque']);

  json_out([
    'ok' => true,
    'hasAccess' => true,
    'expiresAt' => user_access_expires_at($user['id'], $pay['epreuve_id']),
  ]);
}

fail('Action inconnue', 404);

function build_instructions(string $methode, string $ref, int $montant): array {
  if ($methode === 'flooz') {
    return [
      'titre' => 'Payer avec Flooz (Moov)',
      'etapes' => [
        "Composez *155*1# sur votre téléphone Flooz",
        "Sélectionnez « Payer un marchand »",
        "Entrez le code marchand EZOA-TO et le montant {$montant} FCFA",
        "Confirmez avec votre code PIN",
        "Référence : {$ref}",
      ],
      'ussd' => '*155*1#',
    ];
  }
  return [
    'titre' => 'Payer avec T-Money (Togocom)',
    'etapes' => [
      "Composez *144*1# sur votre téléphone T-Money",
      "Sélectionnez « Payer » puis « Marchand »",
      "Entrez le montant {$montant} FCFA",
      "Confirmez avec votre code PIN",
      "Référence : {$ref}",
    ],
    'ussd' => '*144*1#',
  ];
}
