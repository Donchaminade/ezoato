<?php
/**
 * Freemium, palier contributeur et idempotence d'activation Pro.
 * Fonctions pures (testables sans MySQL) + accès quota quand helpers.php est chargé.
 */
declare(strict_types=1);

function ezoa_env(string $key, ?string $default = null): ?string {
  if (array_key_exists($key, $_ENV) && $_ENV[$key] !== null && (string)$_ENV[$key] !== '') {
    return (string)$_ENV[$key];
  }
  if (array_key_exists($key, $_SERVER) && !is_array($_SERVER[$key]) && (string)$_SERVER[$key] !== '') {
    return (string)$_SERVER[$key];
  }
  $g = getenv($key);
  if ($g !== false && $g !== '') return (string)$g;
  return $default;
}

function freemium_norm(string $s): string {
  $s = trim($s);
  if (function_exists('mb_strtolower')) {
    $s = mb_strtolower($s, 'UTF-8');
  } else {
    $s = strtolower($s);
  }
  $s = preg_replace('/\s+/u', ' ', $s) ?? $s;
  return $s;
}

/**
 * Quota gratuit.
 * mode=shared (défaut) : un seul compteur de `quota` (50) pour devoirs et compositions.
 * mode=separate : `quota_devoir` et `quota_composition` indépendants.
 * Les examens universitaires (pas nationaux) comptent dans le seau `shared`.
 */
function freemium_config(): array {
  $mode = strtolower(trim((string)(ezoa_env('EZOATO_FREEMIUM_QUOTA_MODE', 'shared') ?? 'shared')));
  if (!in_array($mode, ['shared', 'separate'], true)) $mode = 'shared';
  $quota = max(0, (int)(ezoa_env('EZOATO_FREEMIUM_QUOTA', '50') ?? '50'));
  $devoir = max(0, (int)(ezoa_env('EZOATO_FREEMIUM_QUOTA_DEVOIR', (string)$quota) ?? (string)$quota));
  $composition = max(0, (int)(ezoa_env('EZOATO_FREEMIUM_QUOTA_COMPOSITION', (string)$quota) ?? (string)$quota));
  return [
    'mode' => $mode,
    'quota' => $quota,
    'quota_devoir' => $devoir,
    'quota_composition' => $composition,
  ];
}

/** Examens officiels : CEPD, BEPC, BAC I/II. Les concours sont un niveau à part. */
function examens_officiels(): array {
  return ['CEPD', 'BEPC', 'BAC1', 'BAC2'];
}

/**
 * pro = Pro obligatoire dès la première consultation.
 * quota = devoir / composition (et examen universitaire non officiel) dans le quota gratuit.
 */
function epreuve_access_tier(array $epreuve): string {
  $type = (string)($epreuve['type'] ?? '');
  $niveau = (string)($epreuve['niveau'] ?? '');
  if ($type === 'corrige' || $niveau === 'concours') return 'pro';
  $examen = strtoupper(trim((string)($epreuve['examen'] ?? '')));
  if ($type === 'examen' && in_array($examen, examens_officiels(), true)) return 'pro';
  return 'quota';
}

function freemium_bucket(array $epreuve, string $mode): string {
  if ($mode !== 'separate') return 'shared';
  $type = (string)($epreuve['type'] ?? '');
  if ($type === 'devoir') return 'devoir';
  if ($type === 'composition') return 'composition';
  return 'shared';
}

function freemium_limit(array $cfg, string $bucket): int {
  if ($bucket === 'devoir') return (int)$cfg['quota_devoir'];
  if ($bucket === 'composition') return (int)$cfg['quota_composition'];
  return (int)$cfg['quota'];
}

/**
 * @param array{
 *   tier:string,isPro:bool,legacyAccess?:bool,alreadyCounted?:bool,used?:int,limit?:int
 * } $opts
 * @return array{allowed:bool,reason:string,consume:bool,requiresPro:bool}
 */
function freemium_decision(array $opts): array {
  $tier = (string)($opts['tier'] ?? 'quota');
  $isPro = !empty($opts['isPro']);
  $legacy = !empty($opts['legacyAccess']);
  if ($isPro || $legacy) {
    return ['allowed' => true, 'reason' => $legacy && !$isPro ? 'legacy' : 'pro', 'consume' => false, 'requiresPro' => false];
  }
  if ($tier === 'pro') {
    return ['allowed' => false, 'reason' => 'pro_required', 'consume' => false, 'requiresPro' => true];
  }
  if (!empty($opts['alreadyCounted'])) {
    return ['allowed' => true, 'reason' => 'already', 'consume' => false, 'requiresPro' => false];
  }
  $used = (int)($opts['used'] ?? 0);
  $limit = (int)($opts['limit'] ?? 0);
  if ($used >= $limit) {
    return ['allowed' => false, 'reason' => 'quota_exceeded', 'consume' => false, 'requiresPro' => true];
  }
  return ['allowed' => true, 'reason' => 'consume', 'consume' => true, 'requiresPro' => false];
}

function message_quota_atteint(int $used, int $limit): string {
  return "Tu as utilisé tes {$used}/{$limit} épreuves gratuites. L'abonnement Pro débloque la suite.";
}

function message_pro_requis(): string {
  return "Cette épreuve (examen officiel ou concours) nécessite l'abonnement Pro dès la première consultation.";
}

function message_doublon_epreuve(): string {
  return "Cette épreuve a déjà été validée. Seule la première soumission validée est rémunérée — la prochaine fois, envoie-la plus vite.";
}

