<?php
/**
 * Fournisseurs Mobile Money (Flooz / T-Money).
 * Sans clé : fournisseur simulé, en dev comme en prod.
 * Priorité auto : PayGate Global, puis FedaPay, sinon simulé.
 */
declare(strict_types=1);

require_once __DIR__ . '/freemium.php';
require_once __DIR__ . '/security.php';

interface FournisseurPaiement {
  public function code(): string;
  public function estSimule(): bool;
  /** @return array{providerRef:?string,redirectUrl:?string,instructions:array,raw:array} */
  public function initier(array $commande): array;
  /** @return array{ok:bool,paye:bool,reference:string,providerRef:?string,providerEventId:string,montant:?int,erreur:?string} */
  public function verifierNotification(string $rawBody, array $headers): array;
  /** @return array{ok:bool,paye:bool,providerEventId:string,erreur:?string} */
  public function consulterStatut(string $reference, ?string $providerRef): array;
}

function paiement_http_json(string $method, string $url, array $headers, ?string $body): array {
  if (isset($GLOBALS['ezoa_paiement_http']) && is_callable($GLOBALS['ezoa_paiement_http'])) {
    $res = ($GLOBALS['ezoa_paiement_http'])($method, $url, $headers, $body);
    return is_array($res) ? $res : ['status' => 0, 'body' => '', 'json' => null];
  }
  if (!function_exists('curl_init')) {
    return ['status' => 0, 'body' => '', 'json' => null, 'error' => 'curl indisponible'];
  }
  $ch = curl_init($url);
  $hdrs = [];
  foreach ($headers as $k => $v) $hdrs[] = $k . ': ' . $v;
  curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => strtoupper($method),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => $hdrs,
  ]);
  if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
  $raw = curl_exec($ch);
  $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err = curl_error($ch);
  curl_close($ch);
  $rawStr = is_string($raw) ? $raw : '';
  $json = json_decode($rawStr, true);
  return [
    'status' => $status,
    'body' => $rawStr,
    'json' => is_array($json) ? $json : null,
    'error' => $err !== '' ? $err : null,
  ];
}

function telephone_indicatif_228(string $telephone): string {
  $digits = preg_replace('/\D/', '', $telephone) ?? '';
  if (str_starts_with($digits, '228') && strlen($digits) >= 11) return $digits;
  if (strlen($digits) === 8) return '228' . $digits;
  return $digits;
}

function reseau_mobile_money(string $methode): string {
  return $methode === 'tmoney' ? 'TMONEY' : 'FLOOZ';
}

function paiement_callback_url(): string {
  $explicit = ezoa_env('EZOATO_PAYMENT_CALLBACK_URL');
  if ($explicit) return $explicit;
  if (!function_exists('cfg')) return '';
  $base = rtrim((string)(cfg()['api_base_url'] ?? ''), '/');
  return $base !== '' ? $base . '/webhooks/paiement' : '';
}

function resoudre_code_fournisseur(): string {
  $forced = strtolower(trim((string)(ezoa_env('EZOATO_PAYMENT_PROVIDER', 'auto') ?? 'auto')));
  $paygate = trim((string)(ezoa_env('PAYGATE_AUTH_TOKEN') ?? ''));
  $fedapay = trim((string)(ezoa_env('FEDAPAY_SECRET_KEY') ?? ''));
  if ($forced === 'simulated' || $forced === 'simule') return 'simulated';
  if ($forced === 'paygate') return $paygate !== '' ? 'paygate' : 'simulated';
  if ($forced === 'fedapay') return $fedapay !== '' ? 'fedapay' : 'simulated';
  if ($paygate !== '') return 'paygate';
  if ($fedapay !== '') return 'fedapay';
  return 'simulated';
}

function paiement_fournisseur(): FournisseurPaiement {
  $code = resoudre_code_fournisseur();
  if ($code === 'paygate') return new FournisseurPaygate();
  if ($code === 'fedapay') return new FournisseurFedapay();
  return new FournisseurSimule();
}

