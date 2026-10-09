<?php
/**
 * Persistance des demandes de correction (MySQL en prod, SQLite dans les tests).
 */
declare(strict_types=1);

function correction_sqlite_schema(PDO $pdo): void
{
  $pdo->exec('CREATE TABLE users (
    id TEXT PRIMARY KEY,
    nom TEXT,
    role TEXT
  )');
  $pdo->exec('CREATE TABLE notification_inbox (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    rule_id TEXT NULL,
    titre TEXT NOT NULL,
    corps TEXT NOT NULL,
    url TEXT NULL,
    lu INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )');
  $pdo->exec('CREATE TABLE correction_reglages (
    id INTEGER PRIMARY KEY,
    remuneration_correcteur INTEGER NOT NULL,
    forfait_validateur INTEGER NOT NULL,
    prix_unitaire INTEGER NOT NULL,
    quota_pro INTEGER NOT NULL,
    nombre_validateurs INTEGER NOT NULL,
    delai_reassignation_heures INTEGER NOT NULL,
    reutilisation_active INTEGER NOT NULL,
    remuneration_reutilisation INTEGER NOT NULL,
    format_eleve TEXT NOT NULL,
    maj_le TEXT NOT NULL
  )');
  $pdo->exec('CREATE TABLE correcteur_profils (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    qualite TEXT NOT NULL,
    statut TEXT NOT NULL,
    matieres_json TEXT NOT NULL,
    niveaux_json TEXT NOT NULL,
    fiabilite INTEGER NOT NULL DEFAULT 50,
    piece_identite_path TEXT NOT NULL,
    preuve_enseignement_path TEXT NOT NULL,
    motif TEXT NULL,
    valide_par TEXT NULL,
    cree_le TEXT NOT NULL,
    maj_le TEXT NOT NULL
  )');
  $pdo->exec('CREATE TABLE correction_demandes (
    id TEXT PRIMARY KEY,
    eleve_id TEXT NOT NULL,
    epreuve_id TEXT NOT NULL,
    epreuve_titre TEXT NOT NULL DEFAULT "",
    matiere TEXT NOT NULL DEFAULT "",
    niveau TEXT NOT NULL DEFAULT "",
    exercices_json TEXT NOT NULL,
    exercices_signature TEXT NOT NULL,
    blocage_texte TEXT NULL,
    audio_path TEXT NULL,
    transcription TEXT NULL,
    statut TEXT NOT NULL,
    origine TEXT NOT NULL DEFAULT "nouvelle",
    classe_ia TEXT NULL,
    reponse_ia_json TEXT NULL,
    confirmee INTEGER NOT NULL DEFAULT 0,
    correcteur_id TEXT NULL,
    correction_active_id TEXT NULL,
    assignee_le TEXT NULL,
    echeance_le TEXT NULL,
    reglement_mode TEXT NOT NULL,
    reglement_statut TEXT NOT NULL,
    reglement_reference TEXT NULL,
    montant INTEGER NOT NULL DEFAULT 0,
    periode_quota TEXT NULL,
    correction_reutilisee_id TEXT NULL,
    format_eleve TEXT NOT NULL,
    admin_notifie INTEGER NOT NULL DEFAULT 0,
    cree_le TEXT NOT NULL,
    maj_le TEXT NOT NULL
  )');
  $pdo->exec('CREATE TABLE correction_corrections (
    id TEXT PRIMARY KEY,
    demande_id TEXT NOT NULL,
    correcteur_id TEXT NOT NULL,
    contenu TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    statut TEXT NOT NULL,
    cree_le TEXT NOT NULL
  )');
  $pdo->exec('CREATE TABLE correction_livraisons (
    id TEXT PRIMARY KEY,
    demande_id TEXT NOT NULL,
    correction_id TEXT NULL,
    format TEXT NOT NULL,
    contenu TEXT NOT NULL,
    cree_le TEXT NOT NULL
  )');
  $pdo->exec('CREATE TABLE correction_revues (
    id TEXT PRIMARY KEY,
    correction_id TEXT NOT NULL,
    demande_id TEXT NOT NULL,
    validateur_id TEXT NOT NULL,
    decision TEXT NOT NULL,
    commentaire TEXT NULL,
    divergence_signalee INTEGER NOT NULL DEFAULT 0,
    divergence_note TEXT NULL,
    cree_le TEXT NOT NULL,
    UNIQUE (correction_id, validateur_id)
  )');
  $pdo->exec('CREATE TABLE correction_evenements (
    id TEXT PRIMARY KEY,
    demande_id TEXT NOT NULL,
    type TEXT NOT NULL,
    acteur_id TEXT NULL,
    payload_json TEXT NULL,
    cree_le TEXT NOT NULL
  )');
  $pdo->exec('CREATE TABLE correction_versements (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    montant INTEGER NOT NULL,
    role_versement TEXT NOT NULL,
    demande_id TEXT NOT NULL,
    reference_metier TEXT NULL,
    cree_le TEXT NOT NULL
  )');
  $d = correction_reglages_defaut();
  $pdo->prepare('INSERT INTO correction_reglages
    (id, remuneration_correcteur, forfait_validateur, prix_unitaire, quota_pro, nombre_validateurs,
     delai_reassignation_heures, reutilisation_active, remuneration_reutilisation, format_eleve, maj_le)
    VALUES (1,?,?,?,?,?,?,?,?,?,?)')->execute([
    $d['remuneration_correcteur'], $d['forfait_validateur'], $d['prix_unitaire'], $d['quota_pro'],
    $d['nombre_validateurs'], $d['delai_reassignation_heures'], $d['reutilisation_active'],
    $d['remuneration_reutilisation'], $d['format_eleve'], date('Y-m-d H:i:s'),
  ]);
}

