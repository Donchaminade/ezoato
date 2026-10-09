<?php
/**
 * Orchestration : droits, triage, persistance, effets (paiement, notification, livraison).
 */
declare(strict_types=1);

function correction_service_erreur(string $message, int $code = 400): array
{
  return ['ok' => false, 'error' => $message, 'code' => $code, 'demande' => null];
}

function correction_service_ok(array $vue, array $extra = []): array
{
  return array_merge(['ok' => true, 'error' => null, 'code' => 200, 'demande' => $vue], $extra);
}

function correction_contexte_reglages(PDO $pdo, array $ctx): array
{
  return $ctx['settings'] ?? correction_reglages_lire($pdo);
}

function correction_service_creer(PDO $pdo, array $input, array $ctx): array
{
  $settings = correction_contexte_reglages($pdo, $ctx);
  $userId = (string)($ctx['user']['id'] ?? '');
  if ($userId === '') {
    return correction_service_erreur('Utilisateur requis', 401);
  }
  $ep = $input['epreuve'] ?? null;
  if (!is_array($ep) || empty($ep['id'])) {
    return correction_service_erreur('Épreuve du catalogue requise');
  }
  if (($ep['type'] ?? '') === 'corrige') {
    return correction_service_erreur('Une demande porte sur un énoncé, pas sur un corrigé publié');
  }
  $exercices = [];
  foreach ($input['exercices'] ?? [] as $exercice) {
    $item = trim((string)$exercice);
    if ($item !== '') {
      $exercices[] = $item;
    }
  }
  if (!$exercices) {
    return correction_service_erreur('Indique les exercices concernés');
  }
  $now = (string)($ctx['now'] ?? date('Y-m-d H:i:s'));
  $texte = trim((string)($input['blocage_texte'] ?? ''));
  $audioPath = $input['audio_path'] ?? null;
  $transcription = null;
  if ($audioPath) {
    try {
      $transcription = correction_transcrire((string)$audioPath, $ctx);
    } catch (Throwable $e) {
      $transcription = null;
    }
  }
  if ($texte === '' && !$audioPath) {
    return correction_service_erreur('Explique le blocage par écrit ou joins un audio');
  }
  if (mb_strlen($texte) > 0 && mb_strlen($texte) < 8 && !$audioPath) {
    return correction_service_erreur('Précise un peu plus ce qui te bloque');
  }

  $isPro = !empty($ctx['is_pro']);
  $periode = (string)($ctx['periode'] ?? '');
  $quota = (int)$settings['quota_pro'];
  $mode = 'unitaire';
  $regStatut = 'en_attente';
  $statut = 'en_attente_reglement';
  $montant = (int)$settings['prix_unitaire'];
  if ($isPro && $periode !== '' && correction_quota_consomme($pdo, $userId, $periode) < $quota) {
    $mode = 'quota_pro';
    $regStatut = 'confirme';
    $statut = 'recue';
    $montant = 0;
  }

  $demande = [
    'id' => correction_uuid_valide($input['id'] ?? null),
    'eleve_id' => $userId,
    'epreuve_id' => (string)$ep['id'],
    'epreuve_titre' => (string)($ep['titre'] ?? ''),
    'matiere' => (string)($ep['matiere'] ?? ''),
    'niveau' => (string)($ep['niveau'] ?? ''),
    'exercices' => $exercices,
    'exercices_signature' => correction_signature_exercices($exercices),
    'blocage_texte' => $texte,
    'audio_path' => $audioPath,
    'transcription' => $transcription,
    'statut' => $statut,
    'origine' => 'nouvelle',
    'classe_ia' => null,
    'reponse_ia' => null,
    'confirmee' => 0,
    'correcteur_id' => null,
    'correction_active_id' => null,
    'assignee_le' => null,
    'echeance_le' => null,
    'reglement_mode' => $mode,
    'reglement_statut' => $regStatut,
    'reglement_reference' => null,
    'montant' => $montant,
    'periode_quota' => $mode === 'quota_pro' ? $periode : null,
    'correction_reutilisee_id' => null,
    'format_eleve' => $settings['format_eleve'],
    'admin_notifie' => 0,
    'cree_le' => $now,
    'maj_le' => $now,
    'correction' => null,
  ];
  correction_demande_inserer($pdo, $demande);
  correction_journal($pdo, $demande['id'], 'creee', $userId, [
    'mode' => $mode,
    'statut' => $statut,
  ]);

  if ($statut === 'en_attente_reglement') {
    correction_notifier_admins(
      $pdo,
      'Demande de correction en attente de règlement',
      $demande['epreuve_titre'] . ' — règlement unitaire en attente.',
      '/admin/corrections',
      $demande['id']
    );
    return correction_service_ok(correction_vue($pdo, $demande, $ctx['user']));
  }
  return correction_service_lancer($pdo, $demande, $settings, $ctx);
}

