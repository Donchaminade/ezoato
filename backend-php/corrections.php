<?php
/**
 * API demandes de correction.
 * Les corrections validées ne sont jamais servies avec l'épreuve du catalogue.
 */
declare(strict_types=1);

require __DIR__ . '/helpers.php';
require __DIR__ . '/lib/corrections/bootstrap.php';

cors();

$action = (string)($_GET['action'] ?? '');
if (!table_exists('correction_demandes')) {
  fail('Demandes de correction non installées. Appliquer migration-demandes-correction.sql', 503);
}

$public = $action === 'reglages_publics';
$user = $public ? (current_user() ?? ['id' => '', 'role' => 'invite', 'nom' => '']) : require_user();
$pdo = db();
$in = correction_http_input();

if ($action === 'reglages_publics') {
  json_out(correction_reglages_publics(correction_reglages_lire($pdo)));
}

if ($action === 'mes_demandes') {
  $rows = correction_lister_ids($pdo, 'SELECT id FROM correction_demandes WHERE eleve_id=? ORDER BY cree_le DESC', [$user['id']]);
  json_out(array_map(fn($id) => correction_vue($pdo, correction_charger($pdo, $id), $user), $rows));
}

if ($action === 'creer_demande' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $epreuveId = (string)($in['epreuveId'] ?? $in['epreuve_id'] ?? '');
  if ($epreuveId === '') {
    fail('Épreuve requise');
  }
  $audioPath = null;
  $id = correction_uuid();
  if (!empty($_FILES['audio']) && (($_FILES['audio']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE)) {
    $dir = rtrim((string)cfg()['uploads_dir'], '/') . '/corrections-audio';
    $audioPath = correction_http_sauver_upload($_FILES['audio'], $dir, correction_http_mimes_audio(), 8 * 1024 * 1024);
  }
  $res = correction_service_creer($pdo, [
    'id' => $id,
    'epreuve' => correction_http_epreuve($epreuveId),
    'exercices' => $in['exercices'] ?? [],
    'blocage_texte' => $in['blocage'] ?? $in['blocageTexte'] ?? '',
    'audio_path' => $audioPath,
  ], correction_http_ctx($user));
  correction_http_sortir($res);
}

if ($action === 'demande') {
  $demande = correction_http_charger((string)($_GET['id'] ?? ''));
  if (!correction_http_voit($user, $demande)) {
    fail('Demande introuvable', 404);
  }
  json_out(correction_vue($pdo, $demande, $user));
}

if ($action === 'audio') {
  $demande = correction_http_charger((string)($_GET['id'] ?? ''));
  if (!correction_http_voit($user, $demande) || empty($demande['audio_path']) || !is_file($demande['audio_path'])) {
    fail('Audio introuvable', 404);
  }
  $mime = mime_content_type($demande['audio_path']) ?: 'application/octet-stream';
  header('Content-Type: ' . $mime);
  header('Content-Length: ' . filesize($demande['audio_path']));
  header('Content-Disposition: inline; filename="blocage-audio"');
  readfile($demande['audio_path']);
  exit;
}

if ($action === 'qcm' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $demande = correction_http_charger((string)($_GET['id'] ?? ''));
  if ((string)$demande['eleve_id'] !== (string)$user['id']) {
    fail('Demande introuvable', 404);
  }
  if ($demande['statut'] !== 'traitee_ia' || !is_array($demande['reponse_ia'])) {
    fail('Pas de questionnaire sur cette demande', 409);
  }
  $choice = $in['choice'] ?? $in['index'] ?? null;
  if (!is_numeric($choice)) {
    fail('Choix requis');
  }
  json_out(correction_repondre_qcm($demande['reponse_ia'], (string)($in['questionId'] ?? ''), (int)$choice));
}

if ($action === 'payer' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  require_once __DIR__ . '/lib/correction-encaissement.php';
  $demande = correction_http_charger((string)($_GET['id'] ?? ''));
  if ((string)$demande['eleve_id'] !== (string)$user['id']) {
    fail('Demande introuvable', 404);
  }
  $reference = trim((string)($in['reference'] ?? ''));
  if ($reference !== '') {
    $res = correction_encaissement_confirmer($pdo, $user, (string)$demande['id'], $reference);
    if (!$res['ok']) {
      fail($res['error'] ?? 'Règlement impossible', (int)($res['code'] ?? 400));
    }
    json_out($res['demande']);
  }
  $methode = (string)($in['methode'] ?? '');
  $telephone = (string)($in['telephone'] ?? '');
  $res = correction_encaissement_initier($pdo, $user, $demande, $methode, $telephone);
  if (!$res['ok']) {
    fail($res['error'] ?? 'Paiement impossible', (int)($res['code'] ?? 400));
  }
  json_out($res['paiement']);
}

if ($action === 'confirmer_reglement' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $ctx = correction_http_ctx($user);
  if (correction_reglement_header_valide((string)($_SERVER['HTTP_X_EZOATO_REGLEMENT'] ?? ''))) {
    $ctx['reglement_systeme'] = true;
  }
  $res = correction_service_confirmer_reglement(
    $pdo,
    (string)($_GET['id'] ?? ''),
    $user,
    $ctx,
    isset($in['reference']) ? (string)$in['reference'] : null
  );
  correction_http_sortir($res);
}

if ($action === 'candidature' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $dir = rtrim((string)cfg()['uploads_dir'], '/') . '/corrections-justificatifs/' . $user['id'];
  $piece = correction_http_sauver_upload($_FILES['piece_identite'] ?? [], $dir, correction_http_mimes_justificatif(), 8 * 1024 * 1024);
  $preuve = correction_http_sauver_upload($_FILES['preuve_enseignement'] ?? [], $dir, correction_http_mimes_justificatif(), 8 * 1024 * 1024);
  $res = correction_service_candidature($pdo, [
    'qualite' => $in['qualite'] ?? '',
    'matieres' => $in['matieres'] ?? [],
    'niveaux' => $in['niveaux'] ?? [],
    'piece_identite_path' => $piece,
    'preuve_enseignement_path' => $preuve,
  ], correction_http_ctx($user));
  if (!$res['ok']) {
    fail($res['error'], $res['code'] ?? 400);
  }
  json_out($res['profil']);
}

if ($action === 'correcteur_profil') {
  json_out(['profil' => correction_mapper_profil(correction_profil_par_user($pdo, $user['id']))]);
}

if ($action === 'correcteur_demandes') {
  $rows = correction_lister_ids(
    $pdo,
    "SELECT id FROM correction_demandes WHERE correcteur_id=? AND statut IN ('assignee','en_revue','rejetee') ORDER BY echeance_le",
    [$user['id']]
  );
  json_out(array_map(fn($id) => correction_vue($pdo, correction_charger($pdo, $id), $user), $rows));
}

if ($action === 'soumettre_correction' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $res = correction_service_appliquer($pdo, (string)($_GET['id'] ?? ''), 'soumettre_correction', $user, [
    'contenu' => (string)($in['contenu'] ?? ''),
    'correction_id' => correction_uuid(),
  ], correction_http_ctx($user));
  correction_http_sortir($res);
}

if ($action === 'validateur_file') {
  if (!correction_acteur_peut_valider($pdo, $user)) {
    fail('Espace réservé aux correcteurs validés', 403);
  }
  $rows = correction_lister_ids($pdo, "SELECT d.id FROM correction_demandes d
    INNER JOIN correction_corrections c ON c.id = d.correction_active_id
    WHERE d.statut = 'en_revue' AND c.correcteur_id != ?
      AND NOT EXISTS (
        SELECT 1 FROM correction_revues r WHERE r.correction_id = c.id AND r.validateur_id = ?
      )
    ORDER BY d.maj_le", [$user['id'], $user['id']]);
  $items = [];
  foreach ($rows as $id) {
    $demande = correction_charger($pdo, $id);
    $vue = correction_vue($pdo, $demande, ['id' => $user['id'], 'role' => 'admin']);
    $vue['comparaison'] = correction_autres_contenus($pdo, $demande['exercices_signature'], (string)$demande['correction']['id']);
    $div = correction_detecter_divergence((string)$demande['correction']['contenu'], $vue['comparaison']);
    $vue['divergence'] = $div;
    $items[] = $vue;
  }
  json_out($items);
}

if ($action === 'revue' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!correction_acteur_peut_valider($pdo, $user)) {
    fail('Espace réservé aux correcteurs validés', 403);
  }
  $correctionId = (string)($_GET['id'] ?? '');
  $stmt = $pdo->prepare('SELECT demande_id FROM correction_corrections WHERE id=?');
  $stmt->execute([$correctionId]);
  $demandeId = $stmt->fetchColumn();
  if (!$demandeId) {
    fail('Correction introuvable', 404);
  }
  $res = correction_service_appliquer($pdo, (string)$demandeId, 'revue', $user, [
    'decision' => (string)($in['decision'] ?? ''),
    'commentaire' => (string)($in['commentaire'] ?? ''),
    'suite' => (string)($in['suite'] ?? 'renvoyer'),
    'revue_id' => correction_uuid(),
  ], correction_http_ctx($user));
  correction_http_sortir($res);
}

if ($action === 'admin_file') {
  correction_http_staff($user);
  $rows = correction_lister_ids($pdo, 'SELECT id FROM correction_demandes ORDER BY maj_le DESC LIMIT 200', []);
  json_out(array_map(fn($id) => correction_vue($pdo, correction_charger($pdo, $id), $user), $rows));
}

if ($action === 'suggestions') {
  correction_http_staff($user);
  $demande = correction_http_charger((string)($_GET['id'] ?? ''));
  json_out(correction_suggerer_correcteurs($pdo, $demande['matiere'], $demande['niveau'], array_filter([
    $demande['eleve_id'],
    $demande['correcteur_id'],
  ])));
}

if ($action === 'admin_reglages' && $_SERVER['REQUEST_METHOD'] === 'GET') {
  require_user(['admin']);
  json_out(correction_reglages_lire($pdo));
}

if ($action === 'admin_reglages' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  require_user(['admin']);
  try {
    correction_reglages_ecrire_mysql($pdo, $in);
  } catch (InvalidArgumentException $e) {
    fail($e->getMessage());
  }
  json_out(correction_reglages_lire($pdo));
}

if ($action === 'admin_correcteurs') {
  correction_http_staff($user);
  $rows = $pdo->query('SELECT * FROM correcteur_profils ORDER BY cree_le DESC')->fetchAll();
  $out = [];
  foreach ($rows as $row) {
    $row['matieres'] = json_decode((string)$row['matieres_json'], true) ?: [];
    $row['niveaux'] = json_decode((string)$row['niveaux_json'], true) ?: [];
    $out[] = correction_mapper_profil($row);
  }
  json_out($out);
}

if ($action === 'admin_correcteur_decision' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  require_user(['admin']);
  $id = (string)($_GET['id'] ?? '');
  $decision = (string)($in['decision'] ?? '');
  if (!in_array($decision, ['valide', 'rejete', 'suspendu'], true)) {
    fail('Décision invalide');
  }
  $motif = trim((string)($in['motif'] ?? ''));
  if ($decision !== 'valide' && $motif === '') {
    fail('Un motif est requis');
  }
  $stmt = $pdo->prepare('SELECT * FROM correcteur_profils WHERE id=?');
  $stmt->execute([$id]);
  $profil = $stmt->fetch();
  if (!$profil) {
    fail('Candidature introuvable', 404);
  }
  $pdo->prepare('UPDATE correcteur_profils SET statut=?, motif=?, valide_par=?, maj_le=? WHERE id=?')
    ->execute([$decision, $motif !== '' ? $motif : null, $user['id'], date('Y-m-d H:i:s'), $id]);
  correction_notifier_user(
    $pdo,
    $profil['user_id'],
    $decision === 'valide' ? 'Profil correcteur validé' : 'Profil correcteur mis à jour',
    $decision === 'valide'
      ? 'Tu peux recevoir des demandes de correction. Le paiement passe par ton portefeuille, après validation.'
      : ($motif !== '' ? $motif : 'Décision enregistrée.'),
    '/corrections/correcteur'
  );
  json_out(['ok' => true]);
}

if ($action === 'justificatif') {
  require_user(['admin']);
  $stmt = $pdo->prepare('SELECT * FROM correcteur_profils WHERE id=?');
  $stmt->execute([(string)($_GET['id'] ?? '')]);
  $profil = $stmt->fetch();
  if (!$profil) {
    fail('Justificatif introuvable', 404);
  }
  $path = ($_GET['doc'] ?? '') === 'preuve' ? $profil['preuve_enseignement_path'] : $profil['piece_identite_path'];
  if (!$path || !is_file($path)) {
    fail('Fichier introuvable', 404);
  }
  header('Content-Type: ' . (mime_content_type($path) ?: 'application/octet-stream'));
  header('Content-Disposition: inline; filename="' . basename($path) . '"');
  readfile($path);
  exit;
}

if ($action === 'admin_confirmer' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  correction_http_staff($user);
  correction_http_sortir(correction_service_appliquer($pdo, (string)($_GET['id'] ?? ''), 'confirmer', $user, [], correction_http_ctx($user)));
}

if ($action === 'admin_ia' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  correction_http_staff($user);
  correction_http_sortir(correction_service_appliquer($pdo, (string)($_GET['id'] ?? ''), 'renvoyer_ia', $user, [], correction_http_ctx($user)));
}

if ($action === 'admin_assigner' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  correction_http_staff($user);
  correction_http_sortir(correction_service_assigner($pdo, (string)($_GET['id'] ?? ''), $user, (string)($in['correcteurId'] ?? ''), correction_http_ctx($user)));
}

if ($action === 'admin_reassigner' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  correction_http_staff($user);
  correction_http_sortir(correction_service_appliquer($pdo, (string)($_GET['id'] ?? ''), 'reassigner', $user, [
    'correcteur_id' => (string)($in['correcteurId'] ?? ''),
  ], correction_http_ctx($user)));
}

if ($action === 'admin_renvoyer' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  correction_http_staff($user);
  correction_http_sortir(correction_service_appliquer($pdo, (string)($_GET['id'] ?? ''), 'renvoyer_correcteur', $user, [], correction_http_ctx($user)));
}

if ($action === 'admin_echues' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  correction_http_staff($user);
  json_out(correction_service_reassigner_echues($pdo, correction_http_ctx($user)));
}

fail('Action inconnue', 404);

function correction_http_input(): array
{
  $ct = (string)($_SERVER['CONTENT_TYPE'] ?? '');
  if (str_contains($ct, 'multipart/form-data') || !empty($_POST)) {
    $in = $_POST;
    foreach (['exercices', 'matieres', 'niveaux'] as $key) {
      if (isset($in[$key]) && is_string($in[$key])) {
        $decoded = json_decode($in[$key], true);
        $in[$key] = is_array($decoded) ? $decoded : array_values(array_filter(array_map('trim', explode(',', $in[$key]))));
      }
    }
    return $in;
  }
  return json_input();
}

function correction_http_ctx(array $user): array
{
  return [
    'user' => $user,
    'now' => date('Y-m-d H:i:s'),
    'is_pro' => correction_eleve_est_pro($user),
    'periode' => correction_periode_pro($user),
    'credit' => 'correction_credit_portefeuille',
  ];
}

function correction_http_epreuve(string $id): array
{
  $stmt = db()->prepare('SELECT id, titre, matiere, niveau, classe, type, statut FROM epreuves WHERE id=?');
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  if (!$row || ($row['statut'] ?? '') !== 'validee') {
    fail('Épreuve introuvable dans le catalogue', 404);
  }
  return $row;
}

function correction_http_charger(string $id): array
{
  $demande = correction_charger(db(), $id);
  if (!$demande) {
    fail('Demande introuvable', 404);
  }
  return $demande;
}

function correction_http_staff(array $user): void
{
  if (!in_array($user['role'] ?? '', ['admin', 'gestionnaire'], true)) {
    fail('Accès refusé', 403);
  }
}

function correction_http_voit(array $user, array $demande): bool
{
  if (in_array($user['role'] ?? '', ['admin', 'gestionnaire'], true)) {
    return true;
  }
  if ((string)$user['id'] === (string)$demande['eleve_id']) {
    return true;
  }
  if ((string)$user['id'] !== '' && (string)$user['id'] === (string)($demande['correcteur_id'] ?? '')) {
    return true;
  }
  return false;
}

function correction_http_sortir(array $res): void
{
  if (!$res['ok']) {
    fail($res['error'] ?? 'Erreur', (int)($res['code'] ?? 400));
  }
  json_out($res['demande'] ?? $res);
}

function correction_http_mimes_audio(): array
{
  return ['audio/webm', 'video/webm', 'audio/mpeg', 'audio/mp4', 'video/mp4', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/aac', 'audio/x-m4a'];
}

function correction_http_mimes_justificatif(): array
{
  return ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
}

function correction_http_sauver_upload(array $file, string $destDir, array $mimes, int $max): string
{
  if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    fail('Fichier manquant ou illisible');
  }
  if (($file['size'] ?? 0) > $max) {
    fail('Fichier trop lourd');
  }
  $mime = mime_content_type($file['tmp_name']) ?: '';
  if (!in_array($mime, $mimes, true)) {
    fail('Format de fichier non accepté');
  }
  if (!is_dir($destDir) && !mkdir($destDir, 0755, true) && !is_dir($destDir)) {
    fail('Stockage indisponible', 500);
  }
  $map = [
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/jpeg' => 'jpg',
    'application/pdf' => 'pdf',
    'audio/mpeg' => 'mp3',
    'audio/mp4' => 'm4a',
    'video/mp4' => 'm4a',
    'audio/x-m4a' => 'm4a',
    'audio/aac' => 'aac',
    'audio/wav' => 'wav',
    'audio/x-wav' => 'wav',
    'audio/webm' => 'webm',
    'video/webm' => 'webm',
    'audio/ogg' => 'ogg',
  ];
  $dest = rtrim($destDir, '/') . '/' . correction_uuid() . '.' . ($map[$mime] ?? 'bin');
  if (!move_uploaded_file($file['tmp_name'], $dest)) {
    fail('Enregistrement impossible', 500);
  }
  return $dest;
}
