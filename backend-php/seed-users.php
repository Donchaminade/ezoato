<?php
/**
 * Comptes de test EZOA-TO — à exécuter une fois :
 *   php seed-users.php
 *
 * Mot de passe commun : Tea2026!
 */
declare(strict_types=1);

const TEST_PASSWORD = 'Tea2026!';

function seed_db(): PDO {
  $local = __DIR__ . '/config.local.php';
  $cfg = is_file($local) ? require $local : require __DIR__ . '/config.php';
  try {
    return new PDO($cfg['db']['dsn'], $cfg['db']['user'], $cfg['db']['pass'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  } catch (PDOException) {
    return new PDO('mysql:host=localhost;dbname=zovu;charset=utf8mb4', 'root', '', [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  }
}

$accounts = [
  [
    'id' => 'a0000001-0000-4000-8000-000000000001',
    'nom' => 'Admin EZOA-TO',
    'email' => 'admin@tea.test',
    'telephone' => '90000001',
    'role' => 'admin',
    'ville' => 'Lomé',
    'wallet' => null,
  ],
  [
    'id' => 'a0000001-0000-4000-8000-000000000002',
    'nom' => 'Gestionnaire EZOA-TO',
    'email' => 'gestion@tea.test',
    'telephone' => '90000002',
    'role' => 'gestionnaire',
    'ville' => 'Lomé',
    'wallet' => null,
  ],
  [
    'id' => 'a0000001-0000-4000-8000-000000000003',
    'nom' => 'Afi Kouami',
    'email' => 'afi@tea.test',
    'telephone' => '90123456',
    'role' => 'utilisateur',
    'ville' => 'Lomé',
    'wallet' => ['solde' => 2500, 'epreuves_validees' => 12, 'paliers_verses' => 0],
  ],
  [
    'id' => 'a0000001-0000-4000-8000-000000000004',
    'nom' => 'Kodjo Mensah',
    'email' => 'kodjo@tea.test',
    'telephone' => '90765432',
    'role' => 'utilisateur',
    'ville' => 'Kara',
    'wallet' => ['solde' => 500, 'epreuves_validees' => 3, 'paliers_verses' => 0],
  ],
];

try {
  $db = seed_db();
  $hash = password_hash(TEST_PASSWORD, PASSWORD_BCRYPT);

  $upsertUser = $db->prepare(
    'INSERT INTO users (id, nom, email, telephone, password_hash, role, ville)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nom=VALUES(nom), telephone=VALUES(telephone),
       password_hash=VALUES(password_hash), role=VALUES(role), ville=VALUES(ville)'
  );

  $upsertWallet = $db->prepare(
    'INSERT INTO portefeuilles (user_id, solde, epreuves_validees, paliers_verses)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE solde=VALUES(solde), epreuves_validees=VALUES(epreuves_validees),
       paliers_verses=VALUES(paliers_verses)'
  );

  foreach ($accounts as $a) {
    $upsertUser->execute([$a['id'], $a['nom'], $a['email'], $a['telephone'], $hash, $a['role'], $a['ville']]);
    echo "✓ {$a['email']} / {$a['telephone']} ({$a['role']})\n";

    if ($a['wallet']) {
      $w = $a['wallet'];
      $upsertWallet->execute([$a['id'], $w['solde'], $w['epreuves_validees'], $w['paliers_verses']]);
      echo "  → portefeuille : {$w['solde']} FCFA\n";
    }
  }

  echo "\nMot de passe pour tous les comptes : " . TEST_PASSWORD . "\n";
} catch (Throwable $e) {
  fwrite(STDERR, "Erreur : " . $e->getMessage() . "\n");
  exit(1);
}
