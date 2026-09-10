<?php
// backend-php/ai.php — Ezoato AI (premium : rédaction, calcul, QCM)
declare(strict_types=1);
require __DIR__ . '/helpers.php';
require __DIR__ . '/lib/ai.php';
cors();

$action = $_GET['action'] ?? '';
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

function ai_fail(Throwable $e): void
{
  $code = ai_client_error_code($e);
  if ($e instanceof AiRateLimitException) {
    header('Retry-After: ' . max(1, $e->retryAfter));
  }
  fail(ai_client_error_message($e), $code);
}

function ai_require_json_post(string $method): void
{
  if ($method !== 'POST') {
    fail('Méthode non autorisée', 405);
  }
}

function ai_is_multipart(): bool
{
  $ct = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? ''));
  return str_starts_with($ct, 'multipart/form-data');
}

function ai_request_body(): array
{
  if (ai_is_multipart()) {
    return is_array($_POST) ? $_POST : [];
  }
  return ai_json_input();
}

function ai_user_is_premium(array $user): bool
{
  $role = (string)($user['role'] ?? '');
  if (in_array($role, ['admin', 'gestionnaire'], true)) {
    return true;
  }
  return user_has_active_subscription((string)$user['id']);
}

function ai_deps_from_db(array $user): array
{
  return [
    'loadEpreuve' => static function (string $id): ?array {
      $stmt = db()->prepare("SELECT e.*, et.nom AS etablissement FROM epreuves e
        LEFT JOIN etablissements et ON et.id = e.etablissement_id
        WHERE e.id = ? AND e.statut = 'validee'");
      $stmt->execute([$id]);
      $row = $stmt->fetch();
      return $row ?: null;
    },
    'hasAccess' => static function (string $userId, string $epreuveId): bool {
      return user_has_access($userId, $epreuveId);
    },
    'requiresPayment' => static function (?array $row): bool {
      return is_array($row) && requires_payment($row);
    },
    'hasPremium' => static function (string $userId) use ($user): bool {
      if ($userId === ($user['id'] ?? '')) {
        return ai_user_is_premium($user);
      }
      return user_has_active_subscription($userId);
    },
  ];
}

try {
  $user = require_user();
  $deps = ai_deps_from_db($user);

  if ($action === 'entitlement') {
    if ($method !== 'GET') {
      fail('Méthode non autorisée', 405);
    }
    json_out(ai_handle_entitlement($user, $deps));
  }

  if ($action === 'session' && $method === 'GET') {
    $id = $_GET['id'] ?? $_GET['sessionId'] ?? '';
    json_out(ai_handle_session_get($user, ['sessionId' => $id], $deps));
  }

  if ($action === 'session' && $method === 'POST') {
    json_out(ai_handle_session_start($user, ai_request_body(), $deps));
  }

  if ($action === 'quiz') {
    ai_require_json_post($method);
    json_out(ai_handle_quiz($user, ai_json_input(), $deps));
  }

  if ($action === 'quiz_answer') {
    ai_require_json_post($method);
    json_out(ai_handle_quiz_answer($user, ai_json_input(), $deps));
  }

  if ($action === 'explain') {
    ai_require_json_post($method);
    json_out(ai_handle_explain($user, ai_json_input(), $deps));
  }

  if ($action === 'hints') {
    ai_require_json_post($method);
    json_out(ai_handle_hints($user, ai_json_input(), $deps));
  }

  if ($action === 'essay') {
    ai_require_json_post($method);
    json_out(ai_handle_essay($user, ai_json_input(), $deps));
  }

  if ($action === 'coach') {
    ai_require_json_post($method);
    json_out(ai_handle_coach($user, ai_json_input(), $deps));
  }

  if ($action === 'judge') {
    if ($method !== 'POST') {
      fail('Méthode non autorisée', 405);
    }
    $in = ai_request_body();
    if (ai_is_multipart()) {
      $deps['uploadedImage'] = $_FILES['image'] ?? $_FILES['photo'] ?? null;
    }
    json_out(ai_handle_judge($user, $in, $deps));
  }

  if ($action === 'pack') {
    if ($method !== 'GET') {
      fail('Méthode non autorisée', 405);
    }
    ai_require_premium($user, $deps);
    $epreuveId = ai_optional_uuid($_GET['epreuveId'] ?? $_GET['id'] ?? null, 'epreuveId');
    if ($epreuveId) {
      $row = $deps['loadEpreuve']($epreuveId);
      $requires = $deps['requiresPayment']($row);
      $access = $deps['hasAccess']($user['id'], $epreuveId);
      ai_authorize_epreuve_row(is_array($row) ? $row : null, $requires, $access);
    }
    json_out(ai_offline_pack([], ['epreuveId' => $epreuveId]));
  }

  fail('Action IA inconnue', 404);
} catch (Throwable $e) {
  if ($e instanceof AiValidationException
    || $e instanceof AiRateLimitException
    || $e instanceof AiUnavailableException) {
    ai_fail($e);
  }
  fail('Service IA temporairement indisponible', 503);
}
