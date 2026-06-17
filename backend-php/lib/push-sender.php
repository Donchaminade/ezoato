<?php
declare(strict_types=1);

use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/** Clés VAPID configurées (local ou prod) */
function push_configured(): bool {
  $cfg = cfg()['push'] ?? [];
  return !empty($cfg['vapid_public_key']) && !empty($cfg['vapid_private_key']);
}

function user_wants_push(string $userId): bool {
  if (!table_exists('notification_preferences')) return false;
  $stmt = db()->prepare('SELECT push_enabled FROM notification_preferences WHERE user_id = ?');
  $stmt->execute([$userId]);
  $row = $stmt->fetch();
  return $row && (bool)$row['push_enabled'];
}

function list_push_subscriptions(string $userId): array {
  if (!table_exists('push_subscriptions')) return [];
  $stmt = db()->prepare('SELECT endpoint, p256dh, auth_key FROM push_subscriptions WHERE user_id = ?');
  $stmt->execute([$userId]);
  return $stmt->fetchAll();
}

/** Envoie une notification Web Push aux appareils abonnés de l'utilisateur */
function send_web_push_to_user(string $userId, string $titre, string $corps, ?string $url = null): void {
  if (!push_configured() || !user_wants_push($userId)) return;

  $subs = list_push_subscriptions($userId);
  if (!$subs) return;

  $autoload = __DIR__ . '/../vendor/autoload.php';
  if (!is_file($autoload)) return;
  require_once $autoload;

  $pushCfg = cfg()['push'];
  $webPush = new WebPush([
    'VAPID' => [
      'subject' => $pushCfg['vapid_subject'] ?? 'mailto:contact@tea.test',
      'publicKey' => $pushCfg['vapid_public_key'],
      'privateKey' => $pushCfg['vapid_private_key'],
    ],
  ]);

  $payload = json_encode([
    'title' => $titre,
    'body' => $corps,
    'url' => $url ?? '/',
  ], JSON_UNESCAPED_UNICODE);

  foreach ($subs as $sub) {
    try {
      $webPush->queueNotification(
        Subscription::create([
          'endpoint' => $sub['endpoint'],
          'keys' => [
            'p256dh' => $sub['p256dh'],
            'auth' => $sub['auth_key'],
          ],
        ]),
        $payload
      );
    } catch (Throwable) {
      continue;
    }
  }

  foreach ($webPush->flush() as $report) {
    if (!$report->isSuccess()) {
      $endpoint = $report->getEndpoint();
      $code = $report->getResponse()?->getStatusCode();
      if ($code === 404 || $code === 410) {
        db()->prepare('DELETE FROM push_subscriptions WHERE endpoint = ?')->execute([$endpoint]);
      }
    }
  }
}

/** Push si la règle le demande (canal push ou in_app + utilisateur abonné) */
function should_send_web_push_for_rule(array $rule, string $userId): bool {
  if ($rule['canal'] === 'push') return user_wants_push($userId);
  if ($rule['canal'] === 'in_app') return user_wants_push($userId);
  return false;
}