function correction_uuid_valide(mixed $id): string
{
  $id = (string)$id;
  if (preg_match('/^[a-f0-9-]{36}$/', $id)) {
    return $id;
  }
  return correction_uuid();
}

function correction_service_lancer(PDO $pdo, array $demande, array $settings, array $ctx): array
{
  $payload = ['format_eleve' => $settings['format_eleve']];
  $reuse = null;
  if (!empty($settings['reutilisation_active'])) {
    $reuse = correction_trouver_reutilisation($pdo, $demande['epreuve_id'], $demande['exercices_signature']);
  }
  if ($reuse && (string)$reuse['demande_id'] !== (string)$demande['id']) {
    $payload['classe'] = 'reutilisation';
    $payload['correction_id'] = $reuse['id'];
    $payload['correcteur_id'] = $reuse['correcteur_id'];
    $payload['contenu'] = $reuse['contenu'];
    $payload['montant_reutilisation'] = (int)$settings['remuneration_reutilisation'];
  } else {
    $blocage = trim((string)$demande['blocage_texte'] . "\n" . (string)$demande['transcription']);
    if ($blocage === '') {
      $guide = correction_assainir_guide(['classe' => 'humaine', 'explications' => '', 'exemples' => [], 'qcm' => []]);
    } else {
      $guide = correction_guider([
        'blocage' => $blocage,
        'matiere' => $demande['matiere'],
        'niveau' => $demande['niveau'],
        'exercices' => $demande['exercices'],
        'epreuveTitre' => $demande['epreuve_titre'],
      ], $ctx);
    }
    $payload['classe'] = $guide['classe'];
    $payload['guide'] = $guide;
  }
  return correction_service_appliquer($pdo, $demande['id'], 'triage', ['id' => null, 'role' => 'systeme'], $payload, $ctx);
}