function correction_reglages_lire(PDO $pdo): array
{
  $row = $pdo->query('SELECT * FROM correction_reglages WHERE id = 1')->fetch();
  if (!$row) {
    $d = correction_reglages_defaut();
    correction_reglages_ecrire($pdo, $d);
    return $d;
  }
  return correction_reglages_normaliser($row);
}

function correction_reglages_ecrire(PDO $pdo, array $reglages): void
{
  $v = correction_reglages_valider($reglages);
  if (!$v['ok']) {
    throw new InvalidArgumentException($v['error'] ?? 'Réglages invalides');
  }
  $r = $v['reglages'];
  $pdo->prepare('INSERT INTO correction_reglages
      (id, remuneration_correcteur, forfait_validateur, prix_unitaire, quota_pro, nombre_validateurs,
       delai_reassignation_heures, reutilisation_active, remuneration_reutilisation, format_eleve, maj_le)
    VALUES (1,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      remuneration_correcteur = excluded.remuneration_correcteur,
      forfait_validateur = excluded.forfait_validateur,
      prix_unitaire = excluded.prix_unitaire,
      quota_pro = excluded.quota_pro,
      nombre_validateurs = excluded.nombre_validateurs,
      delai_reassignation_heures = excluded.delai_reassignation_heures,
      reutilisation_active = excluded.reutilisation_active,
      remuneration_reutilisation = excluded.remuneration_reutilisation,
      format_eleve = excluded.format_eleve,
      maj_le = excluded.maj_le')->execute([
    $r['remuneration_correcteur'], $r['forfait_validateur'], $r['prix_unitaire'], $r['quota_pro'],
    $r['nombre_validateurs'], $r['delai_reassignation_heures'], $r['reutilisation_active'],
    $r['remuneration_reutilisation'], $r['format_eleve'], date('Y-m-d H:i:s'),
  ]);
}

