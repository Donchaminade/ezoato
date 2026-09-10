<?php
/**
 * Persistance Ezoato AI — MySQL (production) ou fichiers (tests / override).
 */
declare(strict_types=1);

function ai_pdo(array $deps = []): ?PDO
{
  if (isset($deps['db']) && $deps['db'] instanceof PDO) {
    return $deps['db'];
  }
  if (
    empty($deps['sessionDir'])
    && empty($deps['forceFileSessions'])
    && function_exists('db')
  ) {
    try {
      $pdo = db();
      return $pdo instanceof PDO ? $pdo : null;
    } catch (Throwable $e) {
      return null;
    }
  }
  return null;
}

function ai_session_allows_files(array $deps = []): bool
{
  return !empty($deps['sessionDir'])
    || !empty($deps['forceFileSessions'])
    || (!empty($GLOBALS['ezoato_ai_session_dir']) && is_string($GLOBALS['ezoato_ai_session_dir']));
}

function ai_session_use_sql(array $deps = []): bool
{
  if (ai_pdo($deps) === null) {
    return false;
  }
  if (!empty($deps['forceFileSessions'])) {
    return false;
  }
  if (!empty($deps['sessionDir'])) {
    return false;
  }
  return true;
}

function ai_rate_limit_use_sql(array $deps = [], ?string $dir = null): bool
{
  if (ai_pdo($deps) === null) {
    return false;
  }
  if (!empty($deps['forceFileRateLimit'])) {
    return false;
  }
  if ($dir !== null && $dir !== '') {
    return false;
  }
  return true;
}

function ai_session_id_valid(string $id): bool
{
  return ai_uuid_valid($id) || (bool)preg_match('/^[a-f0-9]{32}$/i', $id);
}

/** @return array<string,mixed> */
function ai_session_row_to_array(array $row): array
{
  $payload = json_decode((string)($row['payload'] ?? '{}'), true);
  if (!is_array($payload)) {
    $payload = [];
  }
  $payload['id'] = (string)$row['id'];
  $payload['userId'] = (string)$row['user_id'];
  $payload['mode'] = (string)($row['mode'] ?? $payload['mode'] ?? 'quiz');
  $payload['epreuveId'] = $row['epreuve_id'] ?? ($payload['epreuveId'] ?? null);
  $payload['matiere'] = $row['matiere'] ?? ($payload['matiere'] ?? null);
  $payload['revealLevel'] = (int)($row['reveal_level'] ?? $payload['revealLevel'] ?? 0);
  $payload['createdAt'] = $row['created_at'] ?? ($payload['createdAt'] ?? null);
  $payload['updatedAt'] = $row['updated_at'] ?? ($payload['updatedAt'] ?? null);
  return $payload;
}

/** @return array{id:string,user_id:string,mode:string,epreuve_id:?string,matiere:?string,payload:string,reveal_level:int,created_at:string,updated_at:string} */
function ai_session_to_row(array $session): array
{
  $id = (string)($session['id'] ?? '');
  $userId = (string)($session['userId'] ?? '');
  $mode = (string)($session['mode'] ?? 'quiz');
  if (!in_array($mode, ai_allowed_modes(), true)) {
    $mode = 'quiz';
  }
  $epreuveId = $session['epreuveId'] ?? null;
  $epreuveId = is_string($epreuveId) && $epreuveId !== '' ? $epreuveId : null;
  $matiere = $session['matiere'] ?? null;
  $matiere = is_string($matiere) && $matiere !== '' ? $matiere : null;
  $reveal = (int)($session['revealLevel'] ?? 0);
  $created = (string)($session['createdAt'] ?? date('c'));
  $updated = (string)($session['updatedAt'] ?? date('c'));
  $payload = $session;
  unset($payload['id'], $payload['userId'], $payload['mode'], $payload['epreuveId'], $payload['matiere'], $payload['revealLevel'], $payload['createdAt'], $payload['updatedAt']);
  $json = json_encode($payload, JSON_UNESCAPED_UNICODE);
  if ($json === false) {
    throw new AiUnavailableException('Session IA illisible');
  }
  return [
    'id' => $id,
    'user_id' => $userId,
    'mode' => $mode,
    'epreuve_id' => $epreuveId,
    'matiere' => $matiere,
    'payload' => $json,
    'reveal_level' => $reveal,
    'created_at' => $created,
    'updated_at' => $updated,
  ];
}

