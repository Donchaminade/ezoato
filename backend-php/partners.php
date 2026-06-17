<?php
// backend-php/partners.php — Partenaires publics et formulaires de demande
declare(strict_types=1);
require __DIR__ . '/helpers.php';
cors();

$cfg = cfg();
$base = rtrim($cfg['api_base_url'] ?? '', '/');
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? '';

function map_partenaire(array $row, string $base): array {
  return [
    'id' => $row['id'],
    'nom' => $row['nom'],
    'ville' => $row['ville'] ?? null,
    'type' => $row['type'],
    'siteWeb' => $row['site_web'] ?? null,
    'logoUrl' => !empty($row['logo_path']) ? "$base/partners/{$row['id']}/logo" : null,
    'ordre' => (int)($row['ordre'] ?? 0),
    'visible' => (bool)($row['visible'] ?? true),
  ];
}

// --- Logo partenaire ---
if ($action === 'logo') {
  if (!$id) fail('id requis');
  $stmt = db()->prepare('SELECT logo_path FROM partenaires WHERE id = ? AND visible = 1');
  $stmt->execute([$id]);
  $path = $stmt->fetchColumn();
  if (!$path || !is_file($path)) fail('Logo introuvable', 404);
  $mime = mime_content_type($path) ?: 'image/png';
  header('Content-Type: ' . $mime);
  header('Cache-Control: public, max-age=86400');
  readfile($path);
  exit;
}

// --- Liste partenaires visibles ---
if ($action === 'list' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
  $stmt = db()->query("SELECT * FROM partenaires WHERE visible = 1 ORDER BY ordre ASC, nom ASC");
  json_out(array_map(fn($r) => map_partenaire($r, $base), $stmt->fetchAll()));
}

// --- Demande de soutien ---
if ($action === 'soutien' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $in = json_input();
  $nom = trim($in['nom'] ?? '');
  $email = trim($in['email'] ?? '');
  $telephone = trim($in['telephone'] ?? '') ?: null;
  $organisation = trim($in['organisation'] ?? '') ?: null;
  $type = $in['type'] ?? 'partenariat';
  $message = trim($in['message'] ?? '');

  if (strlen($nom) < 2) fail('Nom requis');
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Adresse email invalide');
  if (!in_array($type, ['partenariat','sponsor','don','mecenat','autre'], true)) fail('Type de soutien invalide');
  if (strlen($message) < 10) fail('Message trop court (10 caractères minimum)');

  $userId = null;
  $u = current_user();
  if ($u) $userId = $u['id'];

  $newId = uuid();
  db()->prepare('INSERT INTO demandes_soutien
    (id,user_id,nom,email,telephone,organisation,type,message)
    VALUES (?,?,?,?,?,?,?,?)')
      ->execute([$newId, $userId, $nom, $email, $telephone, $organisation, $type, $message]);

  json_out(['ok' => true, 'message' => 'Votre demande a été envoyée. Notre équipe vous contactera sous 48 h.']);
}

// --- Demande établissement ---
if ($action === 'etablissement' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $in = json_input();
  $nomEtab = trim($in['nomEtablissement'] ?? '');
  $ville = trim($in['ville'] ?? '');
  $nomContact = trim($in['nomContact'] ?? '');
  $email = trim($in['email'] ?? '');
  $telephone = trim($in['telephone'] ?? '') ?: null;
  $fonction = trim($in['fonction'] ?? '') ?: null;
  $typeDemande = $in['typeDemande'] ?? 'collaboration';
  $message = trim($in['message'] ?? '');

  if (strlen($nomEtab) < 2) fail('Nom de l\'établissement requis');
  if (strlen($ville) < 2) fail('Ville requise');
  if (strlen($nomContact) < 2) fail('Nom du contact requis');
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Adresse email invalide');
  if (!in_array($typeDemande, ['collaboration','modification','retrait','autre'], true)) fail('Type de demande invalide');
  if (strlen($message) < 10) fail('Message trop court (10 caractères minimum)');

  $userId = null;
  $u = current_user();
  if ($u) $userId = $u['id'];

  $newId = uuid();
  db()->prepare('INSERT INTO demandes_etablissement
    (id,user_id,nom_etablissement,ville,nom_contact,email,telephone,fonction,type_demande,message)
    VALUES (?,?,?,?,?,?,?,?,?,?)')
      ->execute([$newId, $userId, $nomEtab, $ville, $nomContact, $email, $telephone, $fonction, $typeDemande, $message]);

  json_out(['ok' => true, 'message' => 'Votre demande a été envoyée. Nous vous répondrons dans les meilleurs délais.']);
}

fail('Action inconnue', 404);
