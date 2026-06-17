<?php
/**
 * Répare l'encodage des référentiels (matières, villes, classes) et supprime les doublons.
 * Usage CLI : php fix-referentiels-encoding.php
 */
declare(strict_types=1);
require __DIR__ . '/helpers.php';

function repair_table_simple(string $table): array {
  $db = db();
  $rows = $db->query("SELECT nom FROM {$table}")->fetchAll(PDO::FETCH_COLUMN);
  $kept = [];
  $updated = 0;
  $deleted = 0;

  foreach ($rows as $raw) {
    $raw = (string)$raw;
    $canonical = canonical_referentiel_nom($raw, $table === 'villes');
    if ($canonical === '') {
      $db->prepare("DELETE FROM {$table} WHERE nom = ?")->execute([$raw]);
      $deleted++;
      continue;
    }
    $labelKey = mb_strtolower($canonical, 'UTF-8');
    if (isset($kept[$labelKey])) {
      $db->prepare("DELETE FROM {$table} WHERE nom = ?")->execute([$raw]);
      $deleted++;
      continue;
    }
    if ($raw !== $canonical) {
      $exists = $db->prepare("SELECT 1 FROM {$table} WHERE nom = ? LIMIT 1");
      $exists->execute([$canonical]);
      if ($exists->fetchColumn()) {
        $db->prepare("DELETE FROM {$table} WHERE nom = ?")->execute([$raw]);
        $deleted++;
        $kept[$labelKey] = $canonical;
        continue;
      }
      $db->prepare("UPDATE {$table} SET nom = ? WHERE nom = ?")->execute([$canonical, $raw]);
      $updated++;
      $kept[$labelKey] = $canonical;
      continue;
    }
    $kept[$labelKey] = $raw;
  }

  return ['updated' => $updated, 'deleted' => $deleted];
}

function repair_classes(): array {
  if (!table_exists('classes')) {
    return ['updated' => 0, 'deleted' => 0];
  }
  $db = db();
  $rows = $db->query('SELECT nom, niveau FROM classes')->fetchAll();
  $kept = [];
  $updated = 0;
  $deleted = 0;

  foreach ($rows as $row) {
    $raw = (string)$row['nom'];
    $niveau = (string)$row['niveau'];
    $canonical = canonical_referentiel_nom($raw);
    if ($canonical === '') {
      $db->prepare('DELETE FROM classes WHERE nom = ? AND niveau = ?')->execute([$raw, $niveau]);
      $deleted++;
      continue;
    }
    $labelKey = $niveau . '|' . mb_strtolower($canonical, 'UTF-8');
    if (isset($kept[$labelKey])) {
      $db->prepare('DELETE FROM classes WHERE nom = ? AND niveau = ?')->execute([$raw, $niveau]);
      $deleted++;
      continue;
    }
    if ($raw !== $canonical) {
      $exists = $db->prepare('SELECT 1 FROM classes WHERE nom = ? AND niveau = ? LIMIT 1');
      $exists->execute([$canonical, $niveau]);
      if ($exists->fetchColumn()) {
        $db->prepare('DELETE FROM classes WHERE nom = ? AND niveau = ?')->execute([$raw, $niveau]);
        $deleted++;
        $kept[$labelKey] = $canonical;
        continue;
      }
      $db->prepare('UPDATE classes SET nom = ? WHERE nom = ? AND niveau = ?')->execute([$canonical, $raw, $niveau]);
      $updated++;
      $kept[$labelKey] = $canonical;
      continue;
    }
    $kept[$labelKey] = $raw;
  }

  return ['updated' => $updated, 'deleted' => $deleted];
}

if (PHP_SAPI !== 'cli') {
  fwrite(STDERR, "Exécutez ce script en CLI.\n");
  exit(1);
}

$results = [
  'matieres' => repair_table_simple('matieres'),
  'villes' => repair_table_simple('villes'),
  'classes' => repair_classes(),
];

echo "Réparation des référentiels terminée.\n";
foreach ($results as $table => $stats) {
  echo sprintf(
    "  %s : %d renommée(s), %d doublon(s) supprimé(s)\n",
    $table,
    $stats['updated'],
    $stats['deleted'],
  );
}
