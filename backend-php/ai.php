<?php
// backend-php/ai.php — Ezoato AI (QCM, explications, indices)
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

function ai_deps_from_db(): array
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
  ];
}

try {
  if ($action === 'quiz') {
    ai_require_json_post($method);
    $user = require_user();
    $in = ai_json_input();
    json_out(ai_handle_quiz($user, $in, ai_deps_from_db()));
  }

  if ($action === 'explain') {
    ai_require_json_post($method);
    $user = require_user();
    $in = ai_json_input();
    json_out(ai_handle_explain($user, $in, ai_deps_from_db()));
  }

  if ($action === 'hints') {
    ai_require_json_post($method);
    $user = require_user();
    $in = ai_json_input();
    json_out(ai_handle_hints($user, $in));
  }

  if ($action === 'pack') {
    if ($method !== 'GET') {
      fail('Méthode non autorisée', 405);
    }
    $user = require_user();
    $epreuveId = ai_optional_uuid($_GET['epreuveId'] ?? $_GET['id'] ?? null, 'epreuveId');
    if ($epreuveId) {
      $deps = ai_deps_from_db();
      $row = $deps['loadEpreuve']($epreuveId);
      $requires = $deps['requiresPayment']($row);
      $access = $deps['hasAccess']($user['id'], $epreuveId);
      ai_authorize_epreuve_row(is_array($row) ? $row : null, $requires, $access);
    }
    json_out(ai_offline_pack([], ['epreuveId' => $epreuveId]));
  }

  fail('Action IA inconnue', 404);
} catch (Throwable $e) {
  if (function_exists('fail') && ($e instanceof AiValidationException
    || $e instanceof AiRateLimitException
    || $e instanceof AiUnavailableException)) {
    ai_fail($e);
  }
  fail('Service IA temporairement indisponible', 503);
}