/** La clé de doublon inclut l'établissement pour un devoir, pas pour une composition collège/lycée. */
function dedup_inclut_etablissement(array $row): bool {
  $type = (string)($row['type'] ?? '');
  $niveau = (string)($row['niveau'] ?? '');
  if ($niveau === 'universite') return true;
  return $type === 'devoir';
}

function epreuve_dedup_parts(array $row): array {
  $meta = $row['meta_niveau'] ?? $row['metaNiveau'] ?? [];
  if (is_string($meta) && $meta !== '') {
    $decoded = json_decode($meta, true);
    $meta = is_array($decoded) ? $decoded : [];
  }
  if (!is_array($meta)) $meta = [];

  $etab = (string)($row['etablissement'] ?? $row['etablissement_nom'] ?? '');
  if ($etab === '' && !empty($meta['universite'])) $etab = (string)$meta['universite'];

  $parts = [
    'niveau' => freemium_norm((string)($row['niveau'] ?? '')),
    'type' => freemium_norm((string)($row['type'] ?? '')),
    'matiere' => freemium_norm((string)($row['matiere'] ?? '')),
    'classe' => freemium_norm((string)($row['classe'] ?? '')),
    'annee' => (int)($row['annee'] ?? 0),
    'periode' => freemium_norm((string)($row['periode'] ?? '')),
    'examen' => freemium_norm((string)($row['examen'] ?? '')),
  ];
  if (dedup_inclut_etablissement($row)) {
    $parts['etablissement'] = freemium_norm($etab);
  }
  if (($parts['niveau'] ?? '') === 'concours') {
    $parts['concours'] = freemium_norm((string)($meta['concours'] ?? ''));
    $parts['session'] = freemium_norm((string)($meta['session'] ?? ''));
    $parts['nomEpreuve'] = freemium_norm((string)($meta['nomEpreuve'] ?? ''));
  }
  ksort($parts);
  return $parts;
}

function epreuve_dedup_key(array $row): string {
  return hash('sha256', json_encode(epreuve_dedup_parts($row), JSON_UNESCAPED_UNICODE));
}

/**
 * Barème contributeur : N épreuves validées = montant, retrait dès min.
 * Défaut produit : 50 → 1 000 FCFA, retrait dès 2 000 FCFA.
 *
 * @return array{credite:int,paliersDus:int,nouveauxPaliers:int}
 */
function calculer_recompense_palier(int $epreuvesValidees, int $paliersVerses, int $parPalier, int $montantPalier): array {
  $parPalier = max(1, $parPalier);
  $montantPalier = max(0, $montantPalier);
  $paliersDus = intdiv(max(0, $epreuvesValidees), $parPalier);
  $nouveaux = max(0, $paliersDus - max(0, $paliersVerses));
  return [
    'credite' => $nouveaux * $montantPalier,
    'paliersDus' => $paliersDus,
    'nouveauxPaliers' => $nouveaux,
  ];
}

function retrait_autorise(int $solde, int $montant, int $minimum): bool {
  return $montant >= $minimum && $solde >= $montant && $montant > 0;
}

/**
 * Active le Pro une seule fois par événement fournisseur.
 * Un second événement (ou le même) ne prolonge pas une période déjà active.
 *
 * @param array{statut?:string,date_debut?:?int,date_fin?:?int,evenements?:list<string>} $etat
 * @param array{providerEventId:string,paye?:bool,now?:int} $evenement
 * @return array{statut:string,date_debut:?int,date_fin:?int,evenements:list<string>,resultat:string,prolonge:bool}
 */
function appliquer_evenement_pro(array $etat, array $evenement, int $dureeMois): array {
  $dureeMois = max(1, min(24, $dureeMois));
  $evenements = array_values(array_map('strval', $etat['evenements'] ?? []));
  $statut = (string)($etat['statut'] ?? 'en_attente');
  $debut = isset($etat['date_debut']) ? ($etat['date_debut'] !== null ? (int)$etat['date_debut'] : null) : null;
  $fin = isset($etat['date_fin']) ? ($etat['date_fin'] !== null ? (int)$etat['date_fin'] : null) : null;
  $eventId = trim((string)($evenement['providerEventId'] ?? ''));

  $base = [
    'statut' => $statut,
    'date_debut' => $debut,
    'date_fin' => $fin,
    'evenements' => $evenements,
    'resultat' => 'invalide',
    'prolonge' => false,
  ];
  if ($eventId === '') return $base;

  if (in_array($eventId, $evenements, true)) {
    $base['resultat'] = 'idempotent';
    return $base;
  }
  $evenements[] = $eventId;
  $base['evenements'] = $evenements;

  if ($statut === 'actif') {
    $base['resultat'] = 'deja_actif';
    return $base;
  }
  if (empty($evenement['paye'])) {
    $base['resultat'] = 'impaye';
    return $base;
  }

  $now = (int)($evenement['now'] ?? time());
  $finDt = (new DateTimeImmutable('@' . $now))
    ->setTimezone(new DateTimeZone('UTC'))
    ->modify('+' . $dureeMois . ' months');
  $base['statut'] = 'actif';
  $base['date_debut'] = $now;
  $base['date_fin'] = $finDt->getTimestamp();
  $base['resultat'] = 'active';
  $base['prolonge'] = true;
  return $base;
}

function confirmation_client_peut_activer(bool $estSimule, bool $payeChezOperateur): bool {
  if ($estSimule) return true;
  return $payeChezOperateur;
}

function freemium_public_config(): array {
  $cfg = freemium_config();
  return [
    'quotaMode' => $cfg['mode'],
    'quota' => $cfg['quota'],
    'quotaDevoir' => $cfg['quota_devoir'],
    'quotaComposition' => $cfg['quota_composition'],
  ];
}

function freemium_label(int $used, int $limit): string {
  return $used . '/' . $limit;
}
