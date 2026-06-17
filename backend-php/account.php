<?php
// backend-php/account.php — Historique utilisateur
declare(strict_types=1);
require __DIR__ . '/helpers.php';
cors();
$user = require_user();
$action = $_GET['action'] ?? '';

if ($action === 'favoris_list') {
  if (!table_exists('favoris')) fail('Favoris non configurés', 503);
  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') fail('Méthode non autorisée', 405);
  $stmt = db()->prepare("SELECT e.*, et.nom AS etablissement
                         FROM favoris f
                         JOIN epreuves e ON e.id = f.epreuve_id AND e.statut = 'validee'
                         LEFT JOIN etablissements et ON et.id = e.etablissement_id
                         WHERE f.user_id = ?
                         ORDER BY f.cree_le DESC");
  $stmt->execute([$user['id']]);
  json_out(['items' => array_map('map_epreuve', $stmt->fetchAll())]);
}

if ($action === 'favoris') {
  if (!table_exists('favoris')) fail('Favoris non configurés', 503);
  $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

  if ($method === 'GET') {
    $stmt = db()->prepare('SELECT epreuve_id FROM favoris WHERE user_id = ? ORDER BY cree_le DESC');
    $stmt->execute([$user['id']]);
    json_out(['ids' => array_column($stmt->fetchAll(), 'epreuve_id')]);
  }

  if ($method === 'POST') {
    $in = json_input();
    $epreuveId = trim($in['epreuveId'] ?? '');
    if ($epreuveId === '') fail('epreuveId requis');
    $stmt = db()->prepare('SELECT id FROM epreuves WHERE id = ? AND statut = ?');
    $stmt->execute([$epreuveId, 'validee']);
    if (!$stmt->fetch()) fail('Épreuve introuvable', 404);
    db()->prepare('INSERT IGNORE INTO favoris (user_id, epreuve_id) VALUES (?, ?)')
        ->execute([$user['id'], $epreuveId]);
    json_out(['ok' => true]);
  }

  fail('Méthode non autorisée', 405);
}

if ($action === 'favoris_delete') {
  if (!table_exists('favoris')) fail('Favoris non configurés', 503);
  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'DELETE') fail('Méthode non autorisée', 405);
  $epreuveId = trim($_GET['epreuve_id'] ?? '');
  if ($epreuveId === '') fail('epreuveId requis');
  db()->prepare('DELETE FROM favoris WHERE user_id = ? AND epreuve_id = ?')
      ->execute([$user['id'], $epreuveId]);
  json_out(['ok' => true]);
}

