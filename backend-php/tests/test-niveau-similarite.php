<?php
/**
 * Tests unitaires défensifs — similarité + validation par niveau.
 * Usage : php tests/test-niveau-similarite.php
 * (sans DB pour le scoring ; validation via stubs minimaux)
 */
declare(strict_types=1);

$failed = 0;
$passed = 0;

function assert_true(bool $cond, string $msg): void {
  global $failed, $passed;
  if ($cond) {
    echo "  OK  $msg\n";
    $passed++;
  } else {
    echo " FAIL $msg\n";
    $failed++;
  }
}

// Stubs minimaux pour charger le scoring sans bootstrap complet
if (!function_exists('fail')) {
  function fail(string $msg, int $code = 400): void {
    throw new RuntimeException($msg, $code);
  }
}
if (!function_exists('normalize_text')) {
  function normalize_text(string $s): string {
    return trim(preg_replace('/\s+/u', ' ', $s) ?? $s);
  }
}
if (!function_exists('normalize_ville')) {
  function normalize_ville(string $s): string {
    return normalize_text($s);
  }
}
if (!function_exists('repair_display_text')) {
  function repair_display_text(?string $s): ?string {
    return $s;
  }
}
if (!function_exists('load_meta_classes')) {
  function load_meta_classes(): array {
    return [
      'college' => ['6e', '5e', '4e', '3e'],
      'lycee' => ['2nde A', 'Tle C'],
      'universite' => ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat'],
      'concours' => [],
    ];
  }
}
if (!function_exists('table_exists')) {
  function table_exists(string $t): bool { return false; }
}
if (!function_exists('db')) {
  function db(): never { throw new RuntimeException('DB non disponible en test unitaire'); }
}
if (!function_exists('map_epreuve')) {
  function map_epreuve(array $row): array { return $row; }
}

require dirname(__DIR__) . '/lib/niveau-soumission.php';

echo "=== score_epreuve_similarity ===\n";

$base = [
  'niveau' => 'college',
  'matiere' => 'Mathématiques',
  'classe' => '3e',
  'annee' => 2024,
  'type' => 'composition',
  'titre' => 'Composition de Maths T2',
  'examen' => null,
  'meta_niveau' => [],
];

$same = $base;
$scoreSame = score_epreuve_similarity($base, $same);
assert_true($scoreSame >= 70, "doublon quasi exact score=$scoreSame (>=70)");

$diffNiveau = $base;
$diffNiveau['niveau'] = 'lycee';
assert_true(score_epreuve_similarity($base, $diffNiveau) === 0, 'niveaux différents → 0');

$partial = $base;
$partial['titre'] = 'Autre titre';
$partial['annee'] = 2023;
$scorePartial = score_epreuve_similarity($base, $partial);
assert_true($scorePartial >= 40 && $scorePartial < $scoreSame, "partiel score=$scorePartial");

$concoursA = [
  'niveau' => 'concours',
  'matiere' => 'Culture générale',
  'classe' => 'ENAM',
  'annee' => 2024,
  'type' => 'examen',
  'titre' => 'Culture générale ENAM',
  'meta_niveau' => ['concours' => 'ENAM', 'session' => '2024', 'nomEpreuve' => 'Culture générale'],
];
$concoursB = $concoursA;
$scoreC = score_epreuve_similarity($concoursA, $concoursB);
assert_true($scoreC >= 60, "concours identiques score=$scoreC");

echo "\n=== validate_soumission_payload ===\n";

try {
  validate_soumission_payload(['niveau' => 'invalide', 'titre' => 'x']);
  assert_true(false, 'niveau invalide doit échouer');
} catch (RuntimeException $e) {
  assert_true($e->getCode() === 400 || str_contains($e->getMessage(), 'Niveau'), 'niveau invalide → fail');
}

$college = validate_soumission_payload([
  'niveau' => 'college',
  'titre' => 'Devoir Maths',
  'matiere' => 'Mathématiques',
  'classe' => '3e',
  'annee' => 2024,
  'type' => 'devoir',
  'periode' => 'T2',
  'ville' => 'Lomé',
  'etablissement' => 'Collège Test',
]);
assert_true($college['niveau'] === 'college' && $college['periode'] === 'T2', 'college devoir OK');

$univ = validate_soumission_payload([
  'niveau' => 'universite',
  'titre' => 'Examen Droit civil',
  'matiere' => 'Droit civil',
  'annee' => 2024,
  'type' => 'examen',
  'ville' => 'Lomé',
  'filiere' => 'Droit',
  'anneeEtude' => 'L2',
  'universite' => 'Université de Lomé',
  'session' => 'S1',
]);
assert_true(
  $univ['classe'] === 'L2' && ($univ['meta_niveau']['filiere'] ?? '') === 'Droit',
  'universite OK'
);

$concours = validate_soumission_payload([
  'niveau' => 'concours',
  'titre' => '',
  'annee' => 2024,
  'ville' => '',
  'concours' => 'ENAM',
  'session' => '2024',
  'nomEpreuve' => 'Culture générale',
]);
assert_true(
  $concours['type'] === 'examen'
    && ($concours['meta_niveau']['concours'] ?? '') === 'ENAM'
    && $concours['ville'] === 'Togo',
  'concours OK (ville défaut Togo)'
);

try {
  validate_soumission_payload([
    'niveau' => 'concours',
    'annee' => 2024,
    'concours' => '',
    'session' => '2024',
    'nomEpreuve' => 'x',
  ]);
  assert_true(false, 'concours sans nom doit échouer');
} catch (RuntimeException $e) {
  assert_true(str_contains($e->getMessage(), 'concours'), 'concours vide → fail');
}

echo "\n=== Injection / normalisation (defensif) ===\n";
$injected = validate_soumission_payload([
  'niveau' => 'college',
  'titre' => 'Test',
  'matiere' => 'Math',
  'classe' => '3e',
  'annee' => 2024,
  'type' => 'devoir',
  'periode' => 'T1',
  'ville' => 'Lome',
  'etablissement' => 'College',
  'meta_niveau' => '{"filiere":"x"}',
]);
assert_true($injected['meta_niveau'] === [], 'meta_niveau vide pour college/lycee');

echo "\n=== Resultat : $passed OK, $failed echec(s) ===\n";
exit($failed > 0 ? 1 : 0);