final class FournisseurSimule implements FournisseurPaiement {
  public function code(): string { return 'simulated'; }
  public function estSimule(): bool { return true; }

  public function initier(array $commande): array {
    $methode = (string)($commande['methode'] ?? 'flooz');
    $ref = (string)$commande['reference'];
    $montant = (int)$commande['montant'];
    return [
      'providerRef' => null,
      'redirectUrl' => null,
      'instructions' => function_exists('build_mobile_money_instructions')
        ? build_mobile_money_instructions($methode, $ref, $montant)
        : ['titre' => 'Paiement simulé', 'etapes' => ["Référence {$ref}", "Montant {$montant} FCFA"], 'ussd' => ''],
      'raw' => ['simulated' => true],
    ];
  }

  public function verifierNotification(string $rawBody, array $headers): array {
    $data = json_decode($rawBody, true);
    if (!is_array($data)) $data = [];
    $ref = trim((string)($data['reference'] ?? $data['identifier'] ?? ''));
    return [
      'ok' => $ref !== '',
      'paye' => $ref !== '' && !empty($data['paye']),
      'reference' => $ref,
      'providerRef' => null,
      'providerEventId' => $ref !== '' ? 'simulated:' . $ref : '',
      'montant' => isset($data['montant']) ? (int)$data['montant'] : null,
      'erreur' => $ref === '' ? 'Référence manquante' : null,
    ];
  }

  public function consulterStatut(string $reference, ?string $providerRef): array {
    return ['ok' => true, 'paye' => false, 'providerEventId' => 'simulated:' . $reference, 'erreur' => null];
  }
}

final class FournisseurPaygate implements FournisseurPaiement {
  public function code(): string { return 'paygate'; }
  public function estSimule(): bool { return false; }

  private function base(): string {
    return rtrim((string)(ezoa_env('PAYGATE_API_BASE', 'https://paygateglobal.com/api/v1') ?? 'https://paygateglobal.com/api/v1'), '/');
  }

  private function token(): string {
    return (string)(ezoa_env('PAYGATE_AUTH_TOKEN') ?? '');
  }

  public function initier(array $commande): array {
    $payload = [
      'auth_token' => $this->token(),
      'phone_number' => telephone_indicatif_228((string)$commande['telephone']),
      'amount' => (int)$commande['montant'],
      'description' => (string)($commande['description'] ?? 'Abonnement EZOA-TO Pro'),
      'identifier' => (string)$commande['reference'],
      'network' => reseau_mobile_money((string)$commande['methode']),
    ];
    $res = paiement_http_json('POST', $this->base() . '/pay', [
      'Content-Type' => 'application/json',
      'Accept' => 'application/json',
    ], json_encode($payload, JSON_UNESCAPED_UNICODE));
    $json = $res['json'] ?? [];
    $tx = isset($json['tx_reference']) ? (string)$json['tx_reference'] : null;
    $status = $json['status'] ?? null;
    $ok = $res['status'] >= 200 && $res['status'] < 300 && ($status === 0 || $status === '0' || $tx);
    if (!$ok) {
      $msg = (string)($json['message'] ?? $json['error'] ?? 'PayGate a refusé l\'initiation');
      throw new RuntimeException($msg);
    }
    $methode = (string)$commande['methode'];
    $ref = (string)$commande['reference'];
    $montant = (int)$commande['montant'];
    $instructions = function_exists('build_mobile_money_instructions')
      ? build_mobile_money_instructions($methode, $ref, $montant)
      : ['titre' => 'Validez sur votre téléphone', 'etapes' => ['Confirmez la demande ' . ($methode === 'tmoney' ? 'T-Money' : 'Flooz')], 'ussd' => ''];
    $instructions['etapes'][] = 'Une demande de paiement est envoyée sur votre numéro. Validez avec votre code PIN.';
    return [
      'providerRef' => $tx,
      'redirectUrl' => null,
      'instructions' => $instructions,
      'raw' => $json,
    ];
  }

