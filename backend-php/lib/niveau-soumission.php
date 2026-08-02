<?php
// backend-php/lib/niveau-soumission.php — Validation par niveau + similarité épreuves
declare(strict_types=1);

/** Niveaux supportés (soumissions / épreuves). */
function niveaux_epreuve(): array {
  return ['college', 'lycee', 'universite', 'concours'];
}

/** Années d'études universitaires autorisées. */
function annees_etude_universite(): array {
  return ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat'];
}

/** Décode meta_niveau depuis une ligne DB. */
function decode_meta_niveau(mixed $raw): array {
  if (is_array($raw)) return $raw;
  if (is_string($raw) && $raw !== '') {
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
  }
  return [];
}

/** Normalise une chaîne pour comparaison (minuscules, accents légers). */
function similarity_normalize(string $s): string {
  $s = mb_strtolower(trim($s), 'UTF-8');
  $s = preg_replace('/\s+/u', ' ', $s) ?? $s;
  return $s;
}

/**
 * Score de similarité entre une soumission/candidat et une épreuve existante (0–100).
 * Pure function — utilisable en tests unitaires sans DB.
 */
function score_epreuve_similarity(array $candidate, array $existing): int {
  $score = 0;
  $cNiveau = (string)($candidate['niveau'] ?? '');
  $eNiveau = (string)($existing['niveau'] ?? '');
  if ($cNiveau === '' || $cNiveau !== $eNiveau) {
    return 0;
  }

  $cMatiere = similarity_normalize((string)($candidate['matiere'] ?? ''));
  $eMatiere = similarity_normalize((string)($existing['matiere'] ?? ''));
  if ($cMatiere !== '' && $cMatiere === $eMatiere) {
    $score += 30;
  } elseif ($cMatiere !== '' && $eMatiere !== '' && (
    str_contains($cMatiere, $eMatiere) || str_contains($eMatiere, $cMatiere)
  )) {
    $score += 15;
  }

  $cClasse = similarity_normalize((string)($candidate['classe'] ?? ''));
  $eClasse = similarity_normalize((string)($existing['classe'] ?? ''));
  if ($cClasse !== '' && $cClasse === $eClasse) {
    $score += 20;
  }

  $cAnnee = (int)($candidate['annee'] ?? 0);
  $eAnnee = (int)($existing['annee'] ?? 0);
  if ($cAnnee > 0 && $cAnnee === $eAnnee) {
    $score += 15;
  } elseif ($cAnnee > 0 && $eAnnee > 0 && abs($cAnnee - $eAnnee) === 1) {
    $score += 5;
  }

  $cType = (string)($candidate['type'] ?? '');
  $eType = (string)($existing['type'] ?? '');
  if ($cType !== '' && $cType === $eType) {
    $score += 10;
  }

  $cExamen = (string)($candidate['examen'] ?? '');
  $eExamen = (string)($existing['examen'] ?? '');
  if ($cExamen !== '' && $cExamen === $eExamen) {
    $score += 15;
  }

  $cTitre = similarity_normalize((string)($candidate['titre'] ?? ''));
  $eTitre = similarity_normalize((string)($existing['titre'] ?? ''));
  if ($cTitre !== '' && $eTitre !== '') {
    similar_text($cTitre, $eTitre, $pct);
    $score += (int)round(min(20.0, $pct / 5.0));
  }

  $cMeta = decode_meta_niveau($candidate['meta_niveau'] ?? $candidate['metaNiveau'] ?? []);
  $eMeta = decode_meta_niveau($existing['meta_niveau'] ?? $existing['metaNiveau'] ?? []);
  foreach (['concours', 'filiere', 'anneeEtude', 'nomEpreuve', 'session', 'universite'] as $key) {
    $cv = similarity_normalize((string)($cMeta[$key] ?? ''));
    $ev = similarity_normalize((string)($eMeta[$key] ?? ''));
    if ($cv !== '' && $cv === $ev) {
      $score += 8;
    }
  }

  return min(100, $score);
}

/**
 * Valide et normalise les champs d'une soumission selon le niveau.
 * Retourne [niveau, titre, matiere, classe, annee, type, periode, examen, ville, etablissement, meta_niveau]
 * ou appelle fail() en cas d'erreur.
 *
 * @param array<string,mixed> $in Données POST (déjà partiellement lues)
 * @return array{
 *   niveau:string,titre:string,matiere:string,classe:string,annee:int,type:string,
 *   periode:?string,examen:?string,ville:string,etablissement:?string,meta_niveau:array
 * }
 */
