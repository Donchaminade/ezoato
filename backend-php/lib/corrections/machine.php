<?php
/**
 * Machine à états des demandes de correction.
 * Pure : aucun accès base, aucun paiement. Les effets sont déclarés, pas exécutés.
 */
declare(strict_types=1);

function correction_statuts(): array
{
  return [
    'en_attente_reglement',
    'recue',
    'traitee_ia',
    'en_attente_admin',
    'confirmee_admin',
    'assignee',
    'en_revue',
    'rejetee',
    'livree',
    'annulee',
  ];
}

function correction_transition_echec(array $demande, string $message): array
{
  return ['ok' => false, 'error' => $message, 'demande' => $demande, 'effects' => []];
}

/**
 * @param array $actor id, role
 * @param array $payload données de l'événement
 * @return array{ok:bool,error:?string,demande:array,effects:list<array>}
 */
function correction_transition(array $demande, string $event, array $actor, array $payload = []): array
{
  $from = (string)($demande['statut'] ?? '');
  $effects = [];
  $next = $demande;

  switch ($event) {
    case 'reglement_confirme':
      if ($from !== 'en_attente_reglement') {
        return correction_transition_echec($demande, 'Règlement inattendu dans cet état');
      }
      $next['statut'] = 'recue';
      $next['reglement_statut'] = 'confirme';
      $next['reglement_reference'] = $payload['reference'] ?? ($demande['reglement_reference'] ?? null);
      $effects[] = ['type' => 'journal', 'message' => 'reglement_confirme'];
      break;

    case 'triage':
      if (!in_array($from, ['recue', 'confirmee_admin'], true)) {
        return correction_transition_echec($demande, 'Triage impossible dans cet état');
      }
      $classe = (string)($payload['classe'] ?? 'humaine');
      if (!in_array($classe, ['comprehension', 'humaine', 'reutilisation'], true)) {
        $classe = 'humaine';
      }
      $next['classe_ia'] = $classe;
      $next['admin_notifie'] = 1;
      $effects[] = [
        'type' => 'notify_admin',
        'reason' => 'triage',
        'classe' => $classe,
      ];
      if ($classe === 'comprehension') {
        $next['statut'] = 'traitee_ia';
        $next['reponse_ia'] = $payload['guide'] ?? null;
        $next['correcteur_id'] = null;
        $effects[] = ['type' => 'journal', 'message' => 'traitee_ia'];
      } elseif ($classe === 'reutilisation') {
        $next['statut'] = 'livree';
        $next['origine'] = 'reutilisation';
        $next['correction_reutilisee_id'] = $payload['correction_id'] ?? null;
        $effects[] = [
          'type' => 'payer_reutilisation',
          'correction_id' => $payload['correction_id'] ?? null,
          'correcteur_id' => $payload['correcteur_id'] ?? null,
          'montant' => $payload['montant_reutilisation'] ?? null,
        ];
        $effects[] = [
          'type' => 'livrer',
          'contenu' => (string)($payload['contenu'] ?? ''),
          'format' => $payload['format_eleve'] ?? ($demande['format_eleve'] ?? 'pedagogique'),
        ];
        $effects[] = ['type' => 'journal', 'message' => 'reutilisation'];
      } else {
        $next['statut'] = 'en_attente_admin';
        $next['confirmee'] = 0;
        $next['reponse_ia'] = $payload['guide'] ?? null;
        $effects[] = ['type' => 'journal', 'message' => 'escalade_admin'];
      }
      break;

    case 'confirmer':
      if ($from !== 'en_attente_admin') {
        return correction_transition_echec($demande, 'Confirmation impossible dans cet état');
      }
      if (!correction_acteur_admin($actor)) {
        return correction_transition_echec($demande, 'Réservé à l\'administration');
      }
      $next['statut'] = 'confirmee_admin';
      $next['confirmee'] = 1;
      $effects[] = ['type' => 'notify_admin', 'reason' => 'confirmee'];
      $effects[] = ['type' => 'journal', 'message' => 'confirmee_admin'];
      break;

    case 'renvoyer_ia':
      if ($from !== 'confirmee_admin') {
        return correction_transition_echec($demande, 'Renvoi à l\'IA impossible dans cet état');
      }
      if (!correction_acteur_admin($actor)) {
        return correction_transition_echec($demande, 'Réservé à l\'administration');
      }
      $copy = $demande;
      $copy['statut'] = 'recue';
      return correction_transition($copy, 'triage', ['id' => null, 'role' => 'systeme'], $payload);

    case 'assigner':
      if ($from === 'en_attente_admin') {
        return correction_transition_echec($demande, 'Confirme la demande avant de l\'assigner');
      }
      if (!in_array($from, ['confirmee_admin', 'rejetee'], true)) {
        return correction_transition_echec($demande, 'Assignation impossible dans cet état');
      }
      if (!correction_acteur_admin($actor)) {
        return correction_transition_echec($demande, 'Réservé à l\'administration');
      }
      $cid = (string)($payload['correcteur_id'] ?? '');
      if ($cid === '' || $cid === (string)($demande['eleve_id'] ?? '')) {
        return correction_transition_echec($demande, 'Correcteur invalide');
      }
      $now = (string)($payload['now'] ?? date('Y-m-d H:i:s'));
      $heures = max(1, (int)($payload['delai_heures'] ?? 48));
      $next['statut'] = 'assignee';
      $next['correcteur_id'] = $cid;
      $next['assignee_le'] = $now;
      $next['echeance_le'] = correction_ajouter_heures($now, $heures);
      $next['correction'] = null;
      $next['correction_active_id'] = null;
      $effects[] = ['type' => 'journal', 'message' => 'assignee'];
      $effects[] = ['type' => 'notify_admin', 'reason' => 'assignee'];
      break;

    case 'soumettre_correction':
      if ($from !== 'assignee') {
        return correction_transition_echec($demande, 'Dépôt de correction impossible dans cet état');
      }
      if ((string)($actor['id'] ?? '') !== (string)($demande['correcteur_id'] ?? '')) {
        return correction_transition_echec($demande, 'Seul le correcteur assigné peut déposer');
      }
      $contenu = trim((string)($payload['contenu'] ?? ''));
      if (mb_strlen($contenu) < 20) {
        return correction_transition_echec($demande, 'Correction trop courte');
      }
      $cid = (string)($payload['correction_id'] ?? '');
      if ($cid === '') {
        return correction_transition_echec($demande, 'Identifiant de correction manquant');
      }
      $next['statut'] = 'en_revue';
      $next['correction_active_id'] = $cid;
      $next['correction'] = [
        'id' => $cid,
        'correcteur_id' => (string)$actor['id'],
        'contenu' => $contenu,
        'statut' => 'soumise',
        'approbations' => [],
      ];
      $effects[] = ['type' => 'journal', 'message' => 'en_revue'];
      $effects[] = ['type' => 'notify_admin', 'reason' => 'en_revue'];
      break;

    case 'revue':
      if ($from !== 'en_revue') {
        return correction_transition_echec($demande, 'Revue impossible dans cet état');
      }
      $correction = $demande['correction'] ?? null;
      if (!is_array($correction)) {
        return correction_transition_echec($demande, 'Aucune correction à relire');
      }
      $vid = (string)($actor['id'] ?? '');
      if ($vid === '') {
        return correction_transition_echec($demande, 'Validateur requis');
      }
      if ($vid === (string)($correction['correcteur_id'] ?? '')) {
        return correction_transition_echec($demande, 'Un correcteur ne peut pas valider sa propre correction');
      }
      if ($vid === (string)($demande['eleve_id'] ?? '')) {
        return correction_transition_echec($demande, 'Le demandeur ne peut pas valider');
      }
      $approbations = is_array($correction['approbations'] ?? null) ? $correction['approbations'] : [];
      foreach ($approbations as $a) {
        if ((string)($a['validateur_id'] ?? '') === $vid) {
          return correction_transition_echec($demande, 'Revue déjà enregistrée');
        }
      }
      $decision = (string)($payload['decision'] ?? '');
      if (!in_array($decision, ['approuvee', 'rejetee'], true)) {
        return correction_transition_echec($demande, 'Décision invalide');
      }
      $revueId = (string)($payload['revue_id'] ?? '');
      if ($revueId === '') {
        return correction_transition_echec($demande, 'Identifiant de revue manquant');
      }
      $effects[] = [
        'type' => 'enregistrer_revue',
        'revue_id' => $revueId,
        'correction_id' => $correction['id'],
        'validateur_id' => $vid,
        'decision' => $decision,
        'commentaire' => (string)($payload['commentaire'] ?? ''),
        'divergence_signalee' => !empty($payload['divergence_signalee']) ? 1 : 0,
        'divergence_note' => $payload['divergence_note'] ?? null,
      ];
      $effects[] = [
        'type' => 'payer_validateur',
        'revue_id' => $revueId,
        'validateur_id' => $vid,
        'montant' => $payload['forfait_validateur'] ?? null,
      ];
      $effects[] = ['type' => 'journal', 'message' => 'revue_' . $decision];
      if ($decision === 'rejetee') {
        $correction['statut'] = 'rejetee';
        $next['correction'] = $correction;
        $next['statut'] = 'rejetee';
        $effects[] = ['type' => 'fiabilite', 'user_id' => $correction['correcteur_id'], 'delta' => -8];
        $effects[] = ['type' => 'notify_admin', 'reason' => 'revue_rejetee'];
        break;
      }
      $approbations[] = ['validateur_id' => $vid, 'revue_id' => $revueId];
      $correction['approbations'] = $approbations;
      $n = max(1, (int)($payload['nombre_validateurs'] ?? 1));
      if (count($approbations) >= $n) {
        $correction['statut'] = 'validee';
        $next['correction'] = $correction;
        $next['statut'] = 'livree';
        $effects[] = [
          'type' => 'payer_correcteur',
          'correction_id' => $correction['id'],
          'correcteur_id' => $correction['correcteur_id'],
          'montant' => $payload['remuneration_correcteur'] ?? null,
        ];
        $effects[] = ['type' => 'fiabilite', 'user_id' => $correction['correcteur_id'], 'delta' => 5];
        $effects[] = [
          'type' => 'livrer',
          'contenu' => (string)$correction['contenu'],
          'format' => $payload['format_eleve'] ?? ($demande['format_eleve'] ?? 'pedagogique'),
        ];
        $effects[] = ['type' => 'notify_admin', 'reason' => 'livree'];
      } else {
        $next['correction'] = $correction;
        $next['statut'] = 'en_revue';
      }
      break;

    case 'renvoyer_correcteur':
      if ($from !== 'rejetee') {
        return correction_transition_echec($demande, 'Renvoi au correcteur impossible');
      }
      if (empty($demande['correcteur_id'])) {
        return correction_transition_echec($demande, 'Aucun correcteur à qui renvoyer');
      }
      $now = (string)($payload['now'] ?? date('Y-m-d H:i:s'));
      $heures = max(1, (int)($payload['delai_heures'] ?? 48));
      $next['statut'] = 'assignee';
      $next['assignee_le'] = $now;
      $next['echeance_le'] = correction_ajouter_heures($now, $heures);
      $next['correction'] = null;
      $next['correction_active_id'] = null;
      $effects[] = ['type' => 'journal', 'message' => 'renvoye_correcteur'];
      break;

    case 'reassigner':
      if (!in_array($from, ['rejetee', 'assignee', 'en_revue', 'confirmee_admin', 'en_attente_admin'], true)) {
        return correction_transition_echec($demande, 'Réassignation impossible dans cet état');
      }
      $cid = (string)($payload['correcteur_id'] ?? '');
      $now = (string)($payload['now'] ?? date('Y-m-d H:i:s'));
      $heures = max(1, (int)($payload['delai_heures'] ?? 48));
      $next['correction'] = null;
      $next['correction_active_id'] = null;
      if ($cid === '') {
        $next['statut'] = 'en_attente_admin';
        $next['correcteur_id'] = null;
        $next['confirmee'] = 0;
        $next['echeance_le'] = null;
      } else {
        if ($cid === (string)($demande['eleve_id'] ?? '')) {
          return correction_transition_echec($demande, 'Correcteur invalide');
        }
        $next['statut'] = 'assignee';
        $next['correcteur_id'] = $cid;
        $next['assignee_le'] = $now;
        $next['echeance_le'] = correction_ajouter_heures($now, $heures);
        $next['confirmee'] = 1;
      }
      $effects[] = ['type' => 'notify_admin', 'reason' => 'reassignee'];
      $effects[] = ['type' => 'journal', 'message' => 'reassignee'];
      break;

    case 'timeout':
      if (!in_array($from, ['assignee', 'en_revue'], true)) {
        return correction_transition_echec($demande, 'Pas d\'échéance sur cette demande');
      }
      $echeance = strtotime((string)($demande['echeance_le'] ?? ''));
      $nowTs = strtotime((string)($payload['now'] ?? 'now'));
      if ($echeance === false || $nowTs === false || $nowTs < $echeance) {
        return correction_transition_echec($demande, 'Délai non échu');
      }
      $next['statut'] = 'en_attente_admin';
      $next['correcteur_id'] = null;
      $next['confirmee'] = 0;
      $next['correction'] = null;
      $next['correction_active_id'] = null;
      $next['echeance_le'] = null;
      $effects[] = ['type' => 'notify_admin', 'reason' => 'delai_depasse'];
      $effects[] = ['type' => 'journal', 'message' => 'reassignee_delai'];
      break;

    case 'annuler':
      if (in_array($from, ['livree', 'annulee', 'traitee_ia'], true)) {
        return correction_transition_echec($demande, 'Annulation impossible');
      }
      $role = (string)($actor['role'] ?? '');
      $isOwner = (string)($actor['id'] ?? '') === (string)($demande['eleve_id'] ?? '');
      if (!correction_acteur_admin($actor) && !$isOwner) {
        return correction_transition_echec($demande, 'Annulation refusée');
      }
      if ($isOwner && !$role) {
        $role = 'utilisateur';
      }
      $next['statut'] = 'annulee';
      $effects[] = ['type' => 'journal', 'message' => 'annulee'];
      break;

    default:
      return correction_transition_echec($demande, 'Événement inconnu');
  }

  return ['ok' => true, 'error' => null, 'demande' => $next, 'effects' => $effects];
}

function correction_acteur_admin(array $actor): bool
{
  return in_array((string)($actor['role'] ?? ''), ['admin', 'gestionnaire'], true);
}

function correction_ajouter_heures(string $now, int $heures): string
{
  $dt = new DateTimeImmutable($now);
  return $dt->modify('+' . $heures . ' hours')->format('Y-m-d H:i:s');
}

function correction_a_effet(array $effects, string $type): bool
{
  foreach ($effects as $effect) {
    if (($effect['type'] ?? '') === $type) {
      return true;
    }
  }
  return false;
}