  public function verifierNotification(string $rawBody, array $headers): array {
    $data = json_decode($rawBody, true);
    if (!is_array($data) || $data === []) {
      parse_str($rawBody, $parsed);
      $data = is_array($parsed) ? $parsed : [];
    }
    $reference = trim((string)($data['identifier'] ?? $data['reference'] ?? ''));
    $tx = trim((string)($data['tx_reference'] ?? ''));
    if ($reference === '' && $tx === '') {
      return ['ok' => false, 'paye' => false, 'reference' => '', 'providerRef' => null, 'providerEventId' => '', 'montant' => null, 'erreur' => 'Callback PayGate incomplet'];
    }
    $statut = $this->consulterStatut($reference, $tx !== '' ? $tx : null);
    $eventId = $tx !== '' ? 'paygate:' . $tx : 'paygate:' . $reference;
    return [
      'ok' => $statut['ok'],
      'paye' => $statut['paye'],
      'reference' => $reference,
      'providerRef' => $tx !== '' ? $tx : null,
      'providerEventId' => $statut['paye'] ? $eventId . ':paid' : $eventId . ':pending',
      'montant' => isset($data['amount']) ? (int)$data['amount'] : (isset($data['montant']) ? (int)$data['montant'] : null),
      'erreur' => $statut['erreur'],
    ];
  }

  public function consulterStatut(string $reference, ?string $providerRef): array {
    $tx = $providerRef ?: '';
    if ($tx === '') {
      return ['ok' => false, 'paye' => false, 'providerEventId' => '', 'erreur' => 'tx_reference PayGate manquante'];
    }
    $res = paiement_http_json('POST', $this->base() . '/status', [
      'Content-Type' => 'application/json',
      'Accept' => 'application/json',
    ], json_encode([
      'auth_token' => $this->token(),
      'tx_reference' => $tx,
      'identifier' => $reference,
    ]));
    $json = $res['json'] ?? [];
    $status = $json['status'] ?? null;
    // API statut PayGate : 0 = succès, 2 = en attente, autres = échec / expiré.
    $paye = $status === 0 || $status === '0';
    $pending = $status === 2 || $status === '2';
    return [
      'ok' => $res['status'] >= 200 && $res['status'] < 300 && ($paye || $pending || $status !== null),
      'paye' => $paye,
      'providerEventId' => 'paygate:' . $tx . ($paye ? ':paid' : ':pending'),
      'erreur' => $paye || $pending ? null : (string)($json['message'] ?? 'Paiement non confirmé par PayGate'),
    ];
  }
}

final class FournisseurFedapay implements FournisseurPaiement {
  public function code(): string { return 'fedapay'; }
  public function estSimule(): bool { return false; }

  private function base(): string {
    $env = strtolower((string)(ezoa_env('FEDAPAY_ENVIRONMENT', 'sandbox') ?? 'sandbox'));
    $override = ezoa_env('FEDAPAY_API_BASE');
    if ($override) return rtrim($override, '/');
    return $env === 'live' || $env === 'production'
      ? 'https://api.fedapay.com/v1'
      : 'https://sandbox-api.fedapay.com/v1';
  }

  private function secret(): string {
    return (string)(ezoa_env('FEDAPAY_SECRET_KEY') ?? '');
  }

