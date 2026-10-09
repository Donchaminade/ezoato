<?php
/**
 * Encaissement Mobile Money d'une demande de correction (prix unitaire, 1 500 FCFA).
 * Réutilise FournisseurPaiement. La confirmation passe par le secret de règlement
 * attendu par le module corrections (X-Ezoato-Reglement / hash_equals).
 */
declare(strict_types=1);

require_once __DIR__ . '/corrections/bootstrap.php';
require_once __DIR__ . '/paiement-fournisseur.php';

function correction_encaissement_assurer(PDO $pdo): void
{
  $driver = (string)$pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
  if ($driver === 'sqlite') {
    $pdo->exec('CREATE TABLE IF NOT EXISTS correction_encaissements (
      id TEXT PRIMARY KEY,
      demande_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reference TEXT NOT NULL UNIQUE,
      provider TEXT NOT NULL,
      provider_ref TEXT NULL,
      provider_event_id TEXT NULL,
      methode TEXT NOT NULL,
      telephone TEXT NOT NULL,
      montant INTEGER NOT NULL,
      statut TEXT NOT NULL,
      created_at TEXT NOT NULL,
      confirme_le TEXT NULL
    )');
    return;
  }
  $pdo->exec("CREATE TABLE IF NOT EXISTS correction_encaissements (
    id CHAR(36) PRIMARY KEY,
    demande_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    reference VARCHAR(40) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    provider_ref VARCHAR(80) NULL,
    provider_event_id VARCHAR(80) NULL,
    methode VARCHAR(20) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    montant INT NOT NULL,
    statut VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL,
    confirme_le DATETIME NULL,
    UNIQUE KEY uq_correction_enc_ref (reference),
    KEY idx_correction_enc_demande (demande_id)
  ) ENGINE=InnoDB");
}

function correction_encaissement_reference(): string
{
  return 'EZOA-COR-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
}

function correction_encaissement_par_reference(PDO $pdo, string $reference): ?array
{
  $stmt = $pdo->prepare('SELECT * FROM correction_encaissements WHERE reference=? LIMIT 1');
  $stmt->execute([$reference]);
  $row = $stmt->fetch();
  return $row ?: null;
}

function correction_encaissement_reponse(array $row, FournisseurPaiement $fournisseur, ?array $init = null): array
{
  $methode = (string)$row['methode'];
  $montant = (int)$row['montant'];
  $reference = (string)$row['reference'];
  $instructions = $init['instructions'] ?? (
    function_exists('build_mobile_money_instructions')
      ? build_mobile_money_instructions($methode, $reference, $montant)
      : [
        'titre' => $methode === 'tmoney' ? 'Payer avec T-Money' : 'Payer avec Flooz',
        'etapes' => ["Montant {$montant} FCFA", "Référence {$reference}"],
        'ussd' => '',
      ]
  );
  return [
    'id' => $row['id'],
    'reference' => $reference,
    'montant' => $montant,
    'methode' => $methode,
    'provider' => $fournisseur->code(),
    'simulated' => $fournisseur->estSimule(),
    'redirectUrl' => $init['redirectUrl'] ?? null,
    'instructions' => $instructions,
  ];
}

/** @return array{ok:bool,error:?string,code:int,paiement:?array} */
function correction_encaissement_initier(PDO $pdo, array $user, array $demande, string $methode, string $telephone): array
{
  correction_encaissement_assurer($pdo);
  if ((string)($demande['statut'] ?? '') !== 'en_attente_reglement') {
    return ['ok' => false, 'error' => 'Cette demande n\'attend pas de règlement', 'code' => 409, 'paiement' => null];
  }
  $montant = (int)($demande['montant'] ?? 0);
  if ($montant <= 0) {
    return ['ok' => false, 'error' => 'Montant de règlement invalide', 'code' => 409, 'paiement' => null];
  }
  if (!in_array($methode, ['flooz', 'tmoney'], true)) {
    return ['ok' => false, 'error' => 'Méthode invalide', 'code' => 400, 'paiement' => null];
  }
  $telephone = preg_replace('/\D/', '', $telephone) ?? '';
  if (strlen($telephone) < 8) {
    return ['ok' => false, 'error' => 'Numéro de téléphone invalide', 'code' => 400, 'paiement' => null];
  }

  $fournisseur = paiement_fournisseur();
  $pending = $pdo->prepare("SELECT * FROM correction_encaissements
    WHERE demande_id=? AND user_id=? AND statut='en_attente'
    ORDER BY created_at DESC LIMIT 1");
  $pending->execute([$demande['id'], $user['id']]);
  $existing = $pending->fetch();
  if ($existing && strtotime((string)$existing['created_at']) > time() - 15 * 60) {
    return ['ok' => true, 'error' => null, 'code' => 200, 'paiement' => correction_encaissement_reponse($existing, $fournisseur)];
  }

  $id = correction_uuid();
  $reference = correction_encaissement_reference();
  $now = date('Y-m-d H:i:s');
  try {
    $init = $fournisseur->initier([
      'reference' => $reference,
      'montant' => $montant,
      'methode' => $methode,
      'telephone' => $telephone,
      'description' => 'Demande de correction EZOA-TO',
    ]);
  } catch (Throwable $e) {
    return ['ok' => false, 'error' => $e->getMessage() !== '' ? $e->getMessage() : 'Initiation du paiement impossible', 'code' => 502, 'paiement' => null];
  }

  $pdo->prepare('INSERT INTO correction_encaissements
      (id, demande_id, user_id, reference, provider, provider_ref, methode, telephone, montant, statut, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)')->execute([
    $id,
    $demande['id'],
    $user['id'],
    $reference,
    $fournisseur->code(),
    $init['providerRef'] ?? null,
    $methode,
    $telephone,
    $montant,
    'en_attente',
    $now,
  ]);
  $row = correction_encaissement_par_reference($pdo, $reference);
  return ['ok' => true, 'error' => null, 'code' => 200, 'paiement' => correction_encaissement_reponse($row ?? [
    'id' => $id,
    'reference' => $reference,
    'montant' => $montant,
    'methode' => $methode,
  ], $fournisseur, $init)];
}

