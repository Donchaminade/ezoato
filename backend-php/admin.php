<?php
// backend-php/admin.php — Administration complète
declare(strict_types=1);
require __DIR__ . '/helpers.php';
require __DIR__ . '/lib/storage-paths.php';
cors();

$action = $_GET['action'] ?? 'list';
$cfg = load_config();
$id = $_GET['id'] ?? '';

// --- Statistiques ---
if ($action === 'stats') {
  require_user(['gestionnaire', 'admin']);
  $db = db();

  $downloadsByDay = $db->query("SELECT DATE(telecharge_le) AS jour, COUNT(*) AS count
    FROM telechargements WHERE telecharge_le > DATE_SUB(CURDATE(), INTERVAL 13 DAY)
    GROUP BY DATE(telecharge_le) ORDER BY jour")->fetchAll();

  $paymentsByDay = $db->query("SELECT DATE(confirme_le) AS jour, COUNT(*) AS count, COALESCE(SUM(montant),0) AS revenus
    FROM paiements WHERE statut='confirme' AND confirme_le > DATE_SUB(CURDATE(), INTERVAL 13 DAY)
    GROUP BY DATE(confirme_le) ORDER BY jour")->fetchAll();

  $revenusParType = $db->query("SELECT e.type, COUNT(*) AS paiements, COALESCE(SUM(p.montant),0) AS revenus
    FROM paiements p JOIN epreuves e ON e.id = p.epreuve_id
    WHERE p.statut='confirme' GROUP BY e.type")->fetchAll();

  $parMethode = $db->query("SELECT methode, COUNT(*) AS count, COALESCE(SUM(montant),0) AS revenus
    FROM paiements WHERE statut='confirme' GROUP BY methode")->fetchAll();

  $topMatieres = $db->query("SELECT matiere, COUNT(*) AS count FROM epreuves
    WHERE statut='validee' AND type != 'corrige' GROUP BY matiere ORDER BY count DESC LIMIT 8")->fetchAll();

  json_out([
    'epreuvesValidees' => (int)$db->query("SELECT COUNT(*) FROM epreuves WHERE statut='validee' AND type != 'corrige'")->fetchColumn(),
    'corrigesTypes' => (int)$db->query("SELECT COUNT(*) FROM epreuves WHERE statut='validee' AND type='corrige'")->fetchColumn(),
    'epreuvesArchivees' => (int)$db->query("SELECT COUNT(*) FROM epreuves WHERE statut='archivee'")->fetchColumn(),
    'soumissionsEnAttente' => (int)$db->query("SELECT COUNT(*) FROM soumissions WHERE statut='en_attente'")->fetchColumn(),
    'utilisateurs' => (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn(),
    'telechargements' => (int)$db->query("SELECT COUNT(*) FROM telechargements")->fetchColumn(),
    'telechargementsCorriges' => (int)$db->query("SELECT COUNT(*) FROM telechargements t JOIN epreuves e ON e.id=t.epreuve_id WHERE e.type='corrige'")->fetchColumn(),
    'paiementsConfirmes' => (int)$db->query("SELECT COUNT(*) FROM paiements WHERE statut='confirme'")->fetchColumn(),
    'revenusFcfa' => (int)$db->query("SELECT COALESCE(SUM(montant),0) FROM paiements WHERE statut='confirme'")->fetchColumn(),
    'revenusExamensFcfa' => (int)$db->query("SELECT COALESCE(SUM(p.montant),0) FROM paiements p JOIN epreuves e ON e.id=p.epreuve_id WHERE p.statut='confirme' AND e.type='examen'")->fetchColumn(),
    'revenusCorrigesFcfa' => (int)$db->query("SELECT COALESCE(SUM(p.montant),0) FROM paiements p JOIN epreuves e ON e.id=p.epreuve_id WHERE p.statut='confirme' AND e.type='corrige'")->fetchColumn(),
    'etablissements' => (int)$db->query("SELECT COUNT(*) FROM etablissements")->fetchColumn(),
    'parType' => $db->query("SELECT type, COUNT(*) AS count FROM epreuves WHERE statut='validee' GROUP BY type")->fetchAll(),
    'parExamen' => $db->query("SELECT examen, COUNT(*) AS count FROM epreuves WHERE statut='validee' AND examen IS NOT NULL AND type != 'corrige' GROUP BY examen")->fetchAll(),
    'recentDownloads' => (int)$db->query("SELECT COUNT(*) FROM telechargements WHERE telecharge_le > DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn(),
    'retraitsEnAttente' => (int)$db->query("SELECT COUNT(*) FROM retraits WHERE statut='en_attente'")->fetchColumn(),
    'demandesSoutienNouvelles' => table_exists('demandes_soutien')
      ? (int)$db->query("SELECT COUNT(*) FROM demandes_soutien WHERE statut='nouvelle'")->fetchColumn()
      : 0,
    'demandesEtablissementNouvelles' => table_exists('demandes_etablissement')
      ? (int)$db->query("SELECT COUNT(*) FROM demandes_etablissement WHERE statut='nouvelle'")->fetchColumn()
      : 0,
    'portefeuilleSoldeTotal' => (int)$db->query("SELECT COALESCE(SUM(solde),0) FROM portefeuilles")->fetchColumn(),
    'retraitsMontantEnAttente' => (int)$db->query("SELECT COALESCE(SUM(montant),0) FROM retraits WHERE statut='en_attente'")->fetchColumn(),
    'retraitsPayesMontant' => (int)$db->query("SELECT COALESCE(SUM(montant),0) FROM retraits WHERE statut='paye'")->fetchColumn(),
    'downloadsByDay' => array_map(fn($r) => ['jour' => $r['jour'], 'count' => (int)$r['count']], $downloadsByDay),
    'paymentsByDay' => array_map(fn($r) => ['jour' => $r['jour'], 'count' => (int)$r['count'], 'revenus' => (int)$r['revenus']], $paymentsByDay),
    'revenusParType' => array_map(fn($r) => ['type' => $r['type'], 'paiements' => (int)$r['paiements'], 'revenus' => (int)$r['revenus']], $revenusParType),
    'parMethode' => array_map(fn($r) => ['methode' => $r['methode'], 'count' => (int)$r['count'], 'revenus' => (int)$r['revenus']], $parMethode),
    'topMatieres' => array_map(fn($r) => ['matiere' => $r['matiere'], 'count' => (int)$r['count']], $topMatieres),
  ]);
}

// --- Retraits contributeurs ---
if ($action === 'retraits') {
  require_user(['gestionnaire', 'admin']);
  $stmt = db()->query("SELECT r.*, u.nom AS user_nom, u.email AS user_email
    FROM retraits r JOIN users u ON u.id = r.user_id
    ORDER BY FIELD(r.statut,'en_attente','approuve','paye','rejete'), r.cree_le DESC LIMIT 100");
  json_out(array_map(function ($r) {
    return [
      'id' => $r['id'],
      'montant' => (int)$r['montant'],
      'methode' => $r['methode'],
      'telephone' => $r['telephone'],
      'statut' => $r['statut'],
      'motifRejet' => $r['motif_rejet'],
      'creeLe' => date('c', strtotime($r['cree_le'])),
      'traiteLe' => $r['traite_le'] ? date('c', strtotime($r['traite_le'])) : null,
      'user' => ['id' => $r['user_id'], 'nom' => $r['user_nom'], 'email' => $r['user_email']],
    ];
  }, $stmt->fetchAll()));
}

if ($action === 'approuver_retrait') {
  require_user(['gestionnaire', 'admin']);
  if (!$id) fail('id requis');
  $admin = require_user(['gestionnaire', 'admin']);
  $stmt = db()->prepare("SELECT r.*, u.nom AS user_nom FROM retraits r JOIN users u ON u.id = r.user_id WHERE r.id=? AND r.statut='en_attente'");
  $stmt->execute([$id]);
  $r = $stmt->fetch();
  if (!$r) fail('Retrait introuvable', 404);
  db()->prepare("UPDATE retraits SET statut='paye', traite_le=NOW(), traite_par=? WHERE id=?")
      ->execute([$admin['id'], $id]);
  dispatch_notification_event('retrait_approuve', [
    'montant' => number_format((int)$r['montant'], 0, ',', ' '),
    'nom' => $r['user_nom'],
    'methode' => $r['methode'],
  ], ['userId' => $r['user_id'], 'url' => '/account/portefeuille']);
  json_out(['ok' => true]);
}

if ($action === 'rejeter_retrait') {
  require_user(['gestionnaire', 'admin']);
  if (!$id) fail('id requis');
  $motif = trim(json_input()['motif'] ?? '') ?: 'Informations invalides';
  $stmt = db()->prepare("SELECT * FROM retraits WHERE id=? AND statut='en_attente'");
  $stmt->execute([$id]);
  $r = $stmt->fetch();
  if (!$r) fail('Retrait introuvable', 404);
  credit_wallet($r['user_id'], (int)$r['montant'], 'Remboursement retrait rejeté', "refund-{$id}");
  db()->prepare("UPDATE retraits SET statut='rejete', motif_rejet=?, traite_le=NOW() WHERE id=?")
      ->execute([$motif, $id]);
  $uNom = db()->prepare('SELECT nom FROM users WHERE id = ?');
  $uNom->execute([$r['user_id']]);
  dispatch_notification_event('retrait_rejete', [
    'montant' => number_format((int)$r['montant'], 0, ',', ' '),
    'motif' => $motif,
    'nom' => $uNom->fetchColumn() ?: 'Contributeur',
  ], ['userId' => $r['user_id'], 'url' => '/account/portefeuille']);
  json_out(['ok' => true]);
}

// --- Liste épreuves publiées ---
if ($action === 'epreuves') {
  require_user(['gestionnaire', 'admin']);
  $statut = $_GET['statut'] ?? 'validee';
  $q = trim($_GET['q'] ?? '');
  $where = ['e.statut = ?', "e.type != 'corrige'"];
  $args = [$statut];
  if ($q) {
    $where[] = '(e.titre LIKE ? OR e.matiere LIKE ?)';
    array_push($args, "%$q%", "%$q%");
  }
  $cond = implode(' AND ', $where);
  $stmt = db()->prepare("SELECT e.*, et.nom AS etablissement, c.id AS corrige_id
    FROM epreuves e
    LEFT JOIN etablissements et ON et.id = e.etablissement_id
    LEFT JOIN epreuves c ON c.epreuve_parent_id = e.id AND c.type = 'corrige' AND c.statut = 'validee'
    WHERE $cond ORDER BY e.valide_le DESC LIMIT 100");
  $stmt->execute($args);
  json_out(array_map(function ($row) {
    $m = map_epreuve($row);
    $m['corrigeTypeId'] = $row['corrige_id'] ?? null;
    $m['hasCorrigeType'] = !empty($row['corrige_id']);
    return $m;
  }, $stmt->fetchAll()));
}

// --- Corrigé type (admin uniquement) ---
if ($action === 'corrige') {
  require_user(['gestionnaire', 'admin']);
  if (!$id) fail('id requis');
  $admin = require_user(['gestionnaire', 'admin']);

  $parent = db()->prepare("SELECT * FROM epreuves WHERE id = ? AND statut = 'validee' AND type != 'corrige'");
  $parent->execute([$id]);
  $p = $parent->fetch();
  if (!$p) fail('Épreuve parente introuvable', 404);

  if (empty($_FILES['pdf']) || $_FILES['pdf']['error'] !== UPLOAD_ERR_OK) {
    fail('Fichier PDF requis');
  }
  $tmp = $_FILES['pdf']['tmp_name'];
  $mime = mime_content_type($tmp) ?: '';
  if (!str_contains($mime, 'pdf') && !str_ends_with(strtolower($_FILES['pdf']['name'] ?? ''), '.pdf')) {
    fail('Le fichier doit être un PDF');
  }

  $existing = db()->prepare("SELECT id, pdf_path FROM epreuves WHERE epreuve_parent_id = ? AND type = 'corrige' LIMIT 1");
  $existing->execute([$id]);
  $old = $existing->fetch();

  $corrigeId = $old['id'] ?? uuid();
  $pdfPath = "$cfg[uploads_dir]/pdfs/corrige-$corrigeId.pdf";
  if (!is_dir(dirname($pdfPath))) mkdir(dirname($pdfPath), 0755, true);
  if (!move_uploaded_file($tmp, $pdfPath)) fail('Échec enregistrement PDF');

  $size = filesize($pdfPath);
  $pages = max(1, (int)($size / 50000));
  $titre = 'Corrigé type — ' . $p['titre'];

  if ($old) {
    if (is_file($old['pdf_path']) && $old['pdf_path'] !== $pdfPath) @unlink($old['pdf_path']);
    db()->prepare("UPDATE epreuves SET titre=?, pdf_path=?, pages=?, taille_ko=?, valide_le=NOW() WHERE id=?")
        ->execute([$titre, $pdfPath, $pages, (int)($size/1024), $corrigeId]);
  } else {
    db()->prepare("INSERT INTO epreuves
      (id,titre,matiere,niveau,classe,annee,type,periode,examen,etablissement_id,ville,
       pdf_path,pages,taille_ko,soumis_par,valide_le,statut,epreuve_parent_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),'validee',?)")
        ->execute([$corrigeId, $titre, $p['matiere'], $p['niveau'], $p['classe'],
                   $p['annee'], 'corrige', $p['periode'], $p['examen'],
                   $p['etablissement_id'], $p['ville'], $pdfPath, $pages, (int)($size/1024),
                   $admin['id'], $id]);
  }

  json_out(['ok' => true, 'corrigeId' => $corrigeId]);
}

if ($action === 'supprimer_corrige') {
  require_user(['gestionnaire', 'admin']);
  if (!$id) fail('id requis');
  $stmt = db()->prepare("SELECT c.* FROM epreuves c
    WHERE c.epreuve_parent_id = ? AND c.type = 'corrige' LIMIT 1");
  $stmt->execute([$id]);
  $c = $stmt->fetch();
  if (!$c) fail('Corrigé introuvable', 404);
  if (is_file($c['pdf_path'])) @unlink($c['pdf_path']);
  db()->prepare("DELETE FROM epreuves WHERE id = ?")->execute([$c['id']]);
  json_out(['ok' => true]);
}

// --- Archiver une épreuve ---
if ($action === 'archiver') {
  require_user(['gestionnaire', 'admin']);
  if (!$id) fail('id requis');
  db()->prepare("UPDATE epreuves SET statut='archivee' WHERE id=?")->execute([$id]);
  json_out(['ok' => true]);
}

// --- Supprimer une épreuve (admin seulement) ---
if ($action === 'supprimer') {
  require_user(['admin']);
  if (!$id) fail('id requis');
  db()->prepare("DELETE FROM epreuves WHERE id=?")->execute([$id]);
  json_out(['ok' => true]);
}

// --- Utilisateurs ---
if ($action === 'users') {
  require_user(['admin']);
  $stmt = db()->query("SELECT id, nom, email, role, ville, created_at FROM users ORDER BY created_at DESC LIMIT 200");
  json_out(array_map(function ($u) {
    return [
      'id' => $u['id'],
      'nom' => $u['nom'],
      'email' => $u['email'],
      'role' => $u['role'],
      'ville' => $u['ville'],
      'createdAt' => date('c', strtotime($u['created_at'])),
    ];
  }, $stmt->fetchAll()));
}

if ($action === 'creer_user') {
  require_user(['admin']);
  $in = json_input();
  $nom = trim($in['nom'] ?? '');
  $email = strtolower(trim($in['email'] ?? ''));
  $telephone = normalize_phone($in['telephone'] ?? '');
  $pwd = $in['password'] ?? '';
  $role = $in['role'] ?? 'utilisateur';
  $ville = trim($in['ville'] ?? '') ?: null;

  if (strlen($nom) < 2 || strlen($nom) > 120) fail('Nom invalide');
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Email invalide');
  if (strlen($telephone) < 8 || strlen($telephone) > 12) fail('Numéro de téléphone invalide');
  if (strlen($pwd) < 8) fail('Mot de passe trop court (8+ caractères)');
  if (!in_array($role, ['utilisateur', 'gestionnaire', 'admin'], true)) fail('Rôle invalide');

  $id = uuid();
  try {
    db()->prepare('INSERT INTO users (id,nom,email,telephone,password_hash,role,ville) VALUES (?,?,?,?,?,?,?)')
        ->execute([$id, $nom, $email, $telephone, password_hash($pwd, PASSWORD_BCRYPT), $role, $ville]);
  } catch (PDOException $e) {
    $msg = (string)$e->getMessage();
    if (str_contains($msg, 'email')) fail('Email déjà utilisé', 409);
    if (str_contains($msg, 'telephone')) fail('Numéro de téléphone déjà utilisé', 409);
    fail('Création impossible', 409);
  }

  json_out([
    'ok' => true,
    'user' => [
      'id' => $id,
      'nom' => $nom,
      'email' => $email,
      'role' => $role,
      'ville' => $ville,
      'createdAt' => date('c'),
    ],
  ]);
}

if ($action === 'role') {
  require_user(['admin']);
  if (!$id) fail('id requis');
  $role = json_input()['role'] ?? '';
  if (!in_array($role, ['utilisateur', 'gestionnaire', 'admin'], true)) fail('Rôle invalide');
  db()->prepare("UPDATE users SET role=? WHERE id=?")->execute([$role, $id]);
  json_out(['ok' => true]);
}

if ($action === 'user_detail') {
  require_user(['admin']);
  if (!$id) fail('id requis');
  $stmt = db()->prepare('SELECT id, nom, email, telephone, role, ville, created_at FROM users WHERE id=?');
  $stmt->execute([$id]);
  $u = $stmt->fetch();
  if (!$u) fail('Utilisateur introuvable', 404);
  json_out([
    'id' => $u['id'],
    'nom' => $u['nom'],
    'email' => $u['email'],
    'telephone' => $u['telephone'] ?? null,
    'role' => $u['role'],
    'ville' => $u['ville'],
    'createdAt' => date('c', strtotime($u['created_at'])),
  ]);
}

if ($action === 'modifier_user') {
  require_user(['admin']);
  if (!$id) fail('id requis');
  $stmt = db()->prepare('SELECT * FROM users WHERE id=?');
  $stmt->execute([$id]);
  $u = $stmt->fetch();
  if (!$u) fail('Utilisateur introuvable', 404);

  $in = json_input();
  $nom = trim($in['nom'] ?? $u['nom']);
  $email = strtolower(trim($in['email'] ?? $u['email']));
  $telephone = array_key_exists('telephone', $in)
    ? normalize_phone($in['telephone'] ?? '')
    : ($u['telephone'] ?? '');
  $role = $in['role'] ?? $u['role'];
  $ville = array_key_exists('ville', $in) ? (trim((string)($in['ville'] ?? '')) ?: null) : $u['ville'];
  $pwd = $in['password'] ?? '';

  if (strlen($nom) < 2 || strlen($nom) > 120) fail('Nom invalide');
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Email invalide');
  if (strlen($telephone) < 8 || strlen($telephone) > 12) fail('Numéro de téléphone invalide');
  if (!in_array($role, ['utilisateur', 'gestionnaire', 'admin'], true)) fail('Rôle invalide');
  if ($pwd !== '' && strlen($pwd) < 8) fail('Mot de passe trop court (8+ caractères)');

  $sets = ['nom=?', 'email=?', 'telephone=?', 'role=?', 'ville=?'];
  $params = [$nom, $email, $telephone, $role, $ville];
  if ($pwd !== '') {
    $sets[] = 'password_hash=?';
    $params[] = password_hash($pwd, PASSWORD_BCRYPT);
  }
  $params[] = $id;

  try {
    db()->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id=?')->execute($params);
  } catch (PDOException $e) {
    $msg = (string)$e->getMessage();
    if (str_contains($msg, 'email')) fail('Email déjà utilisé', 409);
    if (str_contains($msg, 'telephone')) fail('Numéro de téléphone déjà utilisé', 409);
    fail('Modification impossible', 409);
  }

  json_out([
    'ok' => true,
    'user' => [
      'id' => $id,
      'nom' => $nom,
      'email' => $email,
      'telephone' => $telephone,
      'role' => $role,
      'ville' => $ville,
      'createdAt' => date('c', strtotime($u['created_at'])),
    ],
  ]);
}

if ($action === 'reset_user_password') {
  $admin = require_user(['admin']);
  if (!$id) fail('id requis');

  $adminPwd = (string)(json_input()['adminPassword'] ?? '');
  if ($adminPwd === '') fail('Mot de passe administrateur requis');

  $stmt = db()->prepare('SELECT id, nom, password_hash FROM users WHERE id = ?');
  $stmt->execute([$admin['id']]);
  $me = $stmt->fetch();
  if (!$me || !password_verify($adminPwd, $me['password_hash'])) {
    fail('Mot de passe administrateur incorrect', 403);
  }

  $stmt = db()->prepare('SELECT id, nom FROM users WHERE id = ?');
  $stmt->execute([$id]);
  $target = $stmt->fetch();
  if (!$target) fail('Utilisateur introuvable', 404);

  $tempPwd = generate_temp_password();
  db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      ->execute([password_hash($tempPwd, PASSWORD_BCRYPT), $id]);

  log_admin_action(
    $admin['id'],
    'password_reset',
    $id,
    sprintf('Admin %s a réinitialisé le mot de passe de %s', $me['nom'], $target['nom'])
  );

  json_out(['ok' => true, 'temporaryPassword' => $tempPwd]);
}

if ($action === 'supprimer_user') {
  $me = require_user(['admin']);
  if (!$id) fail('id requis');
  if ($me['id'] === $id) fail('Vous ne pouvez pas supprimer votre propre compte');

  $stmt = db()->prepare('SELECT role FROM users WHERE id=?');
  $stmt->execute([$id]);
  $u = $stmt->fetch();
  if (!$u) fail('Utilisateur introuvable', 404);

  if ($u['role'] === 'admin') {
    $adminCount = (int)db()->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn();
    if ($adminCount <= 1) fail('Impossible de supprimer le dernier administrateur');
  }

  $stmt = db()->prepare("SELECT COUNT(*) FROM soumissions WHERE soumis_par=?");
  $stmt->execute([$id]);
  $soumissions = (int)$stmt->fetchColumn();

  $stmt = db()->prepare("SELECT COUNT(*) FROM epreuves WHERE soumis_par=?");
  $stmt->execute([$id]);
  $epreuves = (int)$stmt->fetchColumn();

  if ($soumissions > 0 || $epreuves > 0) {
    fail("Suppression impossible : cet utilisateur a {$soumissions} soumission(s) et {$epreuves} épreuve(s) publiée(s).");
  }

  $db = db();
  $db->beginTransaction();
  try {
    $db->prepare('UPDATE retraits SET traite_par = NULL WHERE traite_par = ?')->execute([$id]);
    $db->prepare('UPDATE contact_messages SET user_id = NULL WHERE user_id = ?')->execute([$id]);
    $db->prepare('DELETE FROM portefeuille_transactions WHERE user_id = ?')->execute([$id]);
    $db->prepare('DELETE FROM retraits WHERE user_id = ?')->execute([$id]);
    $db->prepare('DELETE FROM portefeuilles WHERE user_id = ?')->execute([$id]);
    $db->prepare('DELETE FROM telechargements WHERE user_id = ?')->execute([$id]);
    $db->prepare('DELETE FROM paiements WHERE user_id = ?')->execute([$id]);
    $db->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    $db->commit();
  } catch (Throwable $e) {
    $db->rollBack();
    fail('Suppression impossible', 409);
  }
  json_out(['ok' => true]);
}

if ($action === 'user_stats') {
  require_user(['admin']);
  if (!$id) fail('id requis');

  $stmt = db()->prepare('SELECT id, nom FROM users WHERE id=?');
  $stmt->execute([$id]);
  $u = $stmt->fetch();
  if (!$u) fail('Utilisateur introuvable', 404);

  $stmt = db()->prepare("SELECT statut, COUNT(*) AS n FROM soumissions WHERE soumis_par=? GROUP BY statut");
  $stmt->execute([$id]);
  $soumByStatut = ['en_attente' => 0, 'validee' => 0, 'rejetee' => 0];
  foreach ($stmt->fetchAll() as $row) {
    $soumByStatut[$row['statut']] = (int)$row['n'];
  }
  $soumissionsTotal = array_sum($soumByStatut);

  $wallet = map_wallet(get_or_create_wallet($id));

  $stmt = db()->prepare('SELECT COUNT(*) FROM telechargements WHERE user_id=?');
  $stmt->execute([$id]);
  $telechargements = (int)$stmt->fetchColumn();

  $stmt = db()->prepare("SELECT statut, COUNT(*) AS n FROM paiements WHERE user_id=? GROUP BY statut");
  $stmt->execute([$id]);
  $paiements = ['total' => 0, 'confirmes' => 0, 'enAttente' => 0];
  foreach ($stmt->fetchAll() as $row) {
    $paiements['total'] += (int)$row['n'];
    if ($row['statut'] === 'confirme') $paiements['confirmes'] = (int)$row['n'];
    if ($row['statut'] === 'en_attente') $paiements['enAttente'] = (int)$row['n'];
  }

  $stmt = db()->prepare("SELECT statut, COUNT(*) AS n FROM retraits WHERE user_id=? GROUP BY statut");
  $stmt->execute([$id]);
  $retraits = ['total' => 0, 'enAttente' => 0, 'payes' => 0, 'rejetes' => 0];
  foreach ($stmt->fetchAll() as $row) {
    $retraits['total'] += (int)$row['n'];
    if ($row['statut'] === 'en_attente') $retraits['enAttente'] = (int)$row['n'];
    if ($row['statut'] === 'paye') $retraits['payes'] = (int)$row['n'];
    if ($row['statut'] === 'rejete') $retraits['rejetes'] = (int)$row['n'];
  }

  $stmt = db()->prepare("SELECT COUNT(*) FROM epreuves WHERE soumis_par=? AND statut IN ('validee','archivee')");
  $stmt->execute([$id]);
  $epreuvesPubliees = (int)$stmt->fetchColumn();

  $evenements = [];

  $stmt = db()->prepare("SELECT id, titre, statut, soumis_le FROM soumissions WHERE soumis_par=? ORDER BY soumis_le DESC LIMIT 12");
  $stmt->execute([$id]);
  foreach ($stmt->fetchAll() as $row) {
    $label = match ($row['statut']) {
      'validee' => 'Épreuve validée',
      'rejetee' => 'Épreuve refusée',
      default => 'Soumission en attente',
    };
    $evenements[] = [
      'type' => 'soumission',
      'date' => date('c', strtotime($row['soumis_le'])),
      'label' => $label,
      'detail' => $row['titre'],
      'statut' => $row['statut'],
    ];
  }

  $stmt = db()->prepare("SELECT type, montant, description, cree_le FROM portefeuille_transactions WHERE user_id=? ORDER BY cree_le DESC LIMIT 10");
  $stmt->execute([$id]);
  foreach ($stmt->fetchAll() as $row) {
    $evenements[] = [
      'type' => 'portefeuille',
      'date' => date('c', strtotime($row['cree_le'])),
      'label' => $row['type'] === 'credit' ? 'Crédit portefeuille' : 'Débit portefeuille',
      'detail' => $row['description'] . ' (' . (int)$row['montant'] . ' FCFA)',
      'statut' => $row['type'],
    ];
  }

  $stmt = db()->prepare("SELECT montant, statut, cree_le FROM retraits WHERE user_id=? ORDER BY cree_le DESC LIMIT 8");
  $stmt->execute([$id]);
  foreach ($stmt->fetchAll() as $row) {
    $evenements[] = [
      'type' => 'retrait',
      'date' => date('c', strtotime($row['cree_le'])),
      'label' => 'Demande de retrait',
      'detail' => (int)$row['montant'] . ' FCFA — ' . $row['statut'],
      'statut' => $row['statut'],
    ];
  }

  $stmt = db()->prepare("SELECT t.telecharge_le, e.titre FROM telechargements t
    JOIN epreuves e ON e.id = t.epreuve_id WHERE t.user_id=? ORDER BY t.telecharge_le DESC LIMIT 8");
  $stmt->execute([$id]);
  foreach ($stmt->fetchAll() as $row) {
    $evenements[] = [
      'type' => 'telechargement',
      'date' => date('c', strtotime($row['telecharge_le'])),
      'label' => 'Téléchargement',
      'detail' => $row['titre'],
      'statut' => null,
    ];
  }

  usort($evenements, fn($a, $b) => strcmp($b['date'], $a['date']));
  $evenements = array_slice($evenements, 0, 25);

  json_out([
    'userId' => $id,
    'nom' => $u['nom'],
    'soumissions' => [
      'total' => $soumissionsTotal,
      'enAttente' => $soumByStatut['en_attente'],
      'validees' => $soumByStatut['validee'],
      'rejetees' => $soumByStatut['rejetee'],
    ],
    'portefeuille' => $wallet,
    'telechargements' => $telechargements,
    'paiements' => $paiements,
    'retraits' => $retraits,
    'epreuvesPubliees' => $epreuvesPubliees,
    'evenements' => $evenements,
  ]);
}

// --- Explorateur archives (dossiers année / type) ---
if ($action === 'archives') {
  require_user(['gestionnaire', 'admin']);
  $root = $_GET['root'] ?? 'epreuves';
  $path = $_GET['path'] ?? '';
  if (!in_array($root, ['soumissions', 'epreuves'], true)) fail('Racine invalide');
  json_out(list_archives_directory($cfg, $root, $path));
}

if ($action === 'archives_file') {
  require_user(['gestionnaire', 'admin']);
  $root = $_GET['root'] ?? '';
  $path = $_GET['path'] ?? '';
  if (!$root || !$path) fail('Paramètres requis');
  $full = archives_resolve_path($cfg, $root, $path);
  if (!$full || !is_file($full)) fail('Fichier introuvable', 404);
  $ext = strtolower(pathinfo($full, PATHINFO_EXTENSION));
  $mime = match ($ext) {
    'pdf' => 'application/pdf',
    'jpg', 'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'webp' => 'image/webp',
    default => 'application/octet-stream',
  };
  header("Content-Type: $mime");
  header('Content-Disposition: inline; filename="' . basename($full) . '"');
  readfile($full);
  exit;
}

// --- Aperçu PDF soumission ---
if ($action === 'preview') {
  require_user(['gestionnaire', 'admin']);
  if (!$id) fail('id requis');
  $stmt = db()->prepare("SELECT pdf_preview_path FROM soumissions WHERE id=?");
  $stmt->execute([$id]);
  $path = $stmt->fetchColumn();
  if (!$path || !is_file($path)) fail('PDF introuvable', 404);
  header('Content-Type: application/pdf');
  header('Content-Disposition: inline; filename="preview.pdf"');
  readfile($path);
  exit;
}

// --- Image source d'une soumission ---
if ($action === 'soumission_image') {
  require_user(['gestionnaire', 'admin']);
  $subId = $_GET['id'] ?? '';
  $file = basename($_GET['file'] ?? '');
  if (!$subId || !$file) fail('Paramètres requis');
  $stmt = db()->prepare('SELECT images_json FROM soumissions WHERE id=?');
  $stmt->execute([$subId]);
  $raw = $stmt->fetchColumn();
  $images = is_string($raw) ? json_decode($raw, true) : [];
  $path = null;
  foreach ($images ?: [] as $img) {
    if (basename((string)$img) === $file) { $path = $img; break; }
  }
  if (!$path || !is_file($path)) fail('Image introuvable', 404);
  $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
  $mime = match ($ext) {
    'jpg', 'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'webp' => 'image/webp',
    default => 'application/octet-stream',
  };
  header("Content-Type: $mime");
  header('Content-Disposition: inline; filename="' . $file . '"');
  readfile($path);
  exit;
}

// --- Partenaires ---
if ($action === 'partenaires') {
  require_user(['gestionnaire', 'admin']);
  $base = rtrim($cfg['api_base_url'] ?? '', '/');
  $stmt = db()->query('SELECT * FROM partenaires ORDER BY ordre ASC, nom ASC');
  json_out(array_map(function ($r) use ($base) {
    return [
      'id' => $r['id'],
      'nom' => $r['nom'],
      'ville' => $r['ville'] ?? null,
      'type' => $r['type'],
      'siteWeb' => $r['site_web'] ?? null,
      'logoUrl' => !empty($r['logo_path']) ? "$base/partners/{$r['id']}/logo" : null,
      'ordre' => (int)$r['ordre'],
      'visible' => (bool)$r['visible'],
      'creeLe' => date('c', strtotime($r['cree_le'])),
    ];
  }, $stmt->fetchAll()));
}

if ($action === 'creer_partenaire') {
  require_user(['gestionnaire', 'admin']);
  $in = $_POST;
  if (empty($in) && empty($_FILES)) $in = json_input();
  $nom = trim($in['nom'] ?? '');
  $ville = trim($in['ville'] ?? '') ?: null;
  $type = $in['type'] ?? 'etablissement';
  $siteWeb = trim($in['siteWeb'] ?? '') ?: null;
  $ordre = (int)($in['ordre'] ?? 0);
  if (strlen($nom) < 2) fail('Nom requis');
  if (!in_array($type, ['etablissement','entreprise','association','autre'], true)) fail('Type invalide');

  $newId = uuid();
  $logoPath = null;
  if (!empty($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
    $tmp = $_FILES['logo']['tmp_name'];
    $mime = mime_content_type($tmp) ?: '';
    if (!in_array($mime, ['image/jpeg','image/png','image/webp','image/gif'], true)) fail('Logo : format non supporté');
    if ($_FILES['logo']['size'] > 2 * 1024 * 1024) fail('Logo trop lourd (2 Mo max)');
    $ext = match ($mime) {
      'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif', default => 'jpg',
    };
    $dir = "$cfg[uploads_dir]/partners";
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $logoPath = "$dir/$newId.$ext";
    if (!move_uploaded_file($tmp, $logoPath)) fail('Échec enregistrement logo');
  }

  db()->prepare('INSERT INTO partenaires (id,nom,logo_path,site_web,ville,type,ordre) VALUES (?,?,?,?,?,?,?)')
      ->execute([$newId, $nom, $logoPath, $siteWeb, $ville, $type, $ordre]);
  json_out(['ok' => true, 'id' => $newId]);
}

if ($action === 'modifier_partenaire') {
  require_user(['gestionnaire', 'admin']);
  if (!$id) fail('id requis');
  $in = $_POST;
  if (empty($in) && empty($_FILES)) $in = json_input();
  $nom = trim($in['nom'] ?? '');
  $ville = trim($in['ville'] ?? '') ?: null;
  $type = $in['type'] ?? 'etablissement';
  $siteWeb = trim($in['siteWeb'] ?? '') ?: null;
  $ordre = (int)($in['ordre'] ?? 0);
  $visible = isset($in['visible']) ? (int)(bool)$in['visible'] : null;
  if (strlen($nom) < 2) fail('Nom requis');

  $stmt = db()->prepare('SELECT * FROM partenaires WHERE id = ?');
  $stmt->execute([$id]);
  $p = $stmt->fetch();
  if (!$p) fail('Partenaire introuvable', 404);

  $logoPath = $p['logo_path'];
  if (!empty($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
    $tmp = $_FILES['logo']['tmp_name'];
    $mime = mime_content_type($tmp) ?: '';
    if (!in_array($mime, ['image/jpeg','image/png','image/webp','image/gif'], true)) fail('Logo : format non supporté');
    $ext = match ($mime) {
      'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif', default => 'jpg',
    };
    $dir = "$cfg[uploads_dir]/partners";
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $newPath = "$dir/$id.$ext";
    if ($logoPath && is_file($logoPath) && $logoPath !== $newPath) @unlink($logoPath);
    if (!move_uploaded_file($tmp, $newPath)) fail('Échec enregistrement logo');
    $logoPath = $newPath;
  }

  $visSql = $visible !== null ? ', visible = ?' : '';
  $args = [$nom, $logoPath, $siteWeb, $ville, $type, $ordre];
  if ($visible !== null) $args[] = $visible;
  $args[] = $id;
  db()->prepare("UPDATE partenaires SET nom=?, logo_path=?, site_web=?, ville=?, type=?, ordre=?$visSql WHERE id=?")
      ->execute($args);
  json_out(['ok' => true]);
}

if ($action === 'supprimer_partenaire') {
  require_user(['admin']);
  if (!$id) fail('id requis');
  $stmt = db()->prepare('SELECT logo_path FROM partenaires WHERE id = ?');
  $stmt->execute([$id]);
  $path = $stmt->fetchColumn();
  if ($path && is_file($path)) @unlink($path);
  db()->prepare('DELETE FROM partenaires WHERE id = ?')->execute([$id]);
  json_out(['ok' => true]);
}

// --- Demandes de soutien ---
if ($action === 'demandes_soutien') {
  require_user(['gestionnaire', 'admin']);
  $stmt = db()->query("SELECT * FROM demandes_soutien
    WHERE statut != 'archivee' ORDER BY FIELD(statut,'nouvelle','en_cours','acceptee','refusee'), cree_le DESC LIMIT 100");
  json_out(array_map(function ($r) {
    return [
      'id' => $r['id'],
      'nom' => $r['nom'],
      'email' => $r['email'],
      'telephone' => $r['telephone'] ?? null,
      'organisation' => $r['organisation'] ?? null,
      'type' => $r['type'],
      'message' => $r['message'],
      'statut' => $r['statut'],
      'lu' => (bool)$r['lu'],
      'notesAdmin' => $r['notes_admin'] ?? null,
      'creeLe' => date('c', strtotime($r['cree_le'])),
      'traiteLe' => $r['traite_le'] ? date('c', strtotime($r['traite_le'])) : null,
    ];
  }, $stmt->fetchAll()));
}

if ($action === 'statut_soutien') {
  require_user(['gestionnaire', 'admin']);
  if (!$id) fail('id requis');
  $in = json_input();
  $statut = $in['statut'] ?? '';
  $notes = trim($in['notesAdmin'] ?? '') ?: null;
  if (!in_array($statut, ['nouvelle','en_cours','acceptee','refusee','archivee'], true)) fail('Statut invalide');
  db()->prepare("UPDATE demandes_soutien SET statut=?, notes_admin=COALESCE(?, notes_admin),
    traite_le=CASE WHEN ? IN ('acceptee','refusee','archivee') THEN NOW() ELSE traite_le END, lu=1 WHERE id=?")
      ->execute([$statut, $notes, $statut, $id]);
  json_out(['ok' => true]);
}

if ($action === 'lu_soutien') {
  require_user(['gestionnaire', 'admin']);
  if (!$id) fail('id requis');
  db()->prepare('UPDATE demandes_soutien SET lu=1 WHERE id=?')->execute([$id]);
  json_out(['ok' => true]);
}

// --- Demandes établissements ---
if ($action === 'demandes_etablissement') {
  require_user(['gestionnaire', 'admin']);
  $stmt = db()->query("SELECT * FROM demandes_etablissement
    WHERE statut != 'archivee' ORDER BY FIELD(statut,'nouvelle','en_cours','traitee'), cree_le DESC LIMIT 100");
  json_out(array_map(function ($r) {
    return [
      'id' => $r['id'],
      'nomEtablissement' => $r['nom_etablissement'],
      'ville' => $r['ville'],
      'nomContact' => $r['nom_contact'],
      'email' => $r['email'],
      'telephone' => $r['telephone'] ?? null,
      'fonction' => $r['fonction'] ?? null,
      'typeDemande' => $r['type_demande'],
      'message' => $r['message'],
      'statut' => $r['statut'],
      'lu' => (bool)$r['lu'],
      'notesAdmin' => $r['notes_admin'] ?? null,
      'creeLe' => date('c', strtotime($r['cree_le'])),
      'traiteLe' => $r['traite_le'] ? date('c', strtotime($r['traite_le'])) : null,
    ];
  }, $stmt->fetchAll()));
}

if ($action === 'statut_etablissement') {
  require_user(['gestionnaire', 'admin']);
  if (!$id) fail('id requis');
  $in = json_input();
  $statut = $in['statut'] ?? '';
  $notes = trim($in['notesAdmin'] ?? '') ?: null;
  if (!in_array($statut, ['nouvelle','en_cours','traitee','archivee'], true)) fail('Statut invalide');
  db()->prepare("UPDATE demandes_etablissement SET statut=?, notes_admin=COALESCE(?, notes_admin),
    traite_le=CASE WHEN ? IN ('traitee','archivee') THEN NOW() ELSE traite_le END, lu=1 WHERE id=?")
      ->execute([$statut, $notes, $statut, $id]);
  json_out(['ok' => true]);
}

if ($action === 'lu_etablissement') {
  require_user(['gestionnaire', 'admin']);
  if (!$id) fail('id requis');
  db()->prepare('UPDATE demandes_etablissement SET lu=1 WHERE id=?')->execute([$id]);
  json_out(['ok' => true]);
}

// --- Règles de notifications (programmables) ---
if ($action === 'notifications') {
  require_user(['admin']);
  if (!table_exists('notification_rules')) {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
      json_out([
        'rules' => [],
        'declencheurs' => notification_declencheurs(),
        'canaux' => notification_canaux(),
        'destinataires' => notification_destinataires(),
        'dbReady' => false,
        'message' => 'Exécutez migration-notification-rules.sql pour activer les notifications.',
      ]);
    }
    fail('Table notification_rules absente — exécutez la migration SQL', 503);
  }
  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    json_out([
      'rules' => list_notification_rules(),
      'declencheurs' => notification_declencheurs(),
      'canaux' => notification_canaux(),
      'destinataires' => notification_destinataires(),
      'dbReady' => true,
    ]);
  }
  fail('Méthode non autorisée', 405);
}

if ($action === 'creer_notification') {
  require_user(['admin']);
  if (!table_exists('notification_rules')) fail('Migration notification_rules requise', 503);
  $in = json_input();
  $libelle = trim($in['libelle'] ?? '');
  $declencheur = trim($in['declencheur'] ?? '');
  $titre = trim($in['titre'] ?? '');
  $corps = trim($in['corps'] ?? '');
  if ($libelle === '' || $declencheur === '' || $titre === '' || $corps === '') fail('Champs requis manquants');
  if (!isset(notification_declencheurs()[$declencheur])) fail('Déclencheur invalide');
  $canal = $in['canal'] ?? 'in_app';
  $destinataire = $in['destinataire'] ?? 'utilisateur';
  if (!in_array($canal, notification_canaux(), true)) fail('Canal invalide');
  if (!in_array($destinataire, notification_destinataires(), true)) fail('Destinataire invalide');
  $code = trim($in['code'] ?? '') ?: strtolower(preg_replace('/[^a-z0-9]+/', '_', $libelle));
  $newId = uuid();
  try {
    db()->prepare(
      'INSERT INTO notification_rules (id, code, libelle, description, declencheur, canal, destinataire, titre, corps, active)
       VALUES (?,?,?,?,?,?,?,?,?,?)'
    )->execute([
      $newId,
      $code,
      $libelle,
      trim($in['description'] ?? '') ?: null,
      $declencheur,
      $canal,
      $destinataire,
      $titre,
      $corps,
      !empty($in['active']) ? 1 : 0,
    ]);
  } catch (PDOException $e) {
    if (str_contains($e->getMessage(), 'Duplicate')) fail('Code ou combinaison déclencheur/destinataire déjà utilisée');
    throw $e;
  }
  json_out(['ok' => true, 'rule' => get_notification_rule($newId)]);
}

if ($action === 'modifier_notification') {
  require_user(['admin']);
  if (!$id) fail('id requis');
  if (!table_exists('notification_rules')) fail('Migration notification_rules requise', 503);
  $existing = get_notification_rule($id);
  if (!$existing) fail('Règle introuvable', 404);
  $in = json_input();
  $libelle = trim($in['libelle'] ?? $existing['libelle']);
  $declencheur = trim($in['declencheur'] ?? $existing['declencheur']);
  $titre = trim($in['titre'] ?? $existing['titre']);
  $corps = trim($in['corps'] ?? $existing['corps']);
  if ($libelle === '' || $declencheur === '' || $titre === '' || $corps === '') fail('Champs requis manquants');
  if (!isset(notification_declencheurs()[$declencheur])) fail('Déclencheur invalide');
  $canal = $in['canal'] ?? $existing['canal'];
  $destinataire = $in['destinataire'] ?? $existing['destinataire'];
  if (!in_array($canal, notification_canaux(), true)) fail('Canal invalide');
  if (!in_array($destinataire, notification_destinataires(), true)) fail('Destinataire invalide');
  $active = array_key_exists('active', $in) ? (!empty($in['active']) ? 1 : 0) : ($existing['active'] ? 1 : 0);
  try {
    db()->prepare(
      'UPDATE notification_rules SET libelle=?, description=?, declencheur=?, canal=?, destinataire=?, titre=?, corps=?, active=? WHERE id=?'
    )->execute([
      $libelle,
      trim($in['description'] ?? $existing['description'] ?? '') ?: null,
      $declencheur,
      $canal,
      $destinataire,
      $titre,
      $corps,
      $active,
      $id,
    ]);
  } catch (PDOException $e) {
    if (str_contains($e->getMessage(), 'Duplicate')) fail('Combinaison déclencheur/destinataire déjà utilisée');
    throw $e;
  }
  json_out(['ok' => true, 'rule' => get_notification_rule($id)]);
}

if ($action === 'toggle_notification') {
  require_user(['admin']);
  if (!$id) fail('id requis');
  $rule = get_notification_rule($id);
  if (!$rule) fail('Règle introuvable', 404);
  $next = $rule['active'] ? 0 : 1;
  db()->prepare('UPDATE notification_rules SET active=? WHERE id=?')->execute([$next, $id]);
  json_out(['ok' => true, 'rule' => get_notification_rule($id)]);
}

if ($action === 'supprimer_notification') {
  require_user(['admin']);
  if (!$id) fail('id requis');
  db()->prepare('DELETE FROM notification_rules WHERE id=?')->execute([$id]);
  json_out(['ok' => true]);
}

// --- Liste soumissions ---
if ($action === 'list') {
  require_user(['gestionnaire', 'admin']);
  $stmt = db()->query("SELECT s.*, et.nom AS etablissement, u.nom AS auteur
                       FROM soumissions s
                       LEFT JOIN etablissements et ON et.id = s.etablissement_id
                       LEFT JOIN users u ON u.id = s.soumis_par
                       WHERE s.statut='en_attente' ORDER BY s.soumis_le DESC");
  json_out(array_map('map_soumission', $stmt->fetchAll()));
}

// --- Référentiels (classes, matières, villes) ---
if ($action === 'referentiels') {
  require_user(['admin']);
  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    json_out(load_admin_referentiels());
  }

  $in = json_input();
  $op = $in['op'] ?? 'add';
  $type = $in['type'] ?? '';
  $nomInput = normalize_text($in['nom'] ?? '');
  if ($nomInput === '') fail('Nom requis');
  if (!in_array($op, ['add', 'remove'], true)) fail('Opération invalide');

  if ($type === 'classe') {
    if (!table_exists('classes')) {
      fail('Table classes absente — exécutez migration-classes.sql', 503);
    }
    $niveau = $in['niveau'] ?? '';
    if (!in_array($niveau, ['college', 'lycee'], true)) fail('Niveau invalide');
    if ($op === 'add') {
      $nom = canonical_referentiel_nom($nomInput);
      if ($nom === '') fail('Nom invalide');
      $ordre = (int)($in['ordre'] ?? 0);
      db()->prepare('INSERT INTO classes (nom, niveau, ordre) VALUES (?,?,?)
        ON DUPLICATE KEY UPDATE ordre=VALUES(ordre)')->execute([$nom, $niveau, $ordre]);
    } else {
      $nom = resolve_referentiel_nom('classes', $nomInput, $niveau);
      if ($nom === null) fail('Classe introuvable', 404);
      $stmt = db()->prepare('DELETE FROM classes WHERE nom=? AND niveau=?');
      $stmt->execute([$nom, $niveau]);
      if ($stmt->rowCount() === 0) fail('Classe introuvable', 404);
    }
  } elseif ($type === 'matiere') {
    if ($op === 'add') {
      $nom = canonical_referentiel_nom($nomInput);
      if ($nom === '') fail('Nom invalide');
      db()->prepare('INSERT IGNORE INTO matieres (nom) VALUES (?)')->execute([$nom]);
    } else {
      $nom = resolve_referentiel_nom('matieres', $nomInput);
      if ($nom === null) fail('Matière introuvable', 404);
      $stmt = db()->prepare('DELETE FROM matieres WHERE nom=?');
      $stmt->execute([$nom]);
      if ($stmt->rowCount() === 0) fail('Matière introuvable', 404);
    }
  } elseif ($type === 'ville') {
    if ($op === 'add') {
      $ville = canonical_referentiel_nom($nomInput, true);
      if ($ville === '') fail('Ville invalide');
      db()->prepare('INSERT IGNORE INTO villes (nom) VALUES (?)')->execute([$ville]);
    } else {
      $nom = resolve_referentiel_nom('villes', $nomInput);
      if ($nom === null) fail('Ville introuvable', 404);
      $stmt = db()->prepare('DELETE FROM villes WHERE nom=?');
      $stmt->execute([$nom]);
      if ($stmt->rowCount() === 0) fail('Ville introuvable', 404);
    }
  } else {
    fail('Type invalide');
  }

  json_out(['ok' => true, ...load_admin_referentiels()]);
}

// --- Paramètres plateforme (tarifs & promos) ---
if ($action === 'settings') {
  $me = require_user(['admin']);
  if (!table_exists('platform_settings')) {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
      json_out([
        'settings' => map_platform_settings_admin(load_platform_settings()),
        'dbReady' => false,
        'message' => 'Exécutez migration-platform-settings.sql pour activer la persistance.',
      ]);
    }
    fail('Table platform_settings absente — exécutez la migration SQL', 503);
  }

  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    json_out(['settings' => map_platform_settings_admin(load_platform_settings()), 'dbReady' => true]);
  }

  $in = json_input();
  $current = load_platform_settings();

  $prixExamen = (int)($in['prixExamenNational'] ?? $current['prix_examen_national']);
  $prixCorrige = array_key_exists('prixCorrigeType', $in)
    ? ($in['prixCorrigeType'] === null || $in['prixCorrigeType'] === '' ? null : (int)$in['prixCorrigeType'])
    : $current['prix_corrige_type'];
  $epreuvesPalier = (int)($in['epreuvesParRecompense'] ?? $current['epreuves_par_recompense']);
  $montantRecompense = (int)($in['montantRecompense'] ?? $current['montant_recompense']);
  $minRetrait = (int)($in['minRetrait'] ?? $current['min_retrait']);

  $promo = is_array($in['promo'] ?? null) ? $in['promo'] : [];
  $promoActive = (bool)($promo['active'] ?? $current['promo_active']);
  $promoLabel = array_key_exists('label', $promo) ? trim((string)($promo['label'] ?? '')) : ($current['promo_libelle'] ?? '');
  $promoPct = array_key_exists('pourcentage', $promo)
    ? ($promo['pourcentage'] === null || $promo['pourcentage'] === '' ? null : (int)$promo['pourcentage'])
    : $current['promo_pourcentage'];
  $promoFixe = array_key_exists('prixFixe', $promo)
    ? ($promo['prixFixe'] === null || $promo['prixFixe'] === '' ? null : (int)$promo['prixFixe'])
    : $current['promo_prix_fixe'];
  $promoDebut = $promo['debut'] ?? $current['promo_debut'];
  $promoFin = $promo['fin'] ?? $current['promo_fin'];
  $promoExamens = array_key_exists('appliqueExamens', $promo)
    ? (bool)$promo['appliqueExamens']
    : (bool)$current['promo_applique_examens'];
  $promoCorriges = array_key_exists('appliqueCorriges', $promo)
    ? (bool)$promo['appliqueCorriges']
    : (bool)$current['promo_applique_corriges'];

  if ($prixExamen < 1 || $prixExamen > 100000) fail('Prix examen invalide (1–100 000 FCFA)');
  if ($prixCorrige !== null && ($prixCorrige < 1 || $prixCorrige > 200000)) fail('Prix corrigé invalide');
  if ($epreuvesPalier < 1 || $montantRecompense < 0 || $minRetrait < 0) fail('Paramètres contributeur invalides');
  if ($promoPct !== null && ($promoPct < 1 || $promoPct > 99)) fail('Réduction promo : 1 à 99 %');
  if ($promoFixe !== null && ($promoFixe < 1 || $promoFixe > 100000)) fail('Prix promo fixe invalide');
  if ($promoActive && $promoPct === null && $promoFixe === null) {
    fail('Activez une réduction en % ou un prix fixe pour la promo');
  }

  $debutSql = $promoDebut ? date('Y-m-d H:i:s', strtotime((string)$promoDebut)) : null;
  $finSql = $promoFin ? date('Y-m-d H:i:s', strtotime((string)$promoFin)) : null;
  if ($debutSql && $finSql && strtotime($finSql) < strtotime($debutSql)) {
    fail('La date de fin promo doit être après le début');
  }

  $contactIn = is_array($in['contact'] ?? null) ? $in['contact'] : [];
  $contactEmail = array_key_exists('email', $contactIn)
    ? trim((string)($contactIn['email'] ?? ''))
    : (string)($current['contact_email'] ?? '');
  $contactTelephone = array_key_exists('telephone', $contactIn)
    ? trim((string)($contactIn['telephone'] ?? ''))
    : (string)($current['contact_telephone'] ?? '');
  $contactWhatsapp = array_key_exists('whatsapp', $contactIn)
    ? trim((string)($contactIn['whatsapp'] ?? ''))
    : (string)($current['contact_whatsapp'] ?? '');
  $contactAdresse = array_key_exists('adresse', $contactIn)
    ? trim((string)($contactIn['adresse'] ?? ''))
    : (string)($current['contact_adresse'] ?? '');
  $contactHoraires = array_key_exists('horaires', $contactIn)
    ? trim((string)($contactIn['horaires'] ?? ''))
    : (string)($current['contact_horaires'] ?? '');

  if ($contactEmail !== '' && !filter_var($contactEmail, FILTER_VALIDATE_EMAIL)) {
    fail('Email de contact invalide');
  }

  $hasContactCols = array_key_exists('contact_email', $current);
  if ($hasContactCols) {
    db()->prepare(
      'UPDATE platform_settings SET
        prix_examen_national=?, prix_corrige_type=?,
        epreuves_par_recompense=?, montant_recompense=?, min_retrait=?,
        promo_active=?, promo_libelle=?, promo_pourcentage=?, promo_prix_fixe=?,
        promo_debut=?, promo_fin=?, promo_applique_examens=?, promo_applique_corriges=?,
        contact_email=?, contact_telephone=?, contact_whatsapp=?, contact_adresse=?, contact_horaires=?,
        updated_by=?
       WHERE id=1'
    )->execute([
      $prixExamen,
      $prixCorrige,
      $epreuvesPalier,
      $montantRecompense,
      $minRetrait,
      $promoActive ? 1 : 0,
      $promoLabel !== '' ? $promoLabel : null,
      $promoPct,
      $promoFixe,
      $debutSql,
      $finSql,
      $promoExamens ? 1 : 0,
      $promoCorriges ? 1 : 0,
      $contactEmail !== '' ? $contactEmail : null,
      $contactTelephone !== '' ? $contactTelephone : null,
      $contactWhatsapp !== '' ? $contactWhatsapp : null,
      $contactAdresse !== '' ? $contactAdresse : null,
      $contactHoraires !== '' ? $contactHoraires : null,
      $me['id'],
    ]);
  } else {
    db()->prepare(
      'UPDATE platform_settings SET
        prix_examen_national=?, prix_corrige_type=?,
        epreuves_par_recompense=?, montant_recompense=?, min_retrait=?,
        promo_active=?, promo_libelle=?, promo_pourcentage=?, promo_prix_fixe=?,
        promo_debut=?, promo_fin=?, promo_applique_examens=?, promo_applique_corriges=?,
        updated_by=?
       WHERE id=1'
    )->execute([
      $prixExamen,
      $prixCorrige,
      $epreuvesPalier,
      $montantRecompense,
      $minRetrait,
      $promoActive ? 1 : 0,
      $promoLabel !== '' ? $promoLabel : null,
      $promoPct,
      $promoFixe,
      $debutSql,
      $finSql,
      $promoExamens ? 1 : 0,
      $promoCorriges ? 1 : 0,
      $me['id'],
    ]);
  }

  json_out(['ok' => true, 'settings' => map_platform_settings_admin(load_platform_settings())]);
}

if (!$id) fail('id requis');

$user = require_user(['gestionnaire', 'admin']);

if ($action === 'valider') {
  $s = db()->prepare('SELECT * FROM soumissions WHERE id = ?');
  $s->execute([$id]);
  $sub = $s->fetch(); if (!$sub) fail('Introuvable', 404);
  $sub = apply_soumission_corrections($id, $sub, json_input());

  $newId = uuid();
  $published = publish_soumission_to_epreuve($cfg, $sub, $newId);

  db()->prepare("INSERT INTO epreuves
    (id,titre,matiere,niveau,classe,annee,type,periode,examen,etablissement_id,ville,
     pdf_path,pages,taille_ko,soumis_par,valide_le,statut)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),'validee')")
    ->execute([$newId, $sub['titre'], $sub['matiere'], $sub['niveau'], $sub['classe'],
               $sub['annee'], $sub['type'], $sub['periode'], $sub['examen'],
               $sub['etablissement_id'], $sub['ville'], $published['pdf_path'],
               $published['pages'], $published['taille_ko'],
               $sub['soumis_par']]);
  db()->prepare("UPDATE soumissions SET statut='validee', epreuve_id=? WHERE id=?")->execute([$newId, $id]);
  $reward = reward_contributor($sub['soumis_par']);
  $authorNom = db()->prepare('SELECT nom FROM users WHERE id = ?');
  $authorNom->execute([$sub['soumis_par']]);
  dispatch_notification_event('soumission_validee', [
    'nom' => $authorNom->fetchColumn() ?: 'Contributeur',
    'titre' => $sub['titre'],
  ], ['userId' => $sub['soumis_par'], 'url' => '/account/soumissions/' . $id]);
  json_out(['ok'=>true,'epreuve_id'=>$newId,'reward'=>$reward]);
}

if ($action === 'rejeter') {
  $motif = trim((json_input()['motif'] ?? '')) ?: 'Non conforme';
  $s = db()->prepare('SELECT * FROM soumissions WHERE id = ?');
  $s->execute([$id]);
  $sub = $s->fetch();
  if (!$sub) fail('Introuvable', 404);
  db()->prepare("UPDATE soumissions SET statut='rejetee', motif_rejet=? WHERE id=?")
      ->execute([$motif, $id]);
  $authorNom = db()->prepare('SELECT nom FROM users WHERE id = ?');
  $authorNom->execute([$sub['soumis_par']]);
  dispatch_notification_event('soumission_rejetee', [
    'nom' => $authorNom->fetchColumn() ?: 'Contributeur',
    'titre' => $sub['titre'],
    'motif' => $motif,
  ], ['userId' => $sub['soumis_par'], 'url' => '/account/soumissions/' . $id]);
  json_out(['ok'=>true]);
}

if ($action === 'remplacer') {
  $body = json_input();
  $doublonId = trim($body['doublonId'] ?? '');
  if (!$doublonId) fail('doublonId requis');

  $s = db()->prepare('SELECT * FROM soumissions WHERE id = ?');
  $s->execute([$id]);
  $sub = $s->fetch(); if (!$sub) fail('Soumission introuvable', 404);
  $sub = apply_soumission_corrections($id, $sub, $body);

  $old = db()->prepare('SELECT * FROM epreuves WHERE id = ? AND statut = ?');
  $old->execute([$doublonId, 'validee']);
  $existing = $old->fetch(); if (!$existing) fail('Épreuve existante introuvable', 404);

  // Archiver l'ancienne
  db()->prepare("UPDATE epreuves SET statut='archivee' WHERE id=?")->execute([$doublonId]);

  // Publier la nouvelle à la place
  $newId = uuid();
  $published = publish_soumission_to_epreuve($cfg, $sub, $newId);

  db()->prepare("INSERT INTO epreuves
    (id,titre,matiere,niveau,classe,annee,type,periode,examen,etablissement_id,ville,
     pdf_path,pages,taille_ko,soumis_par,valide_le,statut)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),'validee')")
    ->execute([$newId, $sub['titre'], $sub['matiere'], $sub['niveau'], $sub['classe'],
               $sub['annee'], $sub['type'], $sub['periode'], $sub['examen'],
               $sub['etablissement_id'], $sub['ville'], $published['pdf_path'],
               $published['pages'], $published['taille_ko'],
               $sub['soumis_par']]);
  db()->prepare("UPDATE soumissions SET statut='validee', epreuve_id=? WHERE id=?")->execute([$newId, $id]);
  $reward = reward_contributor($sub['soumis_par']);
  json_out(['ok'=>true,'epreuve_id'=>$newId,'archived_id'=>$doublonId,'reward'=>$reward]);
}

if ($action === 'archiver_soumission') {
  db()->prepare("UPDATE soumissions SET statut='rejetee', motif_rejet='Archivée pour usage ultérieur' WHERE id=?")
      ->execute([$id]);
  json_out(['ok'=>true]);
}

fail('Action inconnue', 404);