function validate_soumission_payload(array $in): array {
  $niveau = (string)($in['niveau'] ?? '');
  if (!in_array($niveau, niveaux_epreuve(), true)) {
    fail('Niveau invalide (college, lycee, universite ou concours)');
  }

  $titre = normalize_text((string)($in['titre'] ?? ''));
  $annee = (int)($in['annee'] ?? 0);
  if ($annee < 2000 || $annee > 2035) fail('Année invalide');

  $ville = normalize_ville((string)($in['ville'] ?? ''));
  $matiere = normalize_text((string)($in['matiere'] ?? ''));
  $classe = normalize_text((string)($in['classe'] ?? ''));
  $type = (string)($in['type'] ?? '');
  $periode = !empty($in['periode']) ? normalize_text((string)$in['periode']) : null;
  $examen = !empty($in['examen']) ? (string)$in['examen'] : null;
  $etabRaw = trim((string)($in['etablissement'] ?? ''));
  $etablissement = $etabRaw !== ''
    ? (repair_display_text($etabRaw) ?? normalize_text($etabRaw))
    : null;

  // meta_niveau peut arriver en JSON string ou champs plats
  $meta = [];
  if (!empty($in['meta_niveau'])) {
    if (is_string($in['meta_niveau'])) {
      $decoded = json_decode($in['meta_niveau'], true);
      $meta = is_array($decoded) ? $decoded : [];
    } elseif (is_array($in['meta_niveau'])) {
      $meta = $in['meta_niveau'];
    }
  }

  if ($niveau === 'college' || $niveau === 'lycee') {
    if ($titre === '') fail('Titre requis');
    if (!in_array($type, ['devoir', 'composition', 'examen'], true)) {
      fail('Type invalide');
    }
    if ($matiere === '' || $classe === '' || $ville === '') {
      fail('Métadonnées incomplètes (matière, classe, ville)');
    }
    $allowedClasses = load_meta_classes()[$niveau] ?? [];
    if ($allowedClasses) {
      $ok = false;
      foreach ($allowedClasses as $allowed) {
        if ($allowed === $classe) { $ok = true; break; }
      }
      if (!$ok) fail('Classe invalide pour ce niveau');
    }
    if ($type === 'examen') {
      if (!in_array($examen, ['CEPD', 'BEPC', 'BAC1', 'BAC2'], true)) {
        fail('Examen national invalide');
      }
      $periode = null;
      $etablissement = null;
    } else {
      $examen = null;
      if (!$etablissement || !$periode) {
        fail('Établissement et période requis pour ce type');
      }
      $periodesOk = $niveau === 'lycee' ? ['S1', 'S2'] : ['T1', 'T2', 'T3'];
      if (!in_array($periode, $periodesOk, true)) {
        fail('Période invalide pour ce niveau');
      }
    }
    $meta = [];
  } elseif ($niveau === 'universite') {
    if ($titre === '') fail('Titre requis');
    $filiere = normalize_text((string)($meta['filiere'] ?? $in['filiere'] ?? ''));
    $anneeEtude = normalize_text((string)($meta['anneeEtude'] ?? $in['anneeEtude'] ?? $classe));
    $universite = normalize_text((string)($meta['universite'] ?? $in['universite'] ?? $etablissement ?? ''));
    $session = normalize_text((string)($meta['session'] ?? $in['session'] ?? $periode ?? ''));
    $module = $matiere !== '' ? $matiere : normalize_text((string)($in['module'] ?? ''));

    if ($module === '') fail('Matière / module requis');
    if ($filiere === '') fail('Filière requise');
    if (!in_array($anneeEtude, annees_etude_universite(), true)) {
      fail('Année d\'études invalide (L1–L3, M1–M2, Doctorat)');
    }
    if ($universite === '') fail('Université / établissement requis');
    if ($ville === '') fail('Ville requise');
    if ($type === '' || !in_array($type, ['devoir', 'composition', 'examen'], true)) {
      $type = 'examen';
    }
    $classe = $anneeEtude;
    $matiere = $module;
    $etablissement = $universite;
    $periode = $session !== '' ? $session : null;
    $examen = null;
    $meta = array_filter([
      'filiere' => $filiere,
      'anneeEtude' => $anneeEtude,
      'universite' => $universite,
      'session' => $session !== '' ? $session : null,
    ], fn($v) => $v !== null && $v !== '');
  } else { // concours
    $concours = normalize_text((string)($meta['concours'] ?? $in['concours'] ?? ''));
    $session = normalize_text((string)($meta['session'] ?? $in['session'] ?? ''));
    $nomEpreuve = normalize_text((string)($meta['nomEpreuve'] ?? $in['nomEpreuve'] ?? $titre));
    $organisme = normalize_text((string)($meta['organisme'] ?? $in['organisme'] ?? ''));

    if ($concours === '') fail('Nom du concours requis');
    if ($session === '') fail('Année / session du concours requise');
    if ($nomEpreuve === '') fail('Nom de l\'épreuve requis');
    if ($ville === '') {
      $ville = 'Togo';
    }
    if ($matiere === '') {
      $matiere = $nomEpreuve;
    }
    $type = 'examen';
    $classe = mb_substr($concours, 0, 80);
    $titre = $titre !== '' ? $titre : $nomEpreuve;
    $periode = null;
    $examen = null;
    $etablissement = null;
    $anneeFromSession = (int)preg_replace('/\D/', '', $session);
    if ($anneeFromSession >= 2000 && $anneeFromSession <= 2035) {
      $annee = $anneeFromSession;
    }
    $meta = array_filter([
      'concours' => $concours,
      'session' => $session,
      'nomEpreuve' => $nomEpreuve,
      'organisme' => $organisme !== '' ? $organisme : null,
    ], fn($v) => $v !== null && $v !== '');
  }

  return [
    'niveau' => $niveau,
    'titre' => $titre,
    'matiere' => $matiere,
    'classe' => $classe,
    'annee' => $annee,
    'type' => $type,
    'periode' => $periode,
    'examen' => $examen,
    'ville' => $ville,
    'etablissement' => $etablissement,
    'meta_niveau' => $meta,
  ];
}