function correction_service_appliquer(PDO $pdo, string $id, string $event, array $actor, array $payload, array $ctx): array
{
  $demande = correction_charger($pdo, $id);
  if (!$demande) {
    return correction_service_erreur('Demande introuvable', 404);
  }
  $settings = correction_contexte_reglages($pdo, $ctx);
  $payload['now'] = $payload['now'] ?? ($ctx['now'] ?? date('Y-m-d H:i:s'));
  $payload['delai_heures'] = $payload['delai_heures'] ?? $settings['delai_reassignation_heures'];
  $payload['nombre_validateurs'] = $payload['nombre_validateurs'] ?? $settings['nombre_validateurs'];
  $payload['format_eleve'] = $payload['format_eleve'] ?? $demande['format_eleve'] ?? $settings['format_eleve'];
  $payload['remuneration_correcteur'] = $payload['remuneration_correcteur'] ?? $settings['remuneration_correcteur'];
  $payload['forfait_validateur'] = $payload['forfait_validateur'] ?? $settings['forfait_validateur'];
  $payload['montant_reutilisation'] = $payload['montant_reutilisation'] ?? $settings['remuneration_reutilisation'];

  if ($event === 'revue' && !empty($demande['correction']['id'])) {
    $div = correction_detecter_divergence(
      (string)$demande['correction']['contenu'],
      correction_autres_contenus($pdo, $demande['exercices_signature'], (string)$demande['correction']['id'])
    );
    $payload['divergence_signalee'] = $div['signalee'];
    $payload['divergence_note'] = $div['note'];
  }

  $result = correction_transition($demande, $event, $actor, $payload);
  if (!$result['ok']) {
    return correction_service_erreur($result['error'] ?? 'Transition refusée', 409);
  }
  $avantSuite = $result['demande'];
  $demande = $avantSuite;
  $effects = $result['effects'];

  if ($event === 'revue' && ($demande['statut'] ?? '') === 'rejetee') {
    $suite = (string)($payload['suite'] ?? 'renvoyer');
    $suiteEvent = $suite === 'reassigner' ? 'reassigner' : 'renvoyer_correcteur';
    $suitePayload = $payload;
    if ($suiteEvent === 'reassigner') {
      $suitePayload['correcteur_id'] = '';
    }
    $suiteResult = correction_transition($demande, $suiteEvent, $actor, $suitePayload);
    if ($suiteResult['ok']) {
      $demande = $suiteResult['demande'];
      $effects = array_merge($effects, $suiteResult['effects']);
    }
  }

  $now = (string)$payload['now'];
  $demande['maj_le'] = $now;
  $avantSuite['maj_le'] = $now;
  $own = !$pdo->inTransaction();
  if ($own) {
    $pdo->beginTransaction();
  }
  try {
    correction_sauver_correction($pdo, $avantSuite, $now);
    correction_sauver_correction($pdo, $demande, $now);
    correction_appliquer_effets($pdo, $demande, $effects, $ctx, $actor);
    correction_demande_maj($pdo, $demande);
    if ($own) {
      $pdo->commit();
    }
  } catch (Throwable $e) {
    if ($own && $pdo->inTransaction()) {
      $pdo->rollBack();
    }
    throw $e;
  }
  $frais = correction_charger($pdo, $demande['id']) ?? $demande;
  return correction_service_ok(correction_vue($pdo, $frais, $ctx['user'] ?? $actor));
}

