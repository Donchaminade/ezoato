<?php
/**
 * Réglages des demandes de correction.
 * Valeurs prudentes, modifiables sans redéploiement (table correction_reglages).
 */
declare(strict_types=1);

function correction_reglages_defaut(): array
{
  return [
    'remuneration_correcteur' => 500,
    'forfait_validateur' => 200,
    'prix_unitaire' => 1500,
    'quota_pro' => 1,
    'nombre_validateurs' => 1,
    'delai_reassignation_heures' => 48,
    'reutilisation_active' => 1,
    'remuneration_reutilisation' => 100,
    'format_eleve' => 'pedagogique',
  ];
}

function correction_formats_eleve(): array
{
  return ['pedagogique', 'pedagogique_courte'];
}

/** @return array{ok:bool,error:?string,reglages:?array} */
function correction_reglages_valider(array $in): array
{
  $base = correction_reglages_defaut();
  $out = [];
  $ints = [
    'remuneration_correcteur' => [0, 100000],
    'forfait_validateur' => [0, 100000],
    'prix_unitaire' => [0, 100000],
    'quota_pro' => [0, 50],
    'nombre_validateurs' => [1, 5],
    'delai_reassignation_heures' => [1, 336],
    'remuneration_reutilisation' => [0, 100000],
  ];
  foreach ($ints as $key => [$min, $max]) {
    if (!array_key_exists($key, $in) && !array_key_exists($key, $base)) {
      return ['ok' => false, 'error' => 'Réglage manquant', 'reglages' => null];
    }
    $raw = $in[$key] ?? $base[$key];
    if (is_bool($raw) || !is_numeric($raw)) {
      return ['ok' => false, 'error' => "Valeur invalide : $key", 'reglages' => null];
    }
    $n = (int)$raw;
    if ($n < $min || $n > $max) {
      return ['ok' => false, 'error' => "$key hors limites ($min–$max)", 'reglages' => null];
    }
    $out[$key] = $n;
  }
  $reuse = $in['reutilisation_active'] ?? $base['reutilisation_active'];
  $out['reutilisation_active'] = ($reuse === true || $reuse === 1 || $reuse === '1') ? 1 : 0;
  $format = (string)($in['format_eleve'] ?? $base['format_eleve']);
  if (!in_array($format, correction_formats_eleve(), true)) {
    return ['ok' => false, 'error' => 'Format élève inconnu', 'reglages' => null];
  }
  $out['format_eleve'] = $format;
  return ['ok' => true, 'error' => null, 'reglages' => $out];
}

function correction_reglages_normaliser(array $row): array
{
  $d = correction_reglages_defaut();
  foreach ($d as $k => $v) {
    if (!array_key_exists($k, $row) || $row[$k] === null) {
      continue;
    }
    $d[$k] = is_int($v) ? (int)$row[$k] : (string)$row[$k];
  }
  $d['reutilisation_active'] = (int)$d['reutilisation_active'] ? 1 : 0;
  if (!in_array($d['format_eleve'], correction_formats_eleve(), true)) {
    $d['format_eleve'] = 'pedagogique';
  }
  return $d;
}

function correction_reglages_publics(array $reglages): array
{
  return [
    'prixUnitaire' => (int)$reglages['prix_unitaire'],
    'quotaPro' => (int)$reglages['quota_pro'],
    'nombreValidateurs' => (int)$reglages['nombre_validateurs'],
    'delaiReassignationHeures' => (int)$reglages['delai_reassignation_heures'],
    'reutilisationActive' => (bool)$reglages['reutilisation_active'],
    'formatEleve' => $reglages['format_eleve'],
    'formatEleveLabel' => $reglages['format_eleve'] === 'pedagogique_courte'
      ? 'Correction commentée, version courte'
      : 'Correction commentée et pédagogique',
    'minRetrait' => function_exists('cfg') ? (int)(cfg()['contributeur']['min_retrait'] ?? 2000) : 2000,
  ];
}