  public function initier(array $commande): array {
    $phone = preg_replace('/\D/', '', (string)$commande['telephone']) ?? '';
    if (str_starts_with($phone, '228')) $phone = substr($phone, 3);
    $body = [
      'description' => (string)($commande['description'] ?? 'Abonnement EZOA-TO Pro'),
      'amount' => (int)$commande['montant'],
      'currency' => ['iso' => 'XOF'],
      'callback_url' => paiement_callback_url(),
      'custom_metadata' => ['reference' => (string)$commande['reference']],
      'customer' => [
        'firstname' => 'Client',
        'lastname' => 'EZOA-TO',
        'phone_number' => ['number' => $phone, 'country' => 'tg'],
      ],
    ];
    $res = paiement_http_json('POST', $this->base() . '/transactions', [
      'Content-Type' => 'application/json',
      'Accept' => 'application/json',
      'Authorization' => 'Bearer ' . $this->secret(),
    ], json_encode($body, JSON_UNESCAPED_UNICODE));
    $json = $res['json'] ?? [];
    $tx = $json['v1/transaction'] ?? $json['transaction'] ?? $json['data'] ?? $json;
    $id = is_array($tx) ? (string)($tx['id'] ?? '') : '';
    if ($id === '' || $res['status'] < 200 || $res['status'] >= 300) {
      throw new RuntimeException((string)($json['message'] ?? 'FedaPay a refusé l\'initiation'));
    }
    $tokenRes = paiement_http_json('POST', $this->base() . '/transactions/' . rawurlencode($id) . '/token', [
      'Content-Type' => 'application/json',
      'Accept' => 'application/json',
      'Authorization' => 'Bearer ' . $this->secret(),
    ], '{}');
    $tokenJson = $tokenRes['json'] ?? [];
    $url = (string)($tokenJson['url'] ?? $tokenJson['payment_url'] ?? $tokenJson['token']['url'] ?? '');
    $methode = (string)$commande['methode'];
    $instructions = function_exists('build_mobile_money_instructions')
      ? build_mobile_money_instructions($methode, (string)$commande['reference'], (int)$commande['montant'])
      : ['titre' => 'FedaPay', 'etapes' => [], 'ussd' => ''];
    if ($url !== '') {
      $instructions['etapes'][] = 'Ouvrez le lien de paiement sécurisé si la demande n\'arrive pas sur le téléphone.';
    }
    return [
      'providerRef' => $id,
      'redirectUrl' => $url !== '' ? $url : null,
      'instructions' => $instructions,
      'raw' => ['transaction' => $tx, 'token' => $tokenJson],
    ];
  }

  public function verifierNotification(string $rawBody, array $headers): array {
    $norm = [];
    foreach ($headers as $k => $v) {
      $norm[strtolower((string)$k)] = is_array($v) ? implode(',', $v) : (string)$v;
    }
    $secret = (string)(ezoa_env('FEDAPAY_WEBHOOK_SECRET') ?? $this->secret());
    $sig = $norm['x-fedapay-signature'] ?? '';
    if ($secret !== '') {
      $expected = hash_hmac('sha256', $rawBody, $secret);
      if ($sig === '' || !hash_equals($expected, $sig)) {
        return ['ok' => false, 'paye' => false, 'reference' => '', 'providerRef' => null, 'providerEventId' => '', 'montant' => null, 'erreur' => 'Signature FedaPay invalide'];
      }
    }
    $data = json_decode($rawBody, true);
    if (!is_array($data)) $data = [];
    $entity = $data['entity'] ?? $data['v1/transaction'] ?? $data;
    if (!is_array($entity)) $entity = [];
    $id = (string)($entity['id'] ?? '');
    $meta = $entity['custom_metadata'] ?? [];
    $reference = is_array($meta) ? trim((string)($meta['reference'] ?? '')) : '';
    $statut = $this->consulterStatut($reference, $id !== '' ? $id : null);
    return [
      'ok' => $statut['ok'],
      'paye' => $statut['paye'],
      'reference' => $reference,
      'providerRef' => $id !== '' ? $id : null,
      'providerEventId' => $id !== '' ? 'fedapay:' . $id . ($statut['paye'] ? ':approved' : ':other') : '',
      'montant' => isset($entity['amount']) ? (int)$entity['amount'] : null,
      'erreur' => $statut['erreur'],
    ];
  }

