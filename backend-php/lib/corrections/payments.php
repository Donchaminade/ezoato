<?php
/**
 * Versements idempotents vers le portefeuille.
 * La clé d'idempotence est unique : un second appel ne crédite pas.
 */
declare(strict_types=1);

function correction_uuid(): string
{
  $b = random_bytes(16);
  $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
  $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
  $h = bin2hex($b);
  return substr($h, 0, 8) . '-' . substr($h, 8, 4) . '-' . substr($h, 12, 4) . '-' . substr($h, 16, 4) . '-' . substr($h, 20);
}

function correction_est_doublon_sql(PDOException $e): bool
{
  if ((string)$e->getCode() === '23000') {
    return true;
  }
  $msg = $e->getMessage();
  return str_contains($msg, 'UNIQUE') || str_contains($msg, 'Duplicate');
}

/**
 * @param callable(string,int,string,string):void $credit userId, montant, description, reference
 * @return array{applied:bool,duplicate:bool}
 */
function correction_verser_idempotent(PDO $pdo, array $row, callable $credit): array
{
  $montant = (int)($row['montant'] ?? 0);
  $key = (string)($row['idempotency_key'] ?? '');
  if ($key === '' || $montant <= 0 || empty($row['user_id'])) {
    return ['applied' => false, 'duplicate' => false];
  }
  $own = !$pdo->inTransaction();
  if ($own) {
    $pdo->beginTransaction();
  }
  try {
    $pdo->prepare(
      'INSERT INTO correction_versements
        (id, idempotency_key, user_id, montant, role_versement, demande_id, reference_metier, cree_le)
       VALUES (?,?,?,?,?,?,?,?)'
    )->execute([
      $row['id'] ?? correction_uuid(),
      $key,
      $row['user_id'],
      $montant,
      $row['role_versement'],
      $row['demande_id'],
      $row['reference_metier'] ?? null,
      $row['cree_le'] ?? date('Y-m-d H:i:s'),
    ]);
    $credit(
      (string)$row['user_id'],
      $montant,
      (string)($row['description'] ?? 'Versement demande de correction'),
      $key
    );
    if ($own) {
      $pdo->commit();
    }
    return ['applied' => true, 'duplicate' => false];
  } catch (PDOException $e) {
    if ($own && $pdo->inTransaction()) {
      $pdo->rollBack();
    }
    if (correction_est_doublon_sql($e)) {
      return ['applied' => false, 'duplicate' => true];
    }
    throw $e;
  }
}

function correction_credit_portefeuille(string $userId, int $montant, string $description, string $ref): void
{
  if (!function_exists('credit_wallet') || !function_exists('get_or_create_wallet')) {
    throw new RuntimeException('Portefeuille indisponible');
  }
  get_or_create_wallet($userId);
  credit_wallet($userId, $montant, $description, $ref);
}