function correction_reglages_ecrire_mysql(PDO $pdo, array $reglages): void
{
  $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
  if ($driver === 'sqlite') {
    correction_reglages_ecrire($pdo, $reglages);
    return;
  }
  $v = correction_reglages_valider($reglages);
  if (!$v['ok']) {
    throw new InvalidArgumentException($v['error'] ?? 'Réglages invalides');
  }
  $r = $v['reglages'];
  $pdo->prepare('INSERT INTO correction_reglages
      (id, remuneration_correcteur, forfait_validateur, prix_unitaire, quota_pro, nombre_validateurs,
       delai_reassignation_heures, reutilisation_active, remuneration_reutilisation, format_eleve, maj_le)
    VALUES (1,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      remuneration_correcteur = VALUES(remuneration_correcteur),
      forfait_validateur = VALUES(forfait_validateur),
      prix_unitaire = VALUES(prix_unitaire),
      quota_pro = VALUES(quota_pro),
      nombre_validateurs = VALUES(nombre_validateurs),
      delai_reassignation_heures = VALUES(delai_reassignation_heures),
      reutilisation_active = VALUES(reutilisation_active),
      remuneration_reutilisation = VALUES(remuneration_reutilisation),
      format_eleve = VALUES(format_eleve),
      maj_le = VALUES(maj_le)')->execute([
    $r['remuneration_correcteur'], $r['forfait_validateur'], $r['prix_unitaire'], $r['quota_pro'],
    $r['nombre_validateurs'], $r['delai_reassignation_heures'], $r['reutilisation_active'],
    $r['remuneration_reutilisation'], $r['format_eleve'], date('Y-m-d H:i:s'),
  ]);
}

function correction_demande_inserer(PDO $pdo, array $d): void
{
  $pdo->prepare('INSERT INTO correction_demandes (
      id, eleve_id, epreuve_id, epreuve_titre, matiere, niveau, exercices_json, exercices_signature,
      blocage_texte, audio_path, transcription, statut, origine, classe_ia, reponse_ia_json, confirmee,
      correcteur_id, correction_active_id, assignee_le, echeance_le, reglement_mode, reglement_statut,
      reglement_reference, montant, periode_quota, correction_reutilisee_id, format_eleve, admin_notifie,
      cree_le, maj_le
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')->execute([
    $d['id'], $d['eleve_id'], $d['epreuve_id'], $d['epreuve_titre'], $d['matiere'], $d['niveau'],
    json_encode($d['exercices'], JSON_UNESCAPED_UNICODE), $d['exercices_signature'],
    $d['blocage_texte'], $d['audio_path'], $d['transcription'], $d['statut'], $d['origine'],
    $d['classe_ia'], $d['reponse_ia'] ? json_encode($d['reponse_ia'], JSON_UNESCAPED_UNICODE) : null,
    (int)$d['confirmee'], $d['correcteur_id'], $d['correction_active_id'], $d['assignee_le'],
    $d['echeance_le'], $d['reglement_mode'], $d['reglement_statut'], $d['reglement_reference'] ?? null,
    (int)$d['montant'], $d['periode_quota'], $d['correction_reutilisee_id'], $d['format_eleve'],
    (int)$d['admin_notifie'], $d['cree_le'], $d['maj_le'],
  ]);
}

function correction_demande_maj(PDO $pdo, array $d): void
{
  $pdo->prepare('UPDATE correction_demandes SET
      statut=?, origine=?, classe_ia=?, reponse_ia_json=?, confirmee=?, correcteur_id=?,
      correction_active_id=?, assignee_le=?, echeance_le=?, reglement_mode=?, reglement_statut=?,
      reglement_reference=?, montant=?, periode_quota=?, correction_reutilisee_id=?, format_eleve=?,
      admin_notifie=?, transcription=?, maj_le=?
    WHERE id=?')->execute([
    $d['statut'], $d['origine'], $d['classe_ia'],
    $d['reponse_ia'] ? json_encode($d['reponse_ia'], JSON_UNESCAPED_UNICODE) : null,
    (int)$d['confirmee'], $d['correcteur_id'], $d['correction_active_id'], $d['assignee_le'],
    $d['echeance_le'], $d['reglement_mode'], $d['reglement_statut'], $d['reglement_reference'] ?? null,
    (int)$d['montant'], $d['periode_quota'], $d['correction_reutilisee_id'], $d['format_eleve'],
    (int)$d['admin_notifie'], $d['transcription'], $d['maj_le'], $d['id'],
  ]);
}

