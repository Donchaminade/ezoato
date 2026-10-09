<?php
/**
 * Heuristiques : énoncé qui ressemble à un corrigé, divergence entre corrections,
 * score de suggestion d'un correcteur.
 */
declare(strict_types=1);

function correction_attestation_requise(mixed $value): ?string
{
  $ok = $value === 1 || $value === '1' || $value === true || $value === 'true' || $value === 'on';
  if ($ok) {
    return null;
  }
  return 'Attestation obligatoire : confirme que le fichier est un énoncé, sans corrigé.';
}

/** @return array{signale:bool,motif:?string} */
function correction_detecter_corrige(string $texte): array
{
  $t = mb_strtolower($texte);
  $mots = [
    'corrigé', 'corrige', 'correction', 'barème', 'bareme',
    'réponses :', 'reponses :', 'reponses:', 'éléments de réponse',
    'elements de reponse', 'solution détaillée', 'solution detaillee',
    'proposition de corrigé', 'proposition de corrige',
  ];
  foreach ($mots as $mot) {
    if (str_contains($t, $mot)) {
      return [
        'signale' => true,
        'motif' => 'Le contenu ressemble à un corrigé (« ' . $mot . ' »). L\'administration tranche.',
      ];
    }
  }
  return ['signale' => false, 'motif' => null];
}

function correction_extrait_texte_fichier(string $path): string
{
  if ($path === '' || !is_file($path)) {
    return '';
  }
  $bin = getenv('EZOATO_PDFTOTEXT') ?: 'pdftotext';
  if (!is_executable_command($bin)) {
    return '';
  }
  $tmp = tempnam(sys_get_temp_dir(), 'ezoa-txt-');
  if ($tmp === false) {
    return '';
  }
  $cmd = escapeshellarg($bin) . ' -f 1 -l 2 -q ' . escapeshellarg($path) . ' ' . escapeshellarg($tmp);
  @exec($cmd, $unused, $code);
  $text = ($code === 0 && is_file($tmp)) ? (string)file_get_contents($tmp) : '';
  @unlink($tmp);
  return mb_substr($text, 0, 4000);
}

function is_executable_command(string $bin): bool
{
  if ($bin === '') {
    return false;
  }
  if (str_contains($bin, DIRECTORY_SEPARATOR)) {
    return is_executable($bin);
  }
  $path = getenv('PATH') ?: '';
  foreach (explode(PATH_SEPARATOR, $path) as $dir) {
    if ($dir !== '' && is_executable($dir . DIRECTORY_SEPARATOR . $bin)) {
      return true;
    }
  }
  return false;
}

function correction_signature_exercices(array $exercices): string
{
  $norm = [];
  foreach ($exercices as $exercice) {
    $item = mb_strtolower(trim((string)$exercice));
    if ($item !== '') {
      $norm[] = $item;
    }
  }
  sort($norm);
  return hash('sha256', implode('|', $norm));
}

function correction_tokens(string $texte): array
{
  $parts = preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($texte)) ?: [];
  $out = [];
  foreach ($parts as $part) {
    if (mb_strlen($part) >= 4) {
      $out[$part] = true;
    }
  }
  return array_keys($out);
}

function correction_jaccard(string $a, string $b): float
{
  $ta = correction_tokens($a);
  $tb = correction_tokens($b);
  if (!$ta || !$tb) {
    return 0.0;
  }
  $inter = count(array_intersect($ta, $tb));
  $union = count(array_unique([...$ta, ...$tb]));
  return $union === 0 ? 0.0 : $inter / $union;
}

/** @param list<string> $autres */
function correction_detecter_divergence(string $contenu, array $autres): array
{
  if (!$autres) {
    return ['signalee' => false, 'note' => null, 'similarite' => null];
  }
  $pire = 1.0;
  foreach ($autres as $autre) {
    $sim = correction_jaccard($contenu, (string)$autre);
    if ($sim < $pire) {
      $pire = $sim;
    }
  }
  if ($pire < 0.35) {
    return [
      'signalee' => true,
      'note' => 'Les corrections de cet exercice divergent (similarité ' . (int)round($pire * 100) . ' %). Le validateur tranche.',
      'similarite' => $pire,
    ];
  }
  return ['signalee' => false, 'note' => null, 'similarite' => $pire];
}

function correction_score_profil(array $profil, string $matiere, string $niveau, int $charge): int
{
  $score = (int)($profil['fiabilite'] ?? 0);
  $matieres = $profil['matieres'] ?? [];
  $niveaux = $profil['niveaux'] ?? [];
  if (in_array($matiere, $matieres, true)) {
    $score += 30;
  }
  if (in_array($niveau, $niveaux, true)) {
    $score += 20;
  }
  return $score - (10 * max(0, $charge));
}

function correction_formater_livraison(string $contenu, string $format): string
{
  $contenu = trim($contenu);
  if ($format === 'pedagogique_courte') {
    return "Correction commentée\n\nRelis la démarche, puis seulement ensuite le résultat.\n\n"
      . $contenu
      . "\n\nRefais l'exercice sans ce texte.";
  }
  return "Correction commentée et pédagogique\n\n"
    . "Cette version explique la démarche. Elle n'est pas publiée avec l'épreuve. "
    . "Lis chaque étape, note ce que tu aurais fait autrement, puis compare.\n\n"
    . $contenu
    . "\n\nÀ retenir : refais l'exercice sur papier, sans regarder ce texte, et vérifie seulement ensuite.";
}
