<?php
/**
 * Répare l'encodage des règles et messages de notification en base.
 * Usage CLI : php fix-notifications-encoding.php
 */
declare(strict_types=1);
require __DIR__ . '/helpers.php';

if (PHP_SAPI !== 'cli') {
  fwrite(STDERR, "Exécutez ce script en CLI.\n");
  exit(1);
}

$db = db();
$stats = ['rules' => 0, 'inbox' => 0];

if (table_exists('notification_rules')) {
  $rows = $db->query('SELECT id, libelle, description, titre, corps FROM notification_rules')->fetchAll();
  $upd = $db->prepare(
    'UPDATE notification_rules SET libelle = ?, description = ?, titre = ?, corps = ? WHERE id = ?',
  );
  foreach ($rows as $row) {
    $libelle = repair_display_text($row['libelle'] ?? '') ?? '';
    $description = repair_display_text($row['description'] ?? null);
    $titre = repair_display_text($row['titre'] ?? '') ?? '';
    $corps = repair_display_text($row['corps'] ?? '') ?? '';
    if ($libelle === ($row['libelle'] ?? '')
        && $description === ($row['description'] ?? null)
        && $titre === ($row['titre'] ?? '')
        && $corps === ($row['corps'] ?? '')) {
      continue;
    }
    $upd->execute([$libelle, $description, $titre, $corps, $row['id']]);
    $stats['rules']++;
  }
}

if (table_exists('notification_inbox')) {
  $rows = $db->query('SELECT id, titre, corps FROM notification_inbox')->fetchAll();
  $upd = $db->prepare('UPDATE notification_inbox SET titre = ?, corps = ? WHERE id = ?');
  foreach ($rows as $row) {
    $titre = repair_display_text($row['titre'] ?? '') ?? '';
    $corps = repair_display_text($row['corps'] ?? '') ?? '';
    if ($titre === ($row['titre'] ?? '') && $corps === ($row['corps'] ?? '')) {
      continue;
    }
    $upd->execute([$titre, $corps, $row['id']]);
    $stats['inbox']++;
  }
}

echo "Réparation des notifications terminée.\n";
echo sprintf("  règles mises à jour : %d\n", $stats['rules']);
echo sprintf("  messages inbox mis à jour : %d\n", $stats['inbox']);

$r = $db->query("SELECT titre, corps FROM notification_rules WHERE code='soumission_validee_user'")->fetch();
if ($r) {
  echo "\nExemple soumission_validee_user :\n";
  echo "  titre : {$r['titre']}\n";
  echo "  corps : {$r['corps']}\n";
}