function correction_appliquer_effets(PDO $pdo, array $demande, array $effects, array $ctx, array $actor): void
{
  $credit = $ctx['credit'] ?? 'correction_credit_portefeuille';
  if (!is_callable($credit)) {
    $credit = 'correction_credit_portefeuille';
  }
  foreach ($effects as $effect) {
    $type = $effect['type'] ?? '';
    if ($type === 'journal') {
      correction_journal($pdo, $demande['id'], (string)$effect['message'], $actor['id'] ?? null, $effect);
      continue;
    }
    if ($type === 'notify_admin') {
      $raison = (string)($effect['reason'] ?? 'suivi');
      correction_notifier_admins(
        $pdo,
        'Demande de correction — ' . correction_libelle_notification($raison),
        ($demande['epreuve_titre'] ?: 'Épreuve') . ' · ' . $raison,
        '/admin/corrections',
        $demande['id']
      );
      continue;
    }
    if ($type === 'enregistrer_revue') {
      $effect['demande_id'] = $demande['id'];
      correction_revue_inserer($pdo, $effect);
      continue;
    }
    if ($type === 'fiabilite' && !empty($effect['user_id'])) {
      correction_fiabilite_ajouter($pdo, (string)$effect['user_id'], (int)$effect['delta']);
      continue;
    }
    if ($type === 'livrer') {
      $format = (string)($effect['format'] ?? $demande['format_eleve'] ?? 'pedagogique');
      $texte = correction_formater_livraison((string)($effect['contenu'] ?? ''), $format);
      $correctionId = $demande['correction']['id'] ?? $demande['correction_reutilisee_id'] ?? null;
      correction_livraison_inserer($pdo, $demande['id'], $correctionId, $format, $texte);
      continue;
    }
    if ($type === 'payer_correcteur') {
      correction_verser_idempotent($pdo, [
        'idempotency_key' => 'correcteur:' . ($effect['correction_id'] ?? ''),
        'user_id' => $effect['correcteur_id'] ?? '',
        'montant' => (int)($effect['montant'] ?? 0),
        'role_versement' => 'correcteur',
        'demande_id' => $demande['id'],
        'reference_metier' => $effect['correction_id'] ?? null,
        'description' => 'Correction validée',
      ], $credit);
      continue;
    }
    if ($type === 'payer_validateur') {
      correction_verser_idempotent($pdo, [
        'idempotency_key' => 'validateur:' . ($effect['revue_id'] ?? ''),
        'user_id' => $effect['validateur_id'] ?? '',
        'montant' => (int)($effect['montant'] ?? 0),
        'role_versement' => 'validateur',
        'demande_id' => $demande['id'],
        'reference_metier' => $effect['revue_id'] ?? null,
        'description' => 'Revue de correction',
      ], $credit);
      continue;
    }
    if ($type === 'payer_reutilisation') {
      correction_verser_idempotent($pdo, [
        'idempotency_key' => 'reutilisation:' . $demande['id'] . ':' . ($effect['correction_id'] ?? ''),
        'user_id' => $effect['correcteur_id'] ?? '',
        'montant' => (int)($effect['montant'] ?? 0),
        'role_versement' => 'reutilisation',
        'demande_id' => $demande['id'],
        'reference_metier' => $effect['correction_id'] ?? null,
        'description' => 'Réutilisation d\'une correction validée',
      ], $credit);
    }
  }
}

function correction_libelle_notification(string $raison): string
{
  return match ($raison) {
    'triage' => 'triage, y compris si l\'IA traite seule',
    'confirmee' => 'confirmée par l\'administration',
    'assignee' => 'assignée à un correcteur',
    'en_revue' => 'correction déposée, en revue',
    'revue_rejetee' => 'revue rejetée',
    'livree' => 'livrée à l\'élève',
    'reassignee' => 'réassignée',
    'delai_depasse' => 'délai dépassé, à réassigner',
    default => $raison,
  };
}

function correction_service_reassigner_echues(PDO $pdo, array $ctx): array
{
  $now = (string)($ctx['now'] ?? date('Y-m-d H:i:s'));
  $ids = correction_demandes_echues($pdo, $now);
  $fait = [];
  foreach ($ids as $id) {
    $res = correction_service_appliquer($pdo, $id, 'timeout', ['id' => null, 'role' => 'systeme'], ['now' => $now], $ctx);
    if ($res['ok']) {
      $fait[] = $id;
    }
  }
  return ['ok' => true, 'reassignees' => $fait];
}

function correction_suggerer_correcteurs(PDO $pdo, string $matiere, string $niveau, array $exclure = []): array
{
  $out = [];
  foreach (correction_profils_valides($pdo) as $profil) {
    if (in_array($profil['user_id'], $exclure, true)) {
      continue;
    }
    $charge = correction_charge_correcteur($pdo, $profil['user_id']);
    $out[] = [
      'userId' => $profil['user_id'],
      'qualite' => $profil['qualite'],
      'fiabilite' => (int)$profil['fiabilite'],
      'matieres' => $profil['matieres'],
      'niveaux' => $profil['niveaux'],
      'charge' => $charge,
      'score' => correction_score_profil($profil, $matiere, $niveau, $charge),
    ];
  }
  usort($out, fn($a, $b) => $b['score'] <=> $a['score']);
  return $out;
}