function correction_demande_row(PDO $pdo, string $id): ?array
{
  $stmt = $pdo->prepare('SELECT * FROM correction_demandes WHERE id = ?');
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  return $row ?: null;
}

function correction_demande_depuis_row(array $row): array
{
  $guide = $row['reponse_ia_json'] ? json_decode((string)$row['reponse_ia_json'], true) : null;
  $exercices = json_decode((string)$row['exercices_json'], true);
  return [
    'id' => $row['id'],
    'eleve_id' => $row['eleve_id'],
    'epreuve_id' => $row['epreuve_id'],
    'epreuve_titre' => $row['epreuve_titre'],
    'matiere' => $row['matiere'],
    'niveau' => $row['niveau'],
    'exercices' => is_array($exercices) ? $exercices : [],
    'exercices_signature' => $row['exercices_signature'],
    'blocage_texte' => $row['blocage_texte'],
    'audio_path' => $row['audio_path'],
    'transcription' => $row['transcription'],
    'statut' => $row['statut'],
    'origine' => $row['origine'],
    'classe_ia' => $row['classe_ia'],
    'reponse_ia' => is_array($guide) ? $guide : null,
    'confirmee' => (int)$row['confirmee'],
    'correcteur_id' => $row['correcteur_id'],
    'correction_active_id' => $row['correction_active_id'],
    'assignee_le' => $row['assignee_le'],
    'echeance_le' => $row['echeance_le'],
    'reglement_mode' => $row['reglement_mode'],
    'reglement_statut' => $row['reglement_statut'],
    'reglement_reference' => $row['reglement_reference'],
    'montant' => (int)$row['montant'],
    'periode_quota' => $row['periode_quota'],
    'correction_reutilisee_id' => $row['correction_reutilisee_id'],
    'format_eleve' => $row['format_eleve'],
    'admin_notifie' => (int)$row['admin_notifie'],
    'cree_le' => $row['cree_le'],
    'maj_le' => $row['maj_le'],
    'correction' => null,
  ];
}

function correction_charger(PDO $pdo, string $id): ?array
{
  $row = correction_demande_row($pdo, $id);
  if (!$row) {
    return null;
  }
  $demande = correction_demande_depuis_row($row);
  $correctionId = $demande['correction_active_id'];
  if ($correctionId) {
    $stmt = $pdo->prepare('SELECT * FROM correction_corrections WHERE id = ?');
    $stmt->execute([$correctionId]);
    $c = $stmt->fetch();
    if ($c) {
      $rev = $pdo->prepare("SELECT validateur_id, id AS revue_id FROM correction_revues
        WHERE correction_id = ? AND decision = 'approuvee'");
      $rev->execute([$correctionId]);
      $demande['correction'] = [
        'id' => $c['id'],
        'correcteur_id' => $c['correcteur_id'],
        'contenu' => $c['contenu'],
        'statut' => $c['statut'],
        'approbations' => $rev->fetchAll(),
      ];
    }
  }
  return $demande;
}

function correction_sauver_correction(PDO $pdo, array $demande, string $now): void
{
  $c = $demande['correction'] ?? null;
  if (!is_array($c)) {
    return;
  }
  $exists = $pdo->prepare('SELECT id FROM correction_corrections WHERE id = ?');
  $exists->execute([$c['id']]);
  if ($exists->fetch()) {
    $pdo->prepare('UPDATE correction_corrections SET contenu=?, statut=? WHERE id=?')
      ->execute([$c['contenu'], $c['statut'], $c['id']]);
    return;
  }
  $version = $pdo->prepare('SELECT COALESCE(MAX(version),0)+1 FROM correction_corrections WHERE demande_id=?');
  $version->execute([$demande['id']]);
  $pdo->prepare('INSERT INTO correction_corrections (id, demande_id, correcteur_id, contenu, version, statut, cree_le)
    VALUES (?,?,?,?,?,?,?)')->execute([
    $c['id'], $demande['id'], $c['correcteur_id'], $c['contenu'], (int)$version->fetchColumn(), $c['statut'], $now,
  ]);
}