if ($action === 'library') {
  $months = paid_access_months();
  $stmt = db()->prepare("SELECT e.id, e.titre, e.matiere, e.classe, e.annee, e.type, e.examen,
                                e.ville, e.pages, e.taille_ko, e.telechargements, e.epreuve_parent_id,
                                p.confirme_le AS achete_le, t.telecharge_le
                         FROM paiements p
                         JOIN epreuves e ON e.id = p.epreuve_id
                         LEFT JOIN telechargements t ON t.user_id = p.user_id AND t.epreuve_id = e.id
                         WHERE p.user_id = ? AND p.statut = 'confirme'
                         AND p.confirme_le IS NOT NULL
                         AND p.confirme_le > DATE_SUB(NOW(), INTERVAL ? MONTH)
                         ORDER BY p.confirme_le DESC");
  $stmt->execute([$user['id'], $months]);
  $paid = array_map(function ($r) use ($user) {
    return [
      'id' => $r['id'],
      'titre' => $r['titre'],
      'matiere' => $r['matiere'],
      'classe' => $r['classe'],
      'annee' => (int)$r['annee'],
      'type' => $r['type'],
      'examen' => $r['examen'],
      'ville' => $r['ville'],
      'pages' => (int)$r['pages'],
      'tailleKo' => (int)$r['taille_ko'],
      'telechargements' => (int)$r['telechargements'],
      'epreuveParentId' => $r['epreuve_parent_id'],
      'acheteLe' => date('c', strtotime($r['achete_le'])),
      'expiresAt' => user_access_expires_at($user['id'], $r['id']),
      'telechargeLe' => $r['telecharge_le'] ? date('c', strtotime($r['telecharge_le'])) : null,
      'source' => 'achat',
    ];
  }, $stmt->fetchAll());

  $stmt2 = db()->prepare("SELECT e.id, e.titre, e.matiere, e.classe, e.annee, e.type, e.examen,
                                 e.ville, e.pages, e.taille_ko, e.telechargements, e.epreuve_parent_id, t.telecharge_le
                          FROM telechargements t
                          JOIN epreuves e ON e.id = t.epreuve_id
                          LEFT JOIN paiements p ON p.user_id = t.user_id AND p.epreuve_id = e.id AND p.statut = 'confirme'
                          WHERE t.user_id = ? AND p.id IS NULL
                          ORDER BY t.telecharge_le DESC LIMIT 50");
  $stmt2->execute([$user['id']]);
  $free = array_map(function ($r) {
    return [
      'id' => $r['id'],
      'titre' => $r['titre'],
      'matiere' => $r['matiere'],
      'classe' => $r['classe'],
      'annee' => (int)$r['annee'],
      'type' => $r['type'],
      'examen' => $r['examen'],
      'ville' => $r['ville'],
      'pages' => (int)$r['pages'],
      'tailleKo' => (int)$r['taille_ko'],
      'telechargements' => (int)$r['telechargements'],
      'epreuveParentId' => $r['epreuve_parent_id'],
      'telechargeLe' => date('c', strtotime($r['telecharge_le'])),
      'source' => 'gratuit',
    ];
  }, $stmt2->fetchAll());

  json_out(['paid' => $paid, 'free' => $free]);
}

if ($action === 'downloads') {
  $stmt = db()->prepare("SELECT e.id, e.titre, e.matiere, e.classe, e.annee, e.type, e.examen,
                                e.ville, e.pages, e.taille_ko, e.epreuve_parent_id, t.telecharge_le
                         FROM telechargements t
                         JOIN epreuves e ON e.id = t.epreuve_id
                         WHERE t.user_id = ?
                         ORDER BY t.telecharge_le DESC LIMIT 50");
  $stmt->execute([$user['id']]);
  $rows = $stmt->fetchAll();
  json_out(array_map(function ($r) {
    return [
      'id' => $r['id'],
      'titre' => $r['titre'],
      'matiere' => $r['matiere'],
      'classe' => $r['classe'],
      'annee' => (int)$r['annee'],
      'type' => $r['type'],
      'examen' => $r['examen'],
      'ville' => $r['ville'],
      'pages' => (int)$r['pages'],
      'tailleKo' => (int)$r['taille_ko'],
      'epreuveParentId' => $r['epreuve_parent_id'] ?? null,
      'telechargeLe' => date('c', strtotime($r['telecharge_le'])),
    ];
  }, $rows));
}

if ($action === 'soumissions') {
  $id = $_GET['id'] ?? null;
  if ($id) {
    $stmt = db()->prepare("SELECT s.*, et.nom AS etablissement FROM soumissions s
      LEFT JOIN etablissements et ON et.id = s.etablissement_id
      WHERE s.id = ? AND s.soumis_par = ?");
    $stmt->execute([$id, $user['id']]);
    $row = $stmt->fetch();
    if (!$row) fail('Introuvable', 404);
    json_out(map_soumission_detail($row, true));
  }
  $stmt = db()->prepare("SELECT s.id, s.titre, s.matiere, s.classe, s.annee, s.type, s.examen,
                                s.ville, s.statut, s.motif_rejet, s.soumis_le, s.epreuve_id, et.nom AS etablissement
                         FROM soumissions s
                         LEFT JOIN etablissements et ON et.id = s.etablissement_id
                         WHERE s.soumis_par = ?
                         ORDER BY s.soumis_le DESC LIMIT 50");
  $stmt->execute([$user['id']]);
  $rows = $stmt->fetchAll();
  json_out(array_map(function ($r) {
    return [
      'id' => $r['id'],
      'titre' => repair_display_text($r['titre'] ?? '') ?? '',
      'matiere' => repair_display_text($r['matiere'] ?? '') ?? '',
      'classe' => repair_display_text($r['classe'] ?? '') ?? '',
      'annee' => (int)$r['annee'],
      'type' => $r['type'],
      'examen' => $r['examen'],
      'etablissement' => repair_display_text($r['etablissement'] ?? null),
      'ville' => repair_ville_display($r['ville'] ?? ''),
      'statut' => $r['statut'],
      'motifRejet' => $r['motif_rejet'],
      'soumisLe' => date('c', strtotime($r['soumis_le'])),
      'epreuveId' => $r['epreuve_id'],
    ];
  }, $rows));
}

if ($action === 'preview') {
  $id = $_GET['id'] ?? '';
  if (!$id) fail('id requis');
  $stmt = db()->prepare('SELECT pdf_preview_path FROM soumissions WHERE id=? AND soumis_par=?');
  $stmt->execute([$id, $user['id']]);
  $path = $stmt->fetchColumn();
  if (!$path || !is_file($path)) fail('PDF introuvable', 404);
  header('Content-Type: application/pdf');
  header('Content-Disposition: inline; filename="preview.pdf"');
  readfile($path);
  exit;
}

if ($action === 'paiements') {
  $stmt = db()->prepare("SELECT p.id, p.montant, p.methode, p.reference, p.statut, p.cree_le, p.confirme_le,
                                e.id AS epreuve_id, e.titre, e.matiere, e.examen
                         FROM paiements p
                         JOIN epreuves e ON e.id = p.epreuve_id
                         WHERE p.user_id = ?
                         ORDER BY p.cree_le DESC LIMIT 50");
  $stmt->execute([$user['id']]);
  $rows = $stmt->fetchAll();
  json_out(array_map(function ($r) {
    return [
      'id' => $r['id'],
      'montant' => (int)$r['montant'],
      'methode' => $r['methode'],
      'reference' => $r['reference'],
      'statut' => $r['statut'],
      'creeLe' => date('c', strtotime($r['cree_le'])),
      'confirmeLe' => $r['confirme_le'] ? date('c', strtotime($r['confirme_le'])) : null,
      'epreuve' => [
        'id' => $r['epreuve_id'],
        'titre' => $r['titre'],
        'matiere' => $r['matiere'],
        'examen' => $r['examen'],
      ],
    ];
  }, $rows));
}

function map_profile_user(array $u): array {
  return [
    'id' => $u['id'],
    'nom' => $u['nom'],
    'email' => $u['email'],
    'telephone' => $u['telephone'] ?? null,
    'role' => $u['role'],
    'ville' => $u['ville'],
    'createdAt' => isset($u['created_at']) ? date('c', strtotime($u['created_at'])) : null,
  ];
}

function default_notification_prefs(string $userId): array {
  return [
    'userId' => $userId,
    'soumissions' => true,
    'retraits' => true,
    'paiements' => true,
    'moderation' => true,
    'marketing' => false,
    'pushEnabled' => false,
  ];
}

function load_notification_prefs(string $userId): array {
  if (!table_exists('notification_preferences')) {
    return default_notification_prefs($userId);
  }
  $stmt = db()->prepare('SELECT * FROM notification_preferences WHERE user_id = ?');
  $stmt->execute([$userId]);
  $row = $stmt->fetch();
  if (!$row) return default_notification_prefs($userId);
  return [
    'userId' => $userId,
    'soumissions' => (bool)$row['soumissions'],
    'retraits' => (bool)$row['retraits'],
    'paiements' => (bool)$row['paiements'],
    'moderation' => (bool)$row['moderation'],
    'marketing' => (bool)$row['marketing'],
    'pushEnabled' => (bool)$row['push_enabled'],
  ];
}

function save_notification_prefs(string $userId, array $in): array {
  $prefs = load_notification_prefs($userId);
  foreach (['soumissions', 'retraits', 'paiements', 'moderation', 'marketing', 'pushEnabled'] as $key) {
    if (array_key_exists($key, $in)) $prefs[$key] = (bool)$in[$key];
  }
  if (!table_exists('notification_preferences')) {
    return $prefs;
  }
  db()->prepare(
    'INSERT INTO notification_preferences (user_id, soumissions, retraits, paiements, moderation, marketing, push_enabled)
     VALUES (?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       soumissions=VALUES(soumissions), retraits=VALUES(retraits), paiements=VALUES(paiements),
       moderation=VALUES(moderation), marketing=VALUES(marketing), push_enabled=VALUES(push_enabled)'
  )->execute([
    $userId,
    $prefs['soumissions'] ? 1 : 0,
    $prefs['retraits'] ? 1 : 0,
    $prefs['paiements'] ? 1 : 0,
    $prefs['moderation'] ? 1 : 0,
    $prefs['marketing'] ? 1 : 0,
    $prefs['pushEnabled'] ? 1 : 0,
  ]);
  return $prefs;
}

if ($action === 'profile') {
  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $stmt = db()->prepare('SELECT id, nom, email, telephone, role, ville, created_at FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();
    if (!$row) fail('Utilisateur introuvable', 404);
    json_out([
      'user' => map_profile_user($row),
      'notifications' => load_notification_prefs($user['id']),
    ]);
  }

  $in = json_input();
  $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
  $stmt->execute([$user['id']]);
  $u = $stmt->fetch();
  if (!$u) fail('Utilisateur introuvable', 404);

  $nom = trim($in['nom'] ?? $u['nom']);
  $email = strtolower(trim($in['email'] ?? $u['email']));
  $telephone = array_key_exists('telephone', $in)
    ? normalize_phone($in['telephone'] ?? '')
    : ($u['telephone'] ?? '');
  $ville = array_key_exists('ville', $in) ? (trim((string)($in['ville'] ?? '')) ?: null) : $u['ville'];
  $newPwd = $in['password'] ?? '';
  $currentPwd = $in['currentPassword'] ?? '';

  if (strlen($nom) < 2 || strlen($nom) > 120) fail('Nom invalide');
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Email invalide');
  if (strlen($telephone) < 8 || strlen($telephone) > 12) fail('Numéro de téléphone invalide');
  if ($newPwd !== '') {
    if ($currentPwd === '' || !password_verify($currentPwd, $u['password_hash'])) {
      fail('Mot de passe actuel incorrect', 403);
    }
    if (strlen($newPwd) < 8) fail('Nouveau mot de passe trop court (8+ caractères)');
  }

  $sets = ['nom=?', 'email=?', 'telephone=?', 'ville=?'];
  $params = [$nom, $email, $telephone, $ville];
  if ($newPwd !== '') {
    $sets[] = 'password_hash=?';
    $params[] = password_hash($newPwd, PASSWORD_BCRYPT);
  }
  $params[] = $user['id'];

  try {
    db()->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id=?')->execute($params);
  } catch (PDOException $e) {
    $msg = (string)$e->getMessage();
    if (str_contains($msg, 'email')) fail('Email déjà utilisé', 409);
    if (str_contains($msg, 'telephone')) fail('Numéro de téléphone déjà utilisé', 409);
    fail('Modification impossible', 409);
  }

  $stmt = db()->prepare('SELECT id, nom, email, telephone, role, ville, created_at FROM users WHERE id = ?');
  $stmt->execute([$user['id']]);
  json_out(['ok' => true, 'user' => map_profile_user($stmt->fetch())]);
}

if ($action === 'notifications') {
  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $cfg = cfg();
    json_out([
      'preferences' => load_notification_prefs($user['id']),
      'vapidPublicKey' => $cfg['push']['vapid_public_key'] ?? null,
      'pushSupported' => table_exists('push_subscriptions'),
      'inbox' => list_user_inbox($user['id']),
      'unreadCount' => count_unread_notifications($user['id']),
      'rulesReady' => table_exists('notification_rules'),
    ]);
  }
  $prefs = save_notification_prefs($user['id'], json_input());
  json_out(['ok' => true, 'preferences' => $prefs]);
}

if ($action === 'notifications_read') {
  $in = json_input();
  $ids = isset($in['ids']) && is_array($in['ids']) ? array_values(array_filter($in['ids'])) : null;
  mark_notifications_read($user['id'], $ids);
  json_out(['ok' => true, 'unreadCount' => count_unread_notifications($user['id'])]);
}

if ($action === 'notifications_delete') {
  $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
  if ($method !== 'DELETE' && $method !== 'POST') fail('Méthode non autorisée', 405);
  $id = trim($_GET['id'] ?? '');
  if ($id === '') fail('id requis');
  if (!delete_notification($user['id'], $id)) fail('Notification introuvable', 404);
  json_out(['ok' => true, 'unreadCount' => count_unread_notifications($user['id'])]);
}

if ($action === 'notifications_subscribe') {
  if (!table_exists('push_subscriptions')) fail('Notifications push non configurées', 503);
  $in = json_input();
  $endpoint = trim($in['endpoint'] ?? '');
  $p256dh = trim($in['keys']['p256dh'] ?? $in['p256dh'] ?? '');
  $authKey = trim($in['keys']['auth'] ?? $in['auth'] ?? '');
  if ($endpoint === '' || $p256dh === '' || $authKey === '') fail('Abonnement invalide');

  $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);
  db()->prepare(
    'INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth_key, user_agent)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE user_id=VALUES(user_id), p256dh=VALUES(p256dh), auth_key=VALUES(auth_key), user_agent=VALUES(user_agent)'
  )->execute([uuid(), $user['id'], $endpoint, $p256dh, $authKey, $ua ?: null]);

  $prefs = save_notification_prefs($user['id'], ['pushEnabled' => true]);
  json_out(['ok' => true, 'preferences' => $prefs]);
}

if ($action === 'notifications_unsubscribe') {
  if (!table_exists('push_subscriptions')) {
    json_out(['ok' => true, 'preferences' => save_notification_prefs($user['id'], ['pushEnabled' => false])]);
  }
  $in = json_input();
  $endpoint = trim($in['endpoint'] ?? '');
  if ($endpoint !== '') {
    db()->prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?')
        ->execute([$user['id'], $endpoint]);
  } else {
    db()->prepare('DELETE FROM push_subscriptions WHERE user_id = ?')->execute([$user['id']]);
  }
  $prefs = save_notification_prefs($user['id'], ['pushEnabled' => false]);
  json_out(['ok' => true, 'preferences' => $prefs]);
}

fail('Action inconnue', 404);
