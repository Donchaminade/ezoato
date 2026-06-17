<?php
// backend-php/wallet.php — Portefeuille contributeur & retraits
declare(strict_types=1);
require __DIR__ . '/helpers.php';
cors();

$action = $_GET['action'] ?? '';
$user = require_user();
$cfg = cfg()['contributeur'];

if ($action === 'portefeuille') {
  $w = get_or_create_wallet($user['id']);
  $tx = db()->prepare("SELECT id, type, montant, description, reference, cree_le
    FROM portefeuille_transactions WHERE user_id=? ORDER BY cree_le DESC LIMIT 30");
  $tx->execute([$user['id']]);
  $retraits = db()->prepare("SELECT id, montant, methode, telephone, statut, motif_rejet, cree_le, traite_le
    FROM retraits WHERE user_id=? ORDER BY cree_le DESC LIMIT 20");
  $retraits->execute([$user['id']]);
  json_out([
    ...map_wallet($w),
    'transactions' => array_map(function ($t) {
      return [
        'id' => $t['id'],
        'type' => $t['type'],
        'montant' => (int)$t['montant'],
        'description' => $t['description'],
        'reference' => $t['reference'],
        'creeLe' => date('c', strtotime($t['cree_le'])),
      ];
    }, $tx->fetchAll()),
    'retraits' => array_map(function ($r) {
      return [
        'id' => $r['id'],
        'montant' => (int)$r['montant'],
        'methode' => $r['methode'],
        'telephone' => $r['telephone'],
        'statut' => $r['statut'],
        'motifRejet' => $r['motif_rejet'],
        'creeLe' => date('c', strtotime($r['cree_le'])),
        'traiteLe' => $r['traite_le'] ? date('c', strtotime($r['traite_le'])) : null,
      ];
    }, $retraits->fetchAll()),
  ]);
}

if ($action === 'retrait') {
  $body = json_input();
  $montant = (int)($body['montant'] ?? 0);
  $methode = $body['methode'] ?? '';
  $telephone = preg_replace('/\D/', '', $body['telephone'] ?? '');

  $min = (int)$cfg['min_retrait'];
  if ($montant < $min) fail("Minimum {$min} FCFA pour un retrait");
  if (!in_array($methode, ['flooz', 'tmoney'], true)) fail('Méthode invalide');
  if (strlen($telephone) < 8) fail('Numéro invalide');

  $w = get_or_create_wallet($user['id']);
  if ((int)$w['solde'] < $montant) fail('Solde insuffisant');

  $pending = db()->prepare("SELECT 1 FROM retraits WHERE user_id=? AND statut='en_attente' LIMIT 1");
  $pending->execute([$user['id']]);
  if ($pending->fetchColumn()) fail('Un retrait est déjà en cours de traitement');

  $id = uuid();
  if (!debit_wallet($user['id'], $montant, 'Demande de retrait', "retrait-{$id}")) {
    fail('Solde insuffisant');
  }

  db()->prepare("INSERT INTO retraits (id,user_id,montant,methode,telephone,statut)
    VALUES (?,?,?,?,?,'en_attente')")
    ->execute([$id, $user['id'], $montant, $methode, $telephone]);

  dispatch_notification_event('retrait_demande', [
    'nom' => $user['nom'] ?? 'Contributeur',
    'montant' => number_format($montant, 0, ',', ' '),
    'methode' => $methode,
  ], ['url' => '/admin?section=retraits']);

  json_out(['ok' => true, 'id' => $id, 'message' => 'Demande envoyée. Un admin va la traiter sous 48h.']);
}

fail('Action inconnue', 404);
