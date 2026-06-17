<?php
// backend-php/meta.php — Données de référence & stats publiques
declare(strict_types=1);
require __DIR__ . '/helpers.php';
cors();

$db = db();

/**
 * Valeurs d'une colonne ENUM (source de vérité : le schéma MySQL),
 * avec repli statique si la colonne est introuvable.
 */
function meta_enum_values(string $table, string $column, array $fallback): array {
  try {
    $stmt = db()->prepare(
      'SELECT COLUMN_TYPE FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?'
    );
    $stmt->execute([$table, $column]);
    $type = (string)$stmt->fetchColumn();
    if (preg_match('/^enum\((.*)\)$/i', $type, $m)) {
      $vals = str_getcsv($m[1], ',', "'", '\\');
      if ($vals && $vals[0] !== null) return array_values($vals);
    }
  } catch (Throwable $e) {
    // repli silencieux sur les valeurs par défaut
  }
  return $fallback;
}

$villes = $db->query('SELECT nom FROM villes ORDER BY nom')->fetchAll(PDO::FETCH_COLUMN);
$matieres = $db->query('SELECT nom FROM matieres ORDER BY nom')->fetchAll(PDO::FETCH_COLUMN);
$etabs = $db->query('SELECT nom, ville, niveau FROM etablissements ORDER BY nom')->fetchAll();
$etablissementsOut = [];
$etabSeen = [];
foreach ($etabs as $e) {
  $nom = repair_display_text($e['nom']) ?? $e['nom'];
  $key = mb_strtolower($nom, 'UTF-8');
  if (isset($etabSeen[$key])) continue;
  $etabSeen[$key] = true;
  $etablissementsOut[] = [
    'nom' => $nom,
    'ville' => repair_ville_display($e['ville'] ?? ''),
    'niveau' => $e['niveau'],
  ];
}
usort($etablissementsOut, fn($a, $b) => strcmp($a['nom'], $b['nom']));

json_out([
  'villes' => array_values(array_unique(array_map(
    fn($v) => repair_ville_display($v),
    $villes
  ))),
  'matieres' => array_values(array_unique(array_map(
    fn($m) => repair_display_text($m) ?? $m,
    $matieres
  ))),
  'etablissements' => $etablissementsOut,
  'classes' => load_meta_classes(),
  'types' => meta_enum_values('soumissions', 'type', ['devoir', 'composition', 'examen']),
  'periodes' => meta_enum_values('soumissions', 'periode', ['T1', 'T2', 'T3', 'S1', 'S2']),
  'examens' => meta_enum_values('soumissions', 'examen', ['CEPD', 'BEPC', 'BAC1', 'BAC2']),
  'stats' => public_stats(),
  'pricing' => pricing_public(),
]);