function correction_service_candidature(PDO $pdo, array $input, array $ctx): array
{
  $userId = (string)($ctx['user']['id'] ?? '');
  $qualite = (string)($input['qualite'] ?? '');
  if (!in_array($qualite, ['enseignant', 'repetiteur'], true)) {
    return correction_service_erreur('Seuls les enseignants et les répétiteurs peuvent candidater');
  }
  $matieres = array_values(array_filter(array_map('strval', $input['matieres'] ?? [])));
  $niveaux = array_values(array_filter(array_map('strval', $input['niveaux'] ?? [])));
  if (!$matieres || !$niveaux) {
    return correction_service_erreur('Déclare au moins une matière et un niveau');
  }
  $piece = (string)($input['piece_identite_path'] ?? '');
  $preuve = (string)($input['preuve_enseignement_path'] ?? '');
  if ($piece === '' || $preuve === '') {
    return correction_service_erreur('Deux justificatifs sont obligatoires : pièce d\'identité et preuve d\'enseignement');
  }
  $existant = correction_profil_par_user($pdo, $userId);
  if ($existant && $existant['statut'] === 'valide') {
    return correction_service_erreur('Profil correcteur déjà validé', 409);
  }
  if ($existant && $existant['statut'] === 'en_attente') {
    return correction_service_erreur('Une candidature est déjà en attente', 409);
  }
  $now = (string)($ctx['now'] ?? date('Y-m-d H:i:s'));
  $id = $existant['id'] ?? correction_uuid();
  if ($existant) {
    $pdo->prepare('UPDATE correcteur_profils SET qualite=?, statut=\'en_attente\', matieres_json=?, niveaux_json=?,
      piece_identite_path=?, preuve_enseignement_path=?, motif=NULL, maj_le=? WHERE id=?')->execute([
      $qualite, json_encode($matieres, JSON_UNESCAPED_UNICODE), json_encode($niveaux, JSON_UNESCAPED_UNICODE),
      $piece, $preuve, $now, $id,
    ]);
  } else {
    $pdo->prepare('INSERT INTO correcteur_profils
      (id, user_id, qualite, statut, matieres_json, niveaux_json, fiabilite, piece_identite_path, preuve_enseignement_path, cree_le, maj_le)
      VALUES (?,?,?,?,?,?,50,?,?,?,?)')->execute([
      $id, $userId, $qualite, 'en_attente',
      json_encode($matieres, JSON_UNESCAPED_UNICODE), json_encode($niveaux, JSON_UNESCAPED_UNICODE),
      $piece, $preuve, $now, $now,
    ]);
  }
  correction_notifier_admins(
    $pdo,
    'Candidature correcteur',
    'Nouvelle candidature (' . $qualite . ') à valider.',
    '/admin/corrections',
    null
  );
  return ['ok' => true, 'error' => null, 'code' => 200, 'profil' => correction_mapper_profil(correction_profil_par_user($pdo, $userId))];
}

function correction_acteur_peut_valider(PDO $pdo, array $actor): bool
{
  $profil = correction_profil_par_user($pdo, (string)($actor['id'] ?? ''));
  return $profil && $profil['statut'] === 'valide';
}

