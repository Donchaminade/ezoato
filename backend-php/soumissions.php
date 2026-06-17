<?php
// backend-php/soumissions.php — POST /soumissions (multipart) → images ou PDF → preview.pdf
declare(strict_types=1);
require __DIR__ . '/helpers.php';
require __DIR__ . '/lib/storage-paths.php';
require __DIR__ . '/lib/image-pdf.php';

cors();
$user = require_user();
$cfg  = require __DIR__ . '/config.php';

$titre = normalize_text($_POST['titre'] ?? ''); if (!$titre) fail('Titre requis');
$matiere = normalize_text($_POST['matiere'] ?? '');
$niveau  = $_POST['niveau'] ?? '';
$classe  = normalize_text($_POST['classe'] ?? '');
$annee   = (int)($_POST['annee'] ?? 0);
$type    = $_POST['type'] ?? '';
$periode = $_POST['periode'] ? normalize_text($_POST['periode']) : null;
$examen  = $_POST['examen'] ?? null;
$ville   = normalize_ville($_POST['ville'] ?? '');

if (!in_array($niveau, ['college','lycee'], true)) fail('Niveau invalide');
if (!in_array($type, ['devoir','composition','examen'], true)) fail('Type invalide');
if ($annee < 2000 || $annee > 2030) fail('Année invalide');
if (!$matiere || !$classe || !$ville) fail('Métadonnées incomplètes');

$pdfFile = $_FILES['pdf'] ?? null;
$hasPdf = $pdfFile && ($pdfFile['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK;
$files = $_FILES['images'] ?? null;
$hasImages = $files && is_array($files['tmp_name'] ?? null)
  && count(array_filter($files['tmp_name'], fn($t) => $t !== '' && $t !== null)) > 0;

if ($hasPdf && $hasImages) fail('Envoie soit un PDF, soit des images, pas les deux.');
if (!$hasPdf && !$hasImages) fail('Ajoute au moins une image ou un fichier PDF.');

$id = uuid();
$imgDir = soumission_images_dir($cfg, $annee, $type, $id);
$pdfPath = soumission_preview_pdf($cfg, $annee, $type, $id);

$savedPaths = [];
if ($hasPdf) {
  validate_uploaded_pdf($pdfFile);
  if (!move_uploaded_file($pdfFile['tmp_name'], $pdfPath)) fail('Échec enregistrement PDF');
  $pages = pdf_page_count($pdfPath);
} else {
  if (!extension_loaded('gd')) fail('Extension GD requise pour le traitement des images');

  $pageNum = 0;
  foreach ($files['tmp_name'] as $i => $tmp) {
    if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;
    $mime = mime_content_type($tmp);
    if (!in_array($mime, ['image/jpeg','image/png','image/webp'], true)) fail('Format image non supporté (JPG, PNG, WebP)');
    if ($files['size'][$i] > 8 * 1024 * 1024) fail('Image trop lourde (8 Mo max)');
    $ext = $mime === 'image/png' ? 'png' : ($mime === 'image/webp' ? 'webp' : 'jpg');
    $pageNum++;
    $dst = "$imgDir/" . str_pad((string)$pageNum, 2, '0', STR_PAD_LEFT) . ".$ext";
    move_uploaded_file($tmp, $dst);
    $savedPaths[] = $dst;
  }

  if (!$savedPaths) fail('Aucune image valide reçue');

  $pages = images_to_pdf_a4($savedPaths, $pdfPath);
  if ($pages < 1 || !is_file($pdfPath)) fail('Échec de la génération du PDF');
}
$tailleKo = (int)(filesize($pdfPath) / 1024);

// --- Détection de doublons potentiels ---
$dup = db()->prepare("SELECT id FROM epreuves
  WHERE matiere=? AND niveau=? AND classe=? AND annee=? AND type=?
    AND (etablissement_id <=> (SELECT id FROM etablissements WHERE nom=? LIMIT 1)
         OR examen <=> ?) AND statut='validee' LIMIT 5");
$etabRaw = trim((string)($_POST['etablissement'] ?? ''));
$etab = $etabRaw !== '' ? (repair_display_text($etabRaw) ?? normalize_text($etabRaw)) : null;
$dup->execute([$matiere,$niveau,$classe,$annee,$type,$etab,$examen]);
$doublons = array_column($dup->fetchAll(), 'id');

// --- Résolution établissement ---
$etabId = null;
if ($etab) {
  $s = db()->prepare('SELECT id FROM etablissements WHERE nom = ?');
  $s->execute([$etab]);
  $etabId = $s->fetchColumn() ?: null;
  if (!$etabId) {
    db()->prepare('INSERT INTO etablissements (nom, ville, niveau) VALUES (?,?,?)')
        ->execute([$etab, $ville, $niveau]);
    $etabId = (int)db()->lastInsertId();
  }
}

db()->prepare("INSERT INTO soumissions
  (id,titre,matiere,niveau,classe,annee,type,periode,examen,etablissement_id,ville,
   images_json,pdf_preview_path,soumis_par,statut,doublons_json)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
  ->execute([
    $id, $titre, $matiere, $niveau, $classe, $annee, $type, $periode, $examen,
    $etabId, $ville, json_encode($savedPaths), $pdfPath, $user['id'], 'en_attente',
    $doublons ? json_encode($doublons) : null,
  ]);

dispatch_notification_event('soumission_recue', [
  'nom' => $user['nom'] ?? 'Contributeur',
  'titre' => $titre,
  'matiere' => $matiere,
], ['url' => '/admin?section=soumissions']);

json_out([
  'id' => $id,
  'pages' => $pages,
  'tailleKo' => $tailleKo,
  'doublonsPotentiels' => $doublons,
  'storagePath' => "soumissions/$annee/" . type_folder($type) . "/$id",
]);
