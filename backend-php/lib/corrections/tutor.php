<?php
/**
 * Port tuteur pour le triage des demandes.
 *
 * La branche feat/tuteur-ia-guide peut définir ezoato_tutor_guide(array $input): array
 * sans modifier ce fichier. Le résultat passe toujours par correction_assainir_guide :
 * aucune réponse directe n'est renvoyée à l'élève.
 *
 * Forme attendue :
 *   classe: comprehension|humaine
 *   explications: string
 *   exemples: string[]
 *   qcm: [{id, prompt, choices, correctIndex}]
 */
declare(strict_types=1);

function correction_classer_blocage(string $texte): string
{
  $t = mb_strtolower($texte);
  $humain = [
    'donne la réponse', 'donne-moi la réponse', 'donne moi la réponse',
    'la solution', 'le corrigé', 'le corrige', 'résous', 'resous',
    'fais l\'exercice', 'je veux le résultat', 'quelle est la réponse',
    'corrige mon', 'correction complète', 'barème', 'bareme',
    'je bloque sur le calcul', 'je n\'y arrive pas', 'je ny arrive pas',
  ];
  foreach ($humain as $mot) {
    if (str_contains($t, $mot)) {
      return 'humaine';
    }
  }
  $comprehension = [
    'je ne comprends pas', 'je comprends pas', 'c\'est quoi', 'c’est quoi',
    'explique', 'explication', 'définition', 'definition', 'pourquoi',
    'comment ça marche', 'comment ca marche', 'quelle notion', 'je confonds',
    'à quoi sert', 'a quoi sert', 'je mélange',
  ];
  foreach ($comprehension as $mot) {
    if (str_contains($t, $mot)) {
      return 'comprehension';
    }
  }
  return 'humaine';
}

function correction_contient_reponse_directe(string $text): bool
{
  $patterns = [
    '/\bla r[ée]ponse (est|finale|correcte|exacte)\b/iu',
    '/\bla solution (est|finale|compl[èe]te)\b/iu',
    '/\br[ée]sultat final\b/iu',
    '/\bdonc\s+[^=\n]{0,40}=\s*-?\d+/iu',
    '/\b[xyz]\s*=\s*-?\d+/iu',
  ];
  foreach ($patterns as $pattern) {
    if (preg_match($pattern, $text)) {
      return true;
    }
  }
  return false;
}

function correction_filtrer_reponse_directe(string $text): string
{
  $text = trim($text);
  if ($text === '') {
    return '';
  }
  $parts = preg_split('/(?<=[\.\!\?])\s+/u', $text) ?: [];
  $kept = [];
  $blocked = false;
  foreach ($parts as $part) {
    if (correction_contient_reponse_directe($part)) {
      $blocked = true;
      continue;
    }
    $kept[] = $part;
  }
  $out = trim(implode(' ', $kept));
  if ($blocked) {
    $rappel = 'Je ne donne pas la réponse directe. Identifie les données, choisis la relation utile, puis vérifie chaque étape sur un exemple voisin.';
    $out = trim($out . ' ' . $rappel);
  }
  return $out;
}

function correction_guider(array $input, array $deps = []): array
{
  $complet = $deps['complete'] ?? null;
  if (is_callable($complet)) {
    $raw = $complet($input);
  } elseif (function_exists('ezoato_tutor_guide')) {
    $raw = ezoato_tutor_guide($input);
  } else {
    $raw = correction_guide_local($input);
  }
  if (!is_array($raw)) {
    $raw = ['classe' => 'humaine', 'explications' => '', 'exemples' => [], 'qcm' => []];
  }
  return correction_assainir_guide($raw);
}