function ai_sql_upsert_session(PDO $pdo, array $row): void
{
  $driver = (string)$pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
  if ($driver === 'mysql') {
    $stmt = $pdo->prepare(
      'INSERT INTO ai_sessions (id, user_id, mode, epreuve_id, matiere, payload, reveal_level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         mode = VALUES(mode),
         epreuve_id = VALUES(epreuve_id),
         matiere = VALUES(matiere),
         payload = VALUES(payload),
         reveal_level = VALUES(reveal_level),
         updated_at = VALUES(updated_at)'
    );
    $stmt->execute([
      $row['id'], $row['user_id'], $row['mode'], $row['epreuve_id'], $row['matiere'],
      $row['payload'], $row['reveal_level'], $row['created_at'], $row['updated_at'],
    ]);
    return;
  }
  $upd = $pdo->prepare(
    'UPDATE ai_sessions SET mode = ?, epreuve_id = ?, matiere = ?, payload = ?, reveal_level = ?, updated_at = ?
     WHERE id = ? AND user_id = ?'
  );
  $upd->execute([
    $row['mode'], $row['epreuve_id'], $row['matiere'], $row['payload'], $row['reveal_level'],
    $row['updated_at'], $row['id'], $row['user_id'],
  ]);
  if ($upd->rowCount() > 0) {
    return;
  }
  $ins = $pdo->prepare(
    'INSERT INTO ai_sessions (id, user_id, mode, epreuve_id, matiere, payload, reveal_level, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  $ins->execute([
    $row['id'], $row['user_id'], $row['mode'], $row['epreuve_id'], $row['matiere'],
    $row['payload'], $row['reveal_level'], $row['created_at'], $row['updated_at'],
  ]);
}

function ai_session_write_sql(PDO $pdo, array $session): void
{
  $session['updatedAt'] = date('c');
  ai_sql_upsert_session($pdo, ai_session_to_row($session));
}

function ai_session_read_sql(PDO $pdo, string $id, string $userId): array
{
  $stmt = $pdo->prepare('SELECT * FROM ai_sessions WHERE id = ? LIMIT 1');
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  if (!is_array($row) || (string)($row['user_id'] ?? '') !== $userId) {
    throw new AiValidationException('Session introuvable', 404);
  }
  return ai_session_row_to_array($row);
}

/**
 * @return array{ok:bool,remaining:int,retryAfter:int,count:int,hits:list<int>}
 */
function ai_rate_limit_status_sql(PDO $pdo, string $userId, string $bucket, int $now): array
{
  $windowStart = $now - AI_RATE_WINDOW_SECONDS;
  $pdo->prepare('DELETE FROM ai_rate_limits WHERE user_id = ? AND bucket = ? AND hit_at <= ?')
    ->execute([$userId, $bucket, $windowStart]);
  $stmt = $pdo->prepare(
    'SELECT hit_at FROM ai_rate_limits WHERE user_id = ? AND bucket = ? AND hit_at > ? ORDER BY hit_at ASC'
  );
  $stmt->execute([$userId, $bucket, $windowStart]);
  $hits = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN) ?: []);
  $count = count($hits);
  $ok = $count < AI_RATE_MAX_PER_WINDOW;
  $retry = 0;
  if (!$ok && $hits) {
    $retry = max(1, ($hits[0] + AI_RATE_WINDOW_SECONDS) - $now);
  }
  return [
    'ok' => $ok,
    'remaining' => max(0, AI_RATE_MAX_PER_WINDOW - $count),
    'retryAfter' => $retry,
    'count' => $count,
    'hits' => $hits,
  ];
}

function ai_rate_limit_consume_sql(PDO $pdo, string $userId, string $bucket, int $now): array
{
  $status = ai_rate_limit_status_sql($pdo, $userId, $bucket, $now);
  if (!$status['ok']) {
    throw new AiRateLimitException('Trop de requêtes IA. Réessaie dans quelques minutes.', $status['retryAfter']);
  }
  $pdo->prepare('INSERT INTO ai_rate_limits (user_id, bucket, hit_at) VALUES (?, ?, ?)')
    ->execute([$userId, $bucket, $now]);
  $status['count']++;
  $status['remaining'] = max(0, AI_RATE_MAX_PER_WINDOW - $status['count']);
  $status['hits'][] = $now;
  return $status;
}