/**
 * Recherche les épreuves validées similaires (score >= seuil).
 *
 * @return list<array{id:string,score:int,epreuve:array}>
 */
function find_similar_epreuves(array $candidate, int $limit = 10, int $threshold = 40): array {
  $niveau = (string)($candidate['niveau'] ?? '');
  if (!in_array($niveau, niveaux_epreuve(), true)) {
    return [];
  }

  $annee = (int)($candidate['annee'] ?? 0);
  $stmt = db()->prepare(
    "SELECT e.*, et.nom AS etablissement
     FROM epreuves e
     LEFT JOIN etablissements et ON et.id = e.etablissement_id
     WHERE e.statut = 'validee' AND e.niveau = ?
       AND (? = 0 OR e.annee BETWEEN ? AND ?)
     ORDER BY e.valide_le DESC
     LIMIT 80"
  );
  $yearMin = $annee > 0 ? $annee - 2 : 0;
  $yearMax = $annee > 0 ? $annee + 1 : 9999;
  $stmt->execute([$niveau, $annee, $yearMin, $yearMax]);
  $rows = $stmt->fetchAll();

  $scored = [];
  foreach ($rows as $row) {
    $existing = [
      'niveau' => $row['niveau'],
      'matiere' => $row['matiere'],
      'classe' => $row['classe'],
      'annee' => (int)$row['annee'],
      'type' => $row['type'],
      'examen' => $row['examen'] ?? null,
      'titre' => $row['titre'],
      'meta_niveau' => decode_meta_niveau($row['meta_niveau'] ?? null),
    ];
    $score = score_epreuve_similarity($candidate, $existing);
    if ($score >= $threshold) {
      $scored[] = [
        'id' => $row['id'],
        'score' => $score,
        'epreuve' => map_epreuve($row),
      ];
    }
  }

  usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
  return array_slice($scored, 0, $limit);
}

/** Liste des concours (référentiel). */
function load_meta_concours(): array {
  if (!table_exists('concours_ref')) {
    return ['ENAM', 'Police nationale', 'Gendarmerie nationale', 'Douanes', 'Autre concours'];
  }
  $rows = db()->query('SELECT nom FROM concours_ref ORDER BY ordre ASC, nom ASC')->fetchAll(PDO::FETCH_COLUMN);
  return array_values(array_map(fn($n) => repair_display_text($n) ?? $n, $rows));
}

/** Liste des filières universitaires. */
function load_meta_filieres(): array {
  if (!table_exists('filieres_universite')) {
    return ['Droit', 'Économie', 'Gestion', 'Informatique', 'Autre filière'];
  }
  $rows = db()->query('SELECT nom FROM filieres_universite ORDER BY ordre ASC, nom ASC')->fetchAll(PDO::FETCH_COLUMN);
  return array_values(array_map(fn($n) => repair_display_text($n) ?? $n, $rows));
}