function correction_vue(PDO $pdo, array $demande, array $viewer): array
{
  $role = (string)($viewer['role'] ?? 'utilisateur');
  $viewerId = (string)($viewer['id'] ?? '');
  $admin = in_array($role, ['admin', 'gestionnaire'], true);
  $eleve = $viewerId !== '' && $viewerId === (string)$demande['eleve_id'];
  $correcteur = $viewerId !== '' && $viewerId === (string)($demande['correcteur_id'] ?? '');
  $livraison = correction_livraison_derniere($pdo, $demande['id']);
  $base = [
    'id' => $demande['id'],
    'epreuveId' => $demande['epreuve_id'],
    'epreuveTitre' => $demande['epreuve_titre'],
    'matiere' => $demande['matiere'],
    'niveau' => $demande['niveau'],
    'exercices' => $demande['exercices'],
    'blocageTexte' => $demande['blocage_texte'],
    'transcription' => $demande['transcription'],
    'aUnAudio' => !empty($demande['audio_path']),
    'statut' => $demande['statut'],
    'origine' => $demande['origine'],
    'classeIa' => $demande['classe_ia'],
    'reglementMode' => $demande['reglement_mode'],
    'reglementStatut' => $demande['reglement_statut'],
    'montant' => (int)$demande['montant'],
    'formatEleve' => $demande['format_eleve'],
    'echeanceLe' => $demande['echeance_le'],
    'creeLe' => $demande['cree_le'],
    'majLe' => $demande['maj_le'],
    'adminNotifie' => (bool)$demande['admin_notifie'],
  ];
  if ($demande['statut'] === 'traitee_ia') {
    $base['guide'] = correction_guide_public($demande['reponse_ia']);
  }
  if ($livraison && ($eleve || $admin || $correcteur)) {
    $base['livraison'] = [
      'format' => $livraison['format'],
      'contenu' => $livraison['contenu'],
    ];
  }
  if ($admin) {
    $base['correcteurId'] = $demande['correcteur_id'];
    $base['eleveId'] = $demande['eleve_id'];
    $base['confirmee'] = (bool)$demande['confirmee'];
    $base['guideInterne'] = $demande['reponse_ia'];
    if (!empty($demande['correction'])) {
      $base['correction'] = [
        'id' => $demande['correction']['id'],
        'correcteurId' => $demande['correction']['correcteur_id'],
        'contenu' => $demande['correction']['contenu'],
        'statut' => $demande['correction']['statut'],
      ];
    }
  } elseif ($correcteur && !empty($demande['correction']) && $demande['statut'] !== 'livree') {
    $base['correction'] = [
      'id' => $demande['correction']['id'],
      'statut' => $demande['correction']['statut'],
    ];
  }
  return $base;
}

function correction_mapper_profil(?array $row): ?array
{
  if (!$row) {
    return null;
  }
  return [
    'id' => $row['id'],
    'userId' => $row['user_id'],
    'qualite' => $row['qualite'],
    'statut' => $row['statut'],
    'matieres' => $row['matieres'],
    'niveaux' => $row['niveaux'],
    'fiabilite' => (int)$row['fiabilite'],
    'motif' => $row['motif'] ?? null,
  ];
}

function correction_service_confirmer_reglement(PDO $pdo, string $id, array $actor, array $ctx, ?string $reference): array
{
  $systeme = !empty($ctx['reglement_systeme']);
  if (!$systeme && !correction_acteur_admin($actor)) {
    return correction_service_erreur('Règlement réservé à l\'administration ou au module de paiement', 403);
  }
  $applied = correction_service_appliquer(
    $pdo,
    $id,
    'reglement_confirme',
    $systeme ? ['id' => null, 'role' => 'systeme'] : $actor,
    ['reference' => $reference],
    $ctx
  );
  if (!$applied['ok']) {
    return $applied;
  }
  $settings = correction_contexte_reglages($pdo, $ctx);
  $demande = correction_charger($pdo, $id);
  if (!$demande) {
    return correction_service_erreur('Demande introuvable', 404);
  }
  return correction_service_lancer($pdo, $demande, $settings, $ctx);
}

function correction_service_assigner(PDO $pdo, string $id, array $actor, string $correcteurId, array $ctx): array
{
  $profil = correction_profil_par_user($pdo, $correcteurId);
  if (!$profil || $profil['statut'] !== 'valide') {
    return correction_service_erreur('Ce correcteur n\'est pas validé');
  }
  return correction_service_appliquer($pdo, $id, 'assigner', $actor, ['correcteur_id' => $correcteurId], $ctx);
}

function correction_lister_ids(PDO $pdo, string $sql, array $params): array
{
  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  return array_column($stmt->fetchAll(), 'id');
}