function correction_quota_consomme(PDO $pdo, string $userId, string $periode): int
{
  $stmt = $pdo->prepare("SELECT COUNT(*) FROM correction_demandes
    WHERE eleve_id=? AND reglement_mode='quota_pro' AND periode_quota=? AND statut!='annulee'");
  $stmt->execute([$userId, $periode]);
  return (int)$stmt->fetchColumn();
}

function correction_trouver_reutilisation(PDO $pdo, string $epreuveId, string $signature): ?array
{
  $stmt = $pdo->prepare("SELECT c.id, c.correcteur_id, c.contenu, c.demande_id
    FROM correction_corrections c
    INNER JOIN correction_demandes d ON d.id = c.demande_id
    WHERE d.epreuve_id = ? AND d.exercices_signature = ? AND c.statut = 'validee'
    ORDER BY c.cree_le DESC LIMIT 1");
  $stmt->execute([$epreuveId, $signature]);
  $row = $stmt->fetch();
  return $row ?: null;
}

function correction_autres_contenus(PDO $pdo, string $signature, string $saufCorrectionId): array
{
  $stmt = $pdo->prepare("SELECT c.contenu FROM correction_corrections c
    INNER JOIN correction_demandes d ON d.id = c.demande_id
    WHERE d.exercices_signature = ? AND c.statut = 'validee' AND c.id != ?");
  $stmt->execute([$signature, $saufCorrectionId]);
  return array_column($stmt->fetchAll(), 'contenu');
}

function correction_journal(PDO $pdo, string $demandeId, string $type, ?string $acteur, $payload = null): void
{
  $pdo->prepare('INSERT INTO correction_evenements (id, demande_id, type, acteur_id, payload_json, cree_le)
    VALUES (?,?,?,?,?,?)')->execute([
    correction_uuid(),
    $demandeId,
    $type,
    $acteur,
    $payload === null ? null : json_encode($payload, JSON_UNESCAPED_UNICODE),
    date('Y-m-d H:i:s'),
  ]);
}

function correction_notifier_admins(PDO $pdo, string $titre, string $corps, string $url, ?string $demandeId = null): int
{
  if ($demandeId) {
    correction_journal($pdo, $demandeId, 'notify_admin', null, ['titre' => $titre, 'corps' => $corps]);
  }
  try {
    $ids = $pdo->query("SELECT id FROM users WHERE role IN ('admin','gestionnaire')")->fetchAll(PDO::FETCH_COLUMN);
  } catch (Throwable $e) {
    return 0;
  }
  $n = 0;
  $stmt = $pdo->prepare('INSERT INTO notification_inbox (id, user_id, rule_id, titre, corps, url, lu, created_at)
    VALUES (?,?,?,?,?,?,0,?)');
  foreach ($ids ?: [] as $uid) {
    try {
      $stmt->execute([correction_uuid(), $uid, null, $titre, $corps, $url, date('Y-m-d H:i:s')]);
      $n++;
    } catch (Throwable $e) {
      return $n;
    }
  }
  return $n;
}

function correction_livraison_inserer(PDO $pdo, string $demandeId, ?string $correctionId, string $format, string $contenu): void
{
  $pdo->prepare('INSERT INTO correction_livraisons (id, demande_id, correction_id, format, contenu, cree_le)
    VALUES (?,?,?,?,?,?)')->execute([
    correction_uuid(), $demandeId, $correctionId, $format, $contenu, date('Y-m-d H:i:s'),
  ]);
}

function correction_livraison_derniere(PDO $pdo, string $demandeId): ?array
{
  $stmt = $pdo->prepare('SELECT * FROM correction_livraisons WHERE demande_id=? ORDER BY cree_le DESC LIMIT 1');
  $stmt->execute([$demandeId]);
  $row = $stmt->fetch();
  return $row ?: null;
}

function correction_revue_inserer(PDO $pdo, array $revue): void
{
  $pdo->prepare('INSERT INTO correction_revues
    (id, correction_id, demande_id, validateur_id, decision, commentaire, divergence_signalee, divergence_note, cree_le)
    VALUES (?,?,?,?,?,?,?,?,?)')->execute([
    $revue['revue_id'], $revue['correction_id'], $revue['demande_id'], $revue['validateur_id'],
    $revue['decision'], $revue['commentaire'] ?? null, (int)($revue['divergence_signalee'] ?? 0),
    $revue['divergence_note'] ?? null, date('Y-m-d H:i:s'),
  ]);
}

function correction_fiabilite_ajouter(PDO $pdo, string $userId, int $delta): void
{
  $stmt = $pdo->prepare('SELECT fiabilite FROM correcteur_profils WHERE user_id=?');
  $stmt->execute([$userId]);
  $current = $stmt->fetchColumn();
  if ($current === false) {
    return;
  }
  $next = max(0, min(100, (int)$current + $delta));
  $pdo->prepare('UPDATE correcteur_profils SET fiabilite=?, maj_le=? WHERE user_id=?')
    ->execute([$next, date('Y-m-d H:i:s'), $userId]);
}

function correction_profil_par_user(PDO $pdo, string $userId): ?array
{
  $stmt = $pdo->prepare('SELECT * FROM correcteur_profils WHERE user_id=?');
  $stmt->execute([$userId]);
  $row = $stmt->fetch();
  if (!$row) {
    return null;
  }
  $row['matieres'] = json_decode((string)$row['matieres_json'], true) ?: [];
  $row['niveaux'] = json_decode((string)$row['niveaux_json'], true) ?: [];
  return $row;
}

function correction_charge_correcteur(PDO $pdo, string $userId): int
{
  $stmt = $pdo->prepare("SELECT COUNT(*) FROM correction_demandes
    WHERE correcteur_id=? AND statut IN ('assignee','en_revue')");
  $stmt->execute([$userId]);
  return (int)$stmt->fetchColumn();
}

function correction_profils_valides(PDO $pdo): array
{
  $rows = $pdo->query("SELECT * FROM correcteur_profils WHERE statut='valide'")->fetchAll();
  foreach ($rows as &$row) {
    $row['matieres'] = json_decode((string)$row['matieres_json'], true) ?: [];
    $row['niveaux'] = json_decode((string)$row['niveaux_json'], true) ?: [];
  }
  return $rows;
}

function correction_demandes_echues(PDO $pdo, string $now): array
{
  $stmt = $pdo->prepare("SELECT id FROM correction_demandes
    WHERE statut IN ('assignee','en_revue') AND echeance_le IS NOT NULL AND echeance_le <= ?");
  $stmt->execute([$now]);
  return array_column($stmt->fetchAll(), 'id');
}

function correction_notifier_user(PDO $pdo, string $userId, string $titre, string $corps, string $url): void
{
  try {
    $pdo->prepare('INSERT INTO notification_inbox (id, user_id, rule_id, titre, corps, url, lu, created_at)
      VALUES (?,?,?,?,?,?,0,?)')->execute([
      correction_uuid(), $userId, null, $titre, $corps, $url, date('Y-m-d H:i:s'),
    ]);
  } catch (Throwable $e) {
    // Boîte absente : le journal métier suffit.
  }
}

function correction_enregistrer_signalement_soumission(string $id, array $scan, bool $atteste): void
{
  if (!function_exists('db')) {
    return;
  }
  try {
    db()->prepare('UPDATE soumissions SET attestation_enonce=?, signalement_corrige=?, signalement_motif=? WHERE id=?')
      ->execute([$atteste ? 1 : 0, !empty($scan['signale']) ? 1 : 0, $scan['motif'] ?? null, $id]);
  } catch (Throwable $e) {
    // Colonnes absentes tant que la migration n'est pas appliquée.
  }
}
