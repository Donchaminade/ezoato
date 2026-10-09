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

  $stmt = db()->prepare("SELECT e.*, et.nom AS etablissement FROM epreuves e
    LEFT JOIN etablissements et ON et.id = e.etablissement_id
    WHERE e.id=? AND e.statut='validee'");
  $stmt->execute([$epreuveId]);
  $ep = $stmt->fetch();
  if (!$ep) fail('Épreuve introuvable', 404);

  $consume = !isset($_GET['consume']) || ($_GET['consume'] !== '0' && $_GET['consume'] !== 'false');
  json_out(reponse_acces_api(evaluer_acces_epreuve($user['id'], $ep, $consume)));
}

$user = require_user();

if ($action === 'initier') {
  fail('Le paiement à l\'unité n\'est plus proposé. Passe à l\'abonnement Pro (1 000 FCFA / 6 mois) pour les examens officiels, les concours, ou au-delà du quota gratuit.', 402);
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

fail('Action inconnue', 404);
