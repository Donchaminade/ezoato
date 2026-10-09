<?php
// backend-php/epreuves-preview.php — Aperçu images ou PDF inline (accès payant requis si applicable)
declare(strict_types=1);
require __DIR__ . '/helpers.php';
require __DIR__ . '/lib/storage-paths.php';
cors();

$id = $_GET['id'] ?? '';
if (!$id) fail('id requis');

$stmt = db()->prepare("SELECT e.*, et.nom AS etablissement FROM epreuves e
  LEFT JOIN etablissements et ON et.id = e.etablissement_id
  WHERE e.id = ? AND e.statut = 'validee'");
$stmt->execute([$id]);
$ep = $stmt->fetch();
if (!$ep) fail('Introuvable', 404);

$full = isset($_GET['full']) && $_GET['full'] !== '0' && $_GET['full'] !== '';
$page = max(1, min(20, (int)($_GET['page'] ?? 1)));

$tier = epreuve_access_tier($ep);
$lire = isset($_GET['lire']) && $_GET['lire'] !== '0' && $_GET['lire'] !== '';
$consultation = visionneuse_requiert_acces($tier, $page, $full, $lire);
if ($consultation) {
  $user = current_user();
  if (!$user) fail('Connexion requise', 401);
  $eval = evaluer_acces_epreuve($user['id'], $ep, true);
  refuser_si_acces_interdit($eval);
}

$cache = $consultation ? 'private, no-store' : 'public, max-age=3600';

if ($full) {
  $pdfPath = (string)$ep['pdf_path'];
  if (!fichier_dans_uploads($pdfPath, (string)cfg()['uploads_dir'])) fail('Fichier PDF introuvable', 404);
  header('Content-Type: application/pdf');
  header('Content-Disposition: inline; filename="apercu.pdf"');
  header('Content-Length: ' . filesize($pdfPath));
  header('Cache-Control: ' . $cache);
  header('X-Content-Type-Options: nosniff');
  readfile($pdfPath);
  exit;
}

$imagePath = epreuve_preview_image_path($ep, $page);
if (!$imagePath || !fichier_dans_uploads($imagePath, (string)cfg()['uploads_dir'])) fail('Aperçu image indisponible', 404);

$mime = match (strtolower(pathinfo($imagePath, PATHINFO_EXTENSION))) {
  'png' => 'image/png',
  'webp' => 'image/webp',
  default => 'image/jpeg',
};
header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($imagePath));
header('Cache-Control: ' . $cache);
header('X-Content-Type-Options: nosniff');
readfile($imagePath);
exit;