function correction_guide_local(array $input): array
{
  $blocage = trim((string)($input['blocage'] ?? ''));
  $classe = correction_classer_blocage($blocage);
  $matiere = (string)($input['matiere'] ?? 'la matière');
  $exercices = $input['exercices'] ?? [];
  $cible = $exercices ? implode(', ', array_map('strval', $exercices)) : 'l\'exercice';
  if ($classe !== 'comprehension') {
    return [
      'classe' => 'humaine',
      'explications' => '',
      'exemples' => [],
      'qcm' => [],
    ];
  }
  return [
    'classe' => 'comprehension',
    'explications' => "Tu bloques sur une notion de {$matiere}, pas sur un résultat à recopier. Pour {$cible}, nomme d'abord ce que l'énoncé donne, puis la question exacte, puis la relation du cours qui relie les deux.",
    'exemples' => [
      "Exemple voisin : si un énoncé dit que 3 cahiers coûtent 900 FCFA, le prix d'un cahier se cherche par une division, avant toute généralisation.",
      "Autre situation : deux grandeurs qui doublent ensemble sont proportionnelles. Deux grandeurs dont une seule change ne le sont pas.",
    ],
    'qcm' => [
      [
        'id' => 'q1',
        'prompt' => "Pour avancer sur {$cible}, que fais-tu en premier ?",
        'choices' => [
          'Je recopie un résultat trouvé ailleurs',
          'Je souligne les données et la question',
          'J\'écris une formule au hasard',
        ],
        'correctIndex' => 1,
      ],
      [
        'id' => 'q2',
        'prompt' => 'Un exemple voisin sert à quoi ?',
        'choices' => [
          'À remplacer l\'exercice du sujet',
          'À vérifier que j\'ai compris la démarche sur un cas proche',
          'À obtenir la note de l\'épreuve',
        ],
        'correctIndex' => 1,
      ],
    ],
  ];
}

function correction_assainir_guide(array $raw): array
{
  $classe = (($raw['classe'] ?? '') === 'comprehension') ? 'comprehension' : 'humaine';
  $fuite = false;
  $explications = correction_filtrer_reponse_directe((string)($raw['explications'] ?? ''));
  if ($explications !== trim((string)($raw['explications'] ?? ''))) {
    $fuite = true;
  }
  $exemples = [];
  foreach ($raw['exemples'] ?? [] as $exemple) {
    $clean = correction_filtrer_reponse_directe((string)$exemple);
    if ($clean !== trim((string)$exemple)) {
      $fuite = true;
    }
    if ($clean !== '') {
      $exemples[] = $clean;
    }
  }
  $qcm = [];
  $interne = [];
  foreach ($raw['qcm'] ?? [] as $q) {
    if (!is_array($q)) {
      continue;
    }
    $id = (string)($q['id'] ?? substr(bin2hex(random_bytes(4)), 0, 8));
    $promptRaw = (string)($q['prompt'] ?? '');
    $prompt = correction_filtrer_reponse_directe($promptRaw);
    if ($prompt !== trim($promptRaw)) {
      $fuite = true;
    }
    $choices = [];
    foreach ($q['choices'] ?? [] as $choice) {
      $choices[] = correction_filtrer_reponse_directe((string)$choice);
    }
    $qcm[] = ['id' => $id, 'prompt' => $prompt, 'choices' => $choices];
    $interne[] = ['id' => $id, 'correctIndex' => (int)($q['correctIndex'] ?? -1)];
  }
  return [
    'classe' => $classe,
    'explications' => $explications,
    'exemples' => $exemples,
    'qcm' => $qcm,
    'qcmInterne' => $interne,
    'donneReponseDirecte' => false,
    'fuiteBloquee' => $fuite,
  ];
}

function correction_guide_public(?array $guide): ?array
{
  if (!$guide) {
    return null;
  }
  return [
    'classe' => $guide['classe'] ?? 'humaine',
    'explications' => $guide['explications'] ?? '',
    'exemples' => $guide['exemples'] ?? [],
    'qcm' => $guide['qcm'] ?? [],
    'donneReponseDirecte' => false,
  ];
}

function correction_repondre_qcm(array $guide, string $questionId, int $choice): array
{
  foreach ($guide['qcmInterne'] ?? [] as $q) {
    if ((string)($q['id'] ?? '') !== $questionId) {
      continue;
    }
    $ok = $choice === (int)($q['correctIndex'] ?? -2);
    return [
      'ok' => $ok,
      'feedback' => $ok
        ? 'C’est cohérent avec la notion. Explique maintenant, avec tes mots, pourquoi les autres choix ne conviennent pas.'
        : 'Ce n’est pas le choix le plus cohérent. Reviens à l’exemple voisin et à la définition, sans chercher la réponse toute faite.',
    ];
  }
  return ['ok' => false, 'feedback' => 'Question introuvable dans cette demande.'];
}
