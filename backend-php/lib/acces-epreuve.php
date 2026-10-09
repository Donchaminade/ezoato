<?php
/**
 * Décision d'accès (quota gratuit ou Pro) et consommation idempotente.
 */
declare(strict_types=1);

require_once __DIR__ . '/freemium.php';

function categorie_quota(array $ep): string {
  $type = (string)($ep['type'] ?? '');
  if ($type === 'devoir' || $type === 'composition') return $type;
  return 'partage';
}

function acces_deja_compte(string $userId, string $epreuveId): bool {
  if (!table_exists('acces_gratuits')) return false;
  $stmt = db()->prepare('SELECT 1 FROM acces_gratuits WHERE user_id=? AND epreuve_id=? LIMIT 1');
  $stmt->execute([$userId, $epreuveId]);
  return (bool)$stmt->fetchColumn();
}

function compter_quota(string $userId, string $bucket, string $mode): int {
  if (!table_exists('acces_gratuits')) return 0;
  if ($mode === 'separate' && ($bucket === 'devoir' || $bucket === 'composition')) {
    $stmt = db()->prepare('SELECT COUNT(*) FROM acces_gratuits WHERE user_id=? AND categorie=?');
    $stmt->execute([$userId, $bucket]);
    return (int)$stmt->fetchColumn();
  }
  if ($mode === 'separate' && $bucket === 'shared') {
    $stmt = db()->prepare("SELECT COUNT(*) FROM acces_gratuits WHERE user_id=? AND categorie='partage'");
    $stmt->execute([$userId]);
    return (int)$stmt->fetchColumn();
  }
  $stmt = db()->prepare('SELECT COUNT(*) FROM acces_gratuits WHERE user_id=?');
  $stmt->execute([$userId]);
  return (int)$stmt->fetchColumn();
}

function freemium_usage_public(string $userId): array {
  $cfg = freemium_config();
  $usedShared = compter_quota($userId, 'shared', 'shared');
  $out = [
    'mode' => $cfg['mode'],
    'limit' => $cfg['quota'],
    'used' => $usedShared,
    'remaining' => max(0, $cfg['quota'] - $usedShared),
    'label' => freemium_label($usedShared, $cfg['quota']),
    'buckets' => null,
  ];
  if ($cfg['mode'] === 'separate') {
    $usedD = compter_quota($userId, 'devoir', 'separate');
    $usedC = compter_quota($userId, 'composition', 'separate');
    $out['buckets'] = [
      'devoir' => [
        'used' => $usedD,
        'limit' => $cfg['quota_devoir'],
        'remaining' => max(0, $cfg['quota_devoir'] - $usedD),
        'label' => freemium_label($usedD, $cfg['quota_devoir']),
      ],
      'composition' => [
        'used' => $usedC,
        'limit' => $cfg['quota_composition'],
        'remaining' => max(0, $cfg['quota_composition'] - $usedC),
        'label' => freemium_label($usedC, $cfg['quota_composition']),
      ],
    ];
    $out['used'] = $usedD + $usedC;
    $out['limit'] = $cfg['quota_devoir'] + $cfg['quota_composition'];
    $out['label'] = 'devoirs ' . freemium_label($usedD, $cfg['quota_devoir'])
      . ' · compositions ' . freemium_label($usedC, $cfg['quota_composition']);
    $out['remaining'] = max(0, $cfg['quota_devoir'] - $usedD) + max(0, $cfg['quota_composition'] - $usedC);
  }
  return $out;
}

/**
 * @return array<string,mixed>
 */
function evaluer_acces_epreuve(string $userId, array $ep, bool $consommer): array {
  $tier = epreuve_access_tier($ep);
  $isPro = user_has_active_subscription($userId);
  $legacy = false;
  if (!$isPro && $tier === 'pro' && !empty($ep['id'])) {
    $legacy = user_access_record($userId, (string)$ep['id']) !== null;
  }
  $cfg = freemium_config();
  $bucket = freemium_bucket($ep, $cfg['mode']);
  $limit = freemium_limit($cfg, $bucket);
  $used = 0;
  $already = false;
  $quotaActif = table_exists('acces_gratuits');

  if ($tier === 'quota' && $quotaActif && !empty($ep['id'])) {
    $already = acces_deja_compte($userId, (string)$ep['id']);
    $used = compter_quota($userId, $bucket, $cfg['mode']);
  }

  if ($tier === 'quota' && !$quotaActif) {
    $decision = ['allowed' => true, 'reason' => 'migration_absente', 'consume' => false, 'requiresPro' => false];
  } else {
    $decision = freemium_decision([
      'tier' => $tier,
      'isPro' => $isPro,
      'legacyAccess' => $legacy,
      'alreadyCounted' => $already,
      'used' => $used,
      'limit' => $limit,
    ]);
  }

  if ($consommer && $decision['consume'] && $quotaActif && !empty($ep['id'])) {
    db()->prepare('INSERT IGNORE INTO acces_gratuits (user_id, epreuve_id, categorie) VALUES (?,?,?)')
      ->execute([$userId, $ep['id'], categorie_quota($ep)]);
    $used = compter_quota($userId, $bucket, $cfg['mode']);
    $decision['reason'] = 'consumed';
  }

  $message = null;
  if (!$decision['allowed'] && $decision['reason'] === 'quota_exceeded') {
    $message = message_quota_atteint($used, $limit);
  } elseif (!$decision['allowed']) {
    $message = message_pro_requis();
  }

  $usage = freemium_usage_public($userId);
  $expires = null;
  if ($decision['allowed'] && ($isPro || $legacy)) {
    $expires = user_access_expires_at($userId, (string)($ep['id'] ?? ''));
  }

  return [
    'allowed' => $decision['allowed'],
    'reason' => $decision['reason'],
    'requiresPro' => $decision['requiresPro'] || $tier === 'pro',
    'accessMode' => $tier,
    'hasSubscription' => $isPro,
    'message' => $message,
    'montant' => $tier === 'pro' ? subscription_price() : 0,
    'expiresAt' => $expires,
    'quota' => [
      'mode' => $cfg['mode'],
      'bucket' => $bucket,
      'used' => $bucket === 'shared' ? (int)$usage['used'] : $used,
      'limit' => $limit,
      'label' => freemium_label($bucket === 'shared' ? (int)$usage['used'] : $used, $limit),
      'usage' => $usage,
    ],
  ];
}

function reponse_acces_api(array $eval): array {
  return [
    'requiresPayment' => ($eval['accessMode'] ?? '') === 'pro',
    'requiresPro' => (bool)$eval['requiresPro'] && empty($eval['hasSubscription']) && ($eval['reason'] ?? '') !== 'legacy',
    'hasAccess' => (bool)$eval['allowed'],
    'hasSubscription' => (bool)$eval['hasSubscription'],
    'accessMode' => $eval['accessMode'],
    'reason' => $eval['reason'],
    'message' => $eval['message'],
    'expiresAt' => $eval['expiresAt'],
    'montant' => (int)$eval['montant'],
    'devise' => 'XOF',
    'quota' => $eval['quota'],
  ];
}

function refuser_si_acces_interdit(array $eval): void {
  if (!empty($eval['allowed'])) return;
  json_out([
    'error' => $eval['message'] ?? message_pro_requis(),
    'code' => $eval['reason'],
    'requiresPro' => true,
    'accessMode' => $eval['accessMode'],
    'quota' => $eval['quota'],
  ], 402);
}
