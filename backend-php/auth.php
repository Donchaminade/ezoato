<?php
// backend-php/auth.php — auth + réinitialisation mot de passe
declare(strict_types=1);
require __DIR__ . '/helpers.php';
require __DIR__ . '/mail.php';
cors();

$route = $_GET['action'] ?? '';

function reset_token_hash(string $token): string {
  return hash('sha256', $token);
}

function frontend_reset_url(string $token): string {
  $base = rtrim(cfg()['app']['frontend_url'] ?? 'http://localhost:5173', '/');
  return $base . '/auth/reset-password?token=' . urlencode($token);
}

if ($route === 'register') {
  $in = json_input();
  $nom = trim($in['nom'] ?? '');
  $email = strtolower(trim($in['email'] ?? ''));
  $telephone = normalize_phone($in['telephone'] ?? '');
  $pwd = $in['password'] ?? '';
  $profilRaw = $in['profil_type'] ?? $in['profilType'] ?? null;
  // Rétrocompat : sans profil_type → comportement élève (classe/établissement requis)
  $profilType = $profilRaw !== null && trim((string)$profilRaw) !== ''
    ? validate_profil_type((string)$profilRaw, true)
    : 'eleve';
  $needsParcours = profil_needs_parcours($profilType);
  $classe = validate_user_classe($in['classe'] ?? null, $needsParcours, $profilType);
  // Élève / étudiant : établissement requis ; concours : optionnel ; autres : ignoré
  $etablissement = validate_user_etablissement(
    $in['etablissement'] ?? null,
    $needsParcours && $profilType !== 'concours'
  );
  if (!$needsParcours) {
    $classe = null;
    $etablissement = null;
  }
  if (strlen($nom) < 2 || strlen($nom) > 120) fail('Nom invalide');
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Email invalide');
  if (strlen($telephone) < 8 || strlen($telephone) > 12) fail('Numéro de téléphone invalide');
  if (strlen($pwd) < 8) fail('Mot de passe trop court (8+ caractères)');
  $id = uuid();
  try {
    if (users_has_profil_type()) {
      db()->prepare('INSERT INTO users (id,nom,email,telephone,password_hash,role,classe,etablissement,profil_type) VALUES (?,?,?,?,?,?,?,?,?)')
          ->execute([$id, $nom, $email, $telephone, password_hash($pwd, PASSWORD_BCRYPT), 'utilisateur', $classe, $etablissement, $profilType]);
    } else {
      db()->prepare('INSERT INTO users (id,nom,email,telephone,password_hash,role,classe,etablissement) VALUES (?,?,?,?,?,?,?,?)')
          ->execute([$id, $nom, $email, $telephone, password_hash($pwd, PASSWORD_BCRYPT), 'utilisateur', $classe, $etablissement]);
    }
  } catch (PDOException $e) {
    $msg = (string)$e->getMessage();
    if (str_contains($msg, 'email')) fail('Email déjà utilisé', 409);
    if (str_contains($msg, 'telephone')) fail('Numéro de téléphone déjà utilisé', 409);
    fail('Inscription impossible', 409);
  }
  $token = jwt_encode(['sub'=>$id,'exp'=>time()+86400*30]);
  json_out(['token'=>$token,'user'=>map_auth_user([
    'id' => $id,
    'nom' => $nom,
    'email' => $email,
    'telephone' => $telephone,
    'role' => 'utilisateur',
    'ville' => null,
    'classe' => $classe,
    'etablissement' => $etablissement,
    'profil_type' => $profilType,
  ])]);
}

