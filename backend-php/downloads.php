<?php
// backend-php/downloads.php — Téléchargement sécurisé avec contrôle paiement
declare(strict_types=1);
require __DIR__ . '/helpers.php';
cors();

$id = $_GET['id'] ?? '';
if (!$id) fail('id requis');

$user = require_user();

$stmt = db()->prepare("SELECT e.*, et.nom AS etablissement FROM epreuves e
  LEFT JOIN etablissements et ON et.id = e.etablissement_id
  WHERE e.id = ? AND e.statut = 'validee'");
$stmt->execute([$id]);
$ep = $stmt->fetch();
if (!$ep) fail('Introuvable', 404);

if (requires_payment($ep) && !user_has_access($user['id'], $id)) {
  $prix = prix_epreuve($ep);
  fail("Paiement requis pour télécharger ({$prix} FCFA)", 402);
}

$pdfPath = $ep['pdf_path'];
if (!is_file($pdfPath)) fail('Fichier PDF introuvable', 404);

// Enregistrer le téléchargement (une fois par user/épreuve)
$dl = db()->prepare("INSERT IGNORE INTO telechargements (user_id, epreuve_id) VALUES (?, ?)");
$dl->execute([$user['id'], $id]);
if ($dl->rowCount() > 0) {
  db()->prepare("UPDATE epreuves SET telechargements = telechargements + 1 WHERE id = ?")
      ->execute([$id]);
}

$filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $ep['titre']) . '.pdf';
header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . filesize($pdfPath));
header('Cache-Control: private, max-age=3600');
readfile($pdfPath);
exit;
