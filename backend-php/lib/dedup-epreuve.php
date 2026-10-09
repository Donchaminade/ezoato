<?php
/**
 * Déduplication des épreuves à la soumission et à la validation.
 * Devoir : la clé inclut l'établissement. Composition collège/lycée : non.
 */
declare(strict_types=1);

require_once __DIR__ . '/freemium.php';

function cle_dedup_ligne(array $row): string {
  if (!empty($row['dedup_key'])) return (string)$row['dedup_key'];
  if (empty($row['etablissement']) && !empty($row['etablissement_id']) && function_exists('db')) {
    $n = db()->prepare('SELECT nom FROM etablissements WHERE id=?');
    $n->execute([(int)$row['etablissement_id']]);
    $nom = $n->fetchColumn();
    if (is_string($nom) && $nom !== '') $row['etablissement'] = $nom;
  }
  return epreuve_dedup_key($row);
}

function trouver_doublon_valide(array $candidate): ?string {
  if (!function_exists('db')) return null;
  $key = cle_dedup_ligne($candidate);
  if (function_exists('column_exists') && column_exists('epreuves', 'dedup_key')) {
    $stmt = db()->prepare("SELECT id FROM epreuves WHERE dedup_key=? AND statut='validee' LIMIT 1");
    $stmt->execute([$key]);
    $id = $stmt->fetchColumn();
    if ($id) return (string)$id;
  }
  $stmt = db()->prepare("SELECT e.*, et.nom AS etablissement
    FROM epreuves e
    LEFT JOIN etablissements et ON et.id = e.etablissement_id
    WHERE e.statut='validee' AND e.type=? AND e.niveau=? AND e.annee=?
    LIMIT 80");
  $stmt->execute([
    (string)($candidate['type'] ?? ''),
    (string)($candidate['niveau'] ?? ''),
    (int)($candidate['annee'] ?? 0),
  ]);
  foreach ($stmt->fetchAll() as $row) {
    if (epreuve_dedup_key($row) === $key) return (string)$row['id'];
  }
  return null;
}

function compter_soumissions_en_course(string $dedupKey, ?string $saufId = null): int {
  if (!function_exists('column_exists') || !column_exists('soumissions', 'dedup_key')) return 0;
  if ($saufId) {
    $stmt = db()->prepare("SELECT COUNT(*) FROM soumissions WHERE dedup_key=? AND statut='en_attente' AND id<>?");
    $stmt->execute([$dedupKey, $saufId]);
  } else {
    $stmt = db()->prepare("SELECT COUNT(*) FROM soumissions WHERE dedup_key=? AND statut='en_attente'");
    $stmt->execute([$dedupKey]);
  }
  return (int)$stmt->fetchColumn();
}

function rejeter_soumission_doublon(string $soumissionId): void {
  $msg = message_doublon_epreuve();
  db()->prepare("UPDATE soumissions SET statut='rejetee', motif_rejet=? WHERE id=? AND statut<>'validee'")
    ->execute([$msg, $soumissionId]);
}

function rejeter_doublons_en_attente(string $dedupKey, string $saufId): void {
  if (!function_exists('column_exists') || !column_exists('soumissions', 'dedup_key')) return;
  $msg = message_doublon_epreuve();
  db()->prepare("UPDATE soumissions SET statut='rejetee', motif_rejet=? WHERE dedup_key=? AND statut='en_attente' AND id<>?")
    ->execute([$msg, $dedupKey, $saufId]);
}

function verrouiller_dedup(string $dedupKey, string $epreuveId, string $soumissionId): bool {
  if (!function_exists('table_exists') || !table_exists('epreuve_dedup_verrous')) return true;
  try {
    db()->prepare('INSERT INTO epreuve_dedup_verrous (dedup_key, epreuve_id, soumission_id) VALUES (?,?,?)')
      ->execute([$dedupKey, $epreuveId, $soumissionId]);
    return true;
  } catch (PDOException $e) {
    $sqlState = (int)($e->errorInfo[1] ?? 0);
    if ($sqlState === 1062) return false;
    throw $e;
  }
}

function remplacer_verrou_dedup(string $dedupKey, string $epreuveId, string $soumissionId): void {
  if (!function_exists('table_exists') || !table_exists('epreuve_dedup_verrous')) return;
  $upd = db()->prepare('UPDATE epreuve_dedup_verrous SET epreuve_id=?, soumission_id=? WHERE dedup_key=?');
  $upd->execute([$epreuveId, $soumissionId, $dedupKey]);
  if ($upd->rowCount() === 0) {
    verrouiller_dedup($dedupKey, $epreuveId, $soumissionId);
  }
}

function inserer_epreuve_validee(string $newId, array $sub, array $published, string $dedupKey): void {
  $metaJson = $sub['meta_niveau'] ?? null;
  if (is_array($metaJson)) $metaJson = json_encode($metaJson, JSON_UNESCAPED_UNICODE);
  $cols = 'id,titre,matiere,niveau,classe,annee,type,periode,examen,meta_niveau,etablissement_id,ville,pdf_path,pages,taille_ko,soumis_par,valide_le,statut';
  $marks = '?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),\'validee\'';
  $params = [
    $newId, $sub['titre'], $sub['matiere'], $sub['niveau'], $sub['classe'],
    $sub['annee'], $sub['type'], $sub['periode'], $sub['examen'], $metaJson,
    $sub['etablissement_id'], $sub['ville'], $published['pdf_path'],
    $published['pages'], $published['taille_ko'], $sub['soumis_par'],
  ];
  if (function_exists('column_exists') && column_exists('epreuves', 'dedup_key')) {
    $cols .= ',dedup_key';
    $marks .= ',?';
    $params[] = $dedupKey;
  }
  db()->prepare("INSERT INTO epreuves ($cols) VALUES ($marks)")->execute($params);
}

/**
 * Publie une soumission. Si un doublon validé existe, refuse sans rémunérer.
 * Un remplacement archive l'ancienne fiche et ne compte pas comme une nouvelle récompense.
 *
 * @return array{ok:bool,epreuve_id?:string,doublonId?:string,message?:string,dedup_key?:string}
 */
function publier_et_valider_soumission(array $cfg, array $sub, bool $remplacement = false, ?string $ancienneEpreuveId = null): array {
  require_once __DIR__ . '/storage-paths.php';
  $key = cle_dedup_ligne($sub);
  $sub['dedup_key'] = $key;
  if (!$remplacement) {
    $existant = trouver_doublon_valide($sub);
    if ($existant) {
      rejeter_soumission_doublon((string)$sub['id']);
      return ['ok' => false, 'doublonId' => $existant, 'message' => message_doublon_epreuve(), 'dedup_key' => $key];
    }
  }

  $newId = uuid();
  $published = publish_soumission_to_epreuve($cfg, $sub, $newId);
  $pdo = db();
  $pdo->beginTransaction();
  try {
    if ($remplacement && $ancienneEpreuveId) {
      $pdo->prepare("UPDATE epreuves SET statut='archivee' WHERE id=?")->execute([$ancienneEpreuveId]);
      if (function_exists('column_exists') && column_exists('epreuves', 'dedup_key')) {
        $pdo->prepare('UPDATE epreuves SET dedup_key=NULL WHERE id=?')->execute([$ancienneEpreuveId]);
      }
      remplacer_verrou_dedup($key, $newId, (string)$sub['id']);
    } elseif (!verrouiller_dedup($key, $newId, (string)$sub['id'])) {
      $pdo->rollBack();
      rejeter_soumission_doublon((string)$sub['id']);
      return ['ok' => false, 'message' => message_doublon_epreuve(), 'dedup_key' => $key];
    }

    inserer_epreuve_validee($newId, $sub, $published, $key);

    $sets = ["statut='validee'", 'epreuve_id=?'];
    $params = [$newId];
    if (function_exists('column_exists') && column_exists('soumissions', 'dedup_key')) {
      $sets[] = 'dedup_key=?';
      $params[] = $key;
    }
    if (function_exists('column_exists') && column_exists('soumissions', 'recompense_eligible')) {
      $sets[] = 'recompense_eligible=?';
      $params[] = $remplacement ? 0 : 1;
    }
    $params[] = $sub['id'];
    $pdo->prepare('UPDATE soumissions SET ' . implode(', ', $sets) . ' WHERE id=?')->execute($params);

    if (!$remplacement) {
      rejeter_doublons_en_attente($key, (string)$sub['id']);
    }
    $pdo->commit();
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    throw $e;
  }

  return ['ok' => true, 'epreuve_id' => $newId, 'dedup_key' => $key];
}