if ($route === 'login') {
  $in = json_input();
  $identifier = trim($in['identifier'] ?? $in['email'] ?? '');
  $pwd = $in['password'] ?? '';
  if ($identifier === '' || $pwd === '') fail('Identifiants invalides', 401);

  $userCols = 'id, nom, email, telephone, role, ville, classe, etablissement, password_hash';
  if (users_has_profil_type()) $userCols = 'id, nom, email, telephone, role, ville, classe, etablissement, profil_type, password_hash';
  if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
    $stmt = db()->prepare("SELECT $userCols FROM users WHERE email = ?");
    $stmt->execute([strtolower($identifier)]);
  } else {
    $telephone = normalize_phone($identifier);
    if (strlen($telephone) < 8) fail('Identifiants invalides', 401);
    $stmt = db()->prepare("SELECT $userCols FROM users WHERE telephone = ?");
    $stmt->execute([$telephone]);
  }
  $u = $stmt->fetch();
  if (!$u || !password_verify($pwd, $u['password_hash'])) fail('Identifiants invalides', 401);
  unset($u['password_hash']);
  $token = jwt_encode(['sub'=>$u['id'],'exp'=>time()+86400*30]);
  json_out(['token'=>$token,'user'=>map_auth_user($u)]);
}

if ($route === 'me') {
  $u = require_user();
  json_out($u);
}

if ($route === 'forgot-password') {
  $in = json_input();
  $email = strtolower(trim($in['email'] ?? ''));
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Email invalide');

  $generic = 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.';
  $out = ['message' => $generic, 'ok' => true];

  $stmt = db()->prepare('SELECT id, nom, email FROM users WHERE email = ?');
  $stmt->execute([$email]);
  $user = $stmt->fetch();
  if (!$user) {
    json_out($out);
  }

  $rawToken = bin2hex(random_bytes(32));
  $tokenHash = reset_token_hash($rawToken);
  $expires = date('Y-m-d H:i:s', time() + 3600);

  $db = db();
  $db->prepare('DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL')->execute([$user['id']]);
  $db->prepare('INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?,?,?,?)')
      ->execute([uuid(), $user['id'], $tokenHash, $expires]);

  $resetUrl = frontend_reset_url($rawToken);
  tea_send_password_reset_email($user['email'], $user['nom'], $resetUrl);

  if (!empty(cfg()['dev']['expose_reset_links'])) {
    $out['resetUrl'] = $resetUrl;
    $out['devNote'] = 'Lien affiché uniquement en environnement de développement.';
  }

  json_out($out);
}

if ($route === 'verify-reset') {
  $token = trim($_GET['token'] ?? json_input()['token'] ?? '');
  if (strlen($token) < 32) fail('Lien invalide');

  $stmt = db()->prepare(
    'SELECT u.email, u.nom, t.expires_at, t.used_at
     FROM password_reset_tokens t
     JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = ?'
  );
  $stmt->execute([reset_token_hash($token)]);
  $row = $stmt->fetch();

  if (!$row || $row['used_at'] !== null || strtotime($row['expires_at']) < time()) {
    json_out(['valid' => false]);
  }

  json_out([
    'valid' => true,
    'email' => $row['email'],
    'nom' => $row['nom'],
    'expiresAt' => $row['expires_at'],
  ]);
}

if ($route === 'reset-password') {
  $in = json_input();
  $token = trim($in['token'] ?? '');
  $pwd = $in['password'] ?? '';

  if (strlen($token) < 32) fail('Lien invalide ou expiré');
  if (strlen($pwd) < 8) fail('Mot de passe trop court (8 caractères minimum)');

  $db = db();
  $stmt = $db->prepare(
    'SELECT t.id AS token_id, t.user_id, t.expires_at, t.used_at
     FROM password_reset_tokens t
     WHERE t.token_hash = ?'
  );
  $stmt->execute([reset_token_hash($token)]);
  $row = $stmt->fetch();

  if (!$row || $row['used_at'] !== null || strtotime($row['expires_at']) < time()) {
    fail('Lien invalide ou expiré. Demande un nouveau lien.', 400);
  }

  $hash = password_hash($pwd, PASSWORD_BCRYPT);
  $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $row['user_id']]);
  $db->prepare('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?')->execute([$row['token_id']]);
  $db->prepare('DELETE FROM password_reset_tokens WHERE user_id = ? AND id <> ?')->execute([$row['user_id'], $row['token_id']]);

  json_out(['ok' => true, 'message' => 'Mot de passe mis à jour. Tu peux te connecter.']);
}

fail('Route inconnue', 404);