  public function consulterStatut(string $reference, ?string $providerRef): array {
    if (!$providerRef) {
      return ['ok' => false, 'paye' => false, 'providerEventId' => '', 'erreur' => 'Transaction FedaPay inconnue'];
    }
    $res = paiement_http_json('GET', $this->base() . '/transactions/' . rawurlencode($providerRef), [
      'Accept' => 'application/json',
      'Authorization' => 'Bearer ' . $this->secret(),
    ], null);
    $json = $res['json'] ?? [];
    $tx = $json['v1/transaction'] ?? $json['transaction'] ?? $json;
    $status = is_array($tx) ? strtolower((string)($tx['status'] ?? '')) : '';
    $paye = in_array($status, ['approved', 'transferred', 'paid'], true);
    return [
      'ok' => $res['status'] >= 200 && $res['status'] < 300,
      'paye' => $paye,
      'providerEventId' => 'fedapay:' . $providerRef . ':' . ($status !== '' ? $status : 'unknown'),
      'erreur' => $paye ? null : 'Paiement FedaPay non approuvé',
    ];
  }
}

/**
 * Persiste l'activation Pro de façon idempotente.
 * Nécessite helpers.php (db, table paiement_evenements, abonnements).
 *
 * @param array<string,mixed> $abonnement ligne SQL
 * @param array{providerEventId:string,paye?:bool,now?:int} $evenement
 * @return array{resultat:string,prolonge:bool,statut:string,date_fin:?int}
 */
function persister_activation_pro(array $abonnement, array $evenement, string $providerCode): array {
  if (!function_exists('db')) {
    throw new RuntimeException('Base indisponible');
  }
  $mois = function_exists('subscription_duration_months') ? subscription_duration_months() : 6;
  $pdo = db();
  $ids = [];
  if (function_exists('table_exists') && table_exists('paiement_evenements')) {
    $q = $pdo->prepare('SELECT provider_event_id FROM paiement_evenements WHERE reference = ? OR abonnement_id = ?');
    $q->execute([(string)($abonnement['reference'] ?? ''), (string)$abonnement['id']]);
    $ids = array_map('strval', $q->fetchAll(PDO::FETCH_COLUMN));
  }
  $etat = [
    'statut' => (string)($abonnement['statut'] ?? 'en_attente'),
    'date_debut' => !empty($abonnement['date_debut']) ? strtotime((string)$abonnement['date_debut']) : null,
    'date_fin' => !empty($abonnement['date_fin']) ? strtotime((string)$abonnement['date_fin']) : null,
    'evenements' => $ids,
  ];
  $apres = appliquer_evenement_pro($etat, $evenement, $mois);

  if ($apres['resultat'] === 'idempotent') {
    return $apres;
  }

  $pdo->beginTransaction();
  try {
    if (function_exists('table_exists') && table_exists('paiement_evenements')) {
      $eventId = trim((string)($evenement['providerEventId'] ?? ''));
      try {
        $pdo->prepare('INSERT INTO paiement_evenements (id, provider, provider_event_id, reference, abonnement_id, payload)
          VALUES (?,?,?,?,?,?)')
          ->execute([
            function_exists('uuid') ? uuid() : bin2hex(random_bytes(16)),
            $providerCode,
            $eventId,
            (string)($abonnement['reference'] ?? ''),
            (string)$abonnement['id'],
            json_encode(['resultat' => $apres['resultat']], JSON_UNESCAPED_UNICODE),
          ]);
      } catch (PDOException $e) {
        $sqlState = $e->errorInfo[1] ?? 0;
        if ((int)$sqlState === 1062) {
          $pdo->commit();
          $apres['resultat'] = 'idempotent';
          $apres['prolonge'] = false;
          return $apres;
        }
        throw $e;
      }
    }

    if ($apres['prolonge']) {
      $debut = date('Y-m-d H:i:s', (int)$apres['date_debut']);
      $fin = date('Y-m-d H:i:s', (int)$apres['date_fin']);
      $pdo->prepare("UPDATE abonnements SET statut='actif', date_debut=?, date_fin=? WHERE id=? AND statut<>'actif'")
        ->execute([$debut, $fin, $abonnement['id']]);
    }
    $pdo->commit();
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    throw $e;
  }
  return $apres;
}