/**
 * Présente le secret configuré au contrôleur du module corrections, puis lance le triage.
 * @return array{ok:bool,error:?string,code:int,demande:?array,duplicate?:bool}
 */
function correction_encaissement_regler(PDO $pdo, array $row, string $eventId): array
{
  $secret = correction_reglement_secret();
  if (!correction_reglement_header_valide($secret)) {
    return ['ok' => false, 'error' => 'Secret de règlement non configuré', 'code' => 503, 'demande' => null];
  }
  $user = ['id' => (string)$row['user_id'], 'role' => 'eleve', 'nom' => ''];
  $ctx = [
    'user' => $user,
    'now' => date('Y-m-d H:i:s'),
    'is_pro' => correction_eleve_est_pro($user),
    'periode' => correction_periode_pro($user),
    'credit' => 'correction_credit_portefeuille',
    'reglement_systeme' => true,
  ];
  $applied = correction_service_confirmer_reglement($pdo, (string)$row['demande_id'], $user, $ctx, (string)$row['reference']);
  if (!$applied['ok']) {
    return $applied;
  }
  $pdo->prepare("UPDATE correction_encaissements SET statut='confirme', provider_event_id=?, confirme_le=? WHERE id=? AND statut='en_attente'")
    ->execute([$eventId, date('Y-m-d H:i:s'), $row['id']]);
  return $applied;
}

/** @return array{ok:bool,error:?string,code:int,demande:?array,duplicate?:bool} */
function correction_encaissement_confirmer(PDO $pdo, array $user, string $demandeId, string $reference): array
{
  correction_encaissement_assurer($pdo);
  $row = correction_encaissement_par_reference($pdo, $reference);
  if (!$row || (string)$row['demande_id'] !== $demandeId || (string)$row['user_id'] !== (string)$user['id']) {
    return ['ok' => false, 'error' => 'Paiement introuvable', 'code' => 404, 'demande' => null];
  }
  if ($row['statut'] === 'confirme') {
    $demande = correction_charger($pdo, $demandeId);
    return [
      'ok' => true,
      'error' => null,
      'code' => 200,
      'duplicate' => true,
      'demande' => $demande ? correction_vue($pdo, $demande, $user) : null,
    ];
  }

  $fournisseur = paiement_fournisseur();
  $paye = $fournisseur->estSimule();
  $eventId = 'simulated:' . $reference . ':client';
  if (!$paye) {
    try {
      $statut = $fournisseur->consulterStatut($reference, $row['provider_ref'] ? (string)$row['provider_ref'] : null);
    } catch (Throwable $e) {
      return ['ok' => false, 'error' => 'Vérification opérateur impossible', 'code' => 502, 'demande' => null];
    }
    if (!confirmation_client_peut_activer(false, !empty($statut['paye']))) {
      return ['ok' => false, 'error' => $statut['erreur'] ?? 'Paiement non confirmé par l\'opérateur', 'code' => 402, 'demande' => null];
    }
    $eventId = (string)($statut['providerEventId'] ?? ('pay:' . $reference));
  }
  return correction_encaissement_regler($pdo, $row, $eventId);
}

/**
 * Webhook opérateur. Null si la référence n'est pas une demande de correction.
 * @return array{ok:bool,error:?string,code:int,resultat?:string,duplicate?:bool}|null
 */
function correction_encaissement_notifier(PDO $pdo, array $verif): ?array
{
  $reference = trim((string)($verif['reference'] ?? ''));
  if ($reference === '') {
    return null;
  }
  try {
    correction_encaissement_assurer($pdo);
  } catch (Throwable $e) {
    return null;
  }
  $row = correction_encaissement_par_reference($pdo, $reference);
  if (!$row && !empty($verif['providerRef'])) {
    $stmt = $pdo->prepare('SELECT * FROM correction_encaissements WHERE provider_ref=? ORDER BY created_at DESC LIMIT 1');
    $stmt->execute([(string)$verif['providerRef']]);
    $found = $stmt->fetch();
    $row = $found ?: null;
  }
  if (!$row) {
    return null;
  }
  $eventId = (string)($verif['providerEventId'] ?? '');
  if ($row['statut'] === 'confirme' || ($eventId !== '' && (string)($row['provider_event_id'] ?? '') === $eventId)) {
    return ['ok' => true, 'error' => null, 'code' => 200, 'resultat' => 'deja_confirme', 'duplicate' => true];
  }
  if (empty($verif['paye'])) {
    return ['ok' => false, 'error' => 'Paiement non confirmé', 'code' => 402];
  }
  $res = correction_encaissement_regler($pdo, $row, $eventId !== '' ? $eventId : ('pay:' . $reference));
  if (!$res['ok']) {
    return ['ok' => false, 'error' => $res['error'] ?? 'Règlement impossible', 'code' => (int)($res['code'] ?? 400)];
  }
  return ['ok' => true, 'error' => null, 'code' => 200, 'resultat' => 'reglement_confirme'];
}
