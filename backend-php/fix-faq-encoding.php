<?php
/**
 * Répare l'encodage (mojibake console UTF-8) des questions/réponses FAQ en base
 * et remplace l'ancien nom « TEA » / « Togo Exam Archive » par « EZOA-TO ».
 * Usage CLI : php fix-faq-encoding.php
 */
declare(strict_types=1);
require __DIR__ . '/helpers.php';

if (PHP_SAPI !== 'cli') {
  fwrite(STDERR, "Exécutez ce script en CLI.\n");
  exit(1);
}

/** Remplace l'ancien branding TEA par EZOA-TO (après réparation de l'encodage). */
function rebrand_tea_to_ezoa(string $text): string {
  $text = str_replace(
    ['TEA (Togo Exam Archive)', 'Togo Exam Archive', 'Archives TEA'],
    ['EZOA-TO', 'EZOA-TO', 'Archives EZOA-TO'],
    $text,
  );
  // Mot isolé « TEA » (évite de toucher des mots contenant la séquence).
  return preg_replace('/\bTEA\b/u', 'EZOA-TO', $text) ?? $text;
}

if (!table_exists('faq_items')) {
  fwrite(STDERR, "Table faq_items introuvable.\n");
  exit(1);
}

$db = db();
$stats = ['encodage' => 0, 'rebrand' => 0, 'total' => 0];

$rows = $db->query('SELECT id, question, answer FROM faq_items')->fetchAll();
$upd = $db->prepare('UPDATE faq_items SET question = ?, answer = ? WHERE id = ?');

foreach ($rows as $row) {
  $question = repair_display_text($row['question'] ?? '') ?? '';
  $answer = repair_display_text($row['answer'] ?? '') ?? '';
  $encodingFixed = ($question !== ($row['question'] ?? '')) || ($answer !== ($row['answer'] ?? ''));

  $newQuestion = rebrand_tea_to_ezoa($question);
  $newAnswer = rebrand_tea_to_ezoa($answer);
  $rebranded = ($newQuestion !== $question) || ($newAnswer !== $answer);

  if (!$encodingFixed && !$rebranded) continue;

  $upd->execute([$newQuestion, $newAnswer, $row['id']]);
  if ($encodingFixed) $stats['encodage']++;
  if ($rebranded) $stats['rebrand']++;
  $stats['total']++;
}

echo "Réparation de la FAQ terminée.\n";
echo sprintf("  entrées mises à jour       : %d\n", $stats['total']);
echo sprintf("  encodage réparé            : %d\n", $stats['encodage']);
echo sprintf("  rebranding TEA → EZOA-TO   : %d\n", $stats['rebrand']);

$r = $db->query("SELECT question, LEFT(answer, 160) AS extrait FROM faq_items WHERE id='10000000-0000-4000-8000-000000000001'")->fetch();
if ($r) {
  echo "\nExemple (question n°1) :\n";
  echo "  question : {$r['question']}\n";
  echo "  réponse  : {$r['extrait']}\n";
}
