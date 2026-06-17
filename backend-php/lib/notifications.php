<?php
declare(strict_types=1);

/** Déclencheurs disponibles pour programmer une notification */
function notification_declencheurs(): array {
  return [
    'soumission_validee' => 'Soumission validée (contributeur)',
    'soumission_rejetee' => 'Soumission rejetée (contributeur)',
    'soumission_recue' => 'Nouvelle soumission (modération)',
    'retrait_approuve' => 'Retrait approuvé (contributeur)',
    'retrait_rejete' => 'Retrait rejeté (contributeur)',
    'retrait_demande' => 'Demande de retrait (modération)',
    'paiement_confirme' => 'Paiement confirmé (acheteur)',
    'compte_cree' => 'Bienvenue — compte créé',
  ];
}

function notification_canaux(): array {
  return ['in_app', 'push', 'email'];
}

function notification_destinataires(): array {
  return ['utilisateur', 'gestionnaire', 'admin'];
}

function map_notification_rule(array $row): array {
  return [
    'id' => $row['id'],
    'code' => $row['code'],
    'libelle' => repair_display_text($row['libelle'] ?? '') ?? '',
    'description' => repair_display_text($row['description'] ?? null),
    'declencheur' => $row['declencheur'],
    'declencheurLabel' => notification_declencheurs()[$row['declencheur']] ?? $row['declencheur'],
    'canal' => $row['canal'],
    'destinataire' => $row['destinataire'],
    'titre' => repair_display_text($row['titre'] ?? '') ?? '',
    'corps' => repair_display_text($row['corps'] ?? '') ?? '',
    'active' => (bool)$row['active'],
    'createdAt' => date('c', strtotime($row['created_at'])),
    'updatedAt' => date('c', strtotime($row['updated_at'])),
  ];
}

function render_notification_template(string $text, array $vars): string {
  foreach ($vars as $key => $value) {
    $text = str_replace('{' . $key . '}', (string)$value, $text);
  }
  return $text;
}

function notification_target_user_ids(string $destinataire, ?string $userId = null): array {
  if ($destinataire === 'utilisateur') {
    return $userId ? [$userId] : [];
  }
  $roles = $destinataire === 'admin' ? ['admin'] : ['admin', 'gestionnaire'];
  $placeholders = implode(',', array_fill(0, count($roles), '?'));
  $stmt = db()->prepare("SELECT id FROM users WHERE role IN ($placeholders)");
  $stmt->execute($roles);
  return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
}

function insert_notification_inbox(string $userId, ?string $ruleId, string $titre, string $corps, ?string $url = null): void {
  if (!table_exists('notification_inbox')) return;
  db()->prepare('INSERT INTO notification_inbox (id, user_id, rule_id, titre, corps, url) VALUES (?,?,?,?,?,?)')
      ->execute([uuid(), $userId, $ruleId, $titre, $corps, $url]);
}

require_once __DIR__ . '/push-sender.php';

/** Envoie les notifications actives pour un événement métier */
function dispatch_notification_event(string $declencheur, array $vars = [], array $options = []): void {
  if (!table_exists('notification_rules')) return;

  $stmt = db()->prepare('SELECT * FROM notification_rules WHERE declencheur = ? AND active = 1');
  $stmt->execute([$declencheur]);
  $rules = $stmt->fetchAll();
  if (!$rules) return;

  $userId = $options['userId'] ?? null;
  $url = $options['url'] ?? null;

  foreach ($rules as $rule) {
    $targets = notification_target_user_ids($rule['destinataire'], $userId);
    $titre = repair_display_text(render_notification_template($rule['titre'], $vars)) ?? '';
    $corps = repair_display_text(render_notification_template($rule['corps'], $vars)) ?? '';
    foreach ($targets as $targetId) {
      if ($rule['canal'] === 'in_app' || $rule['canal'] === 'push') {
        insert_notification_inbox($targetId, $rule['id'], $titre, $corps, $url);
      }
      if (should_send_web_push_for_rule($rule, $targetId)) {
        send_web_push_to_user($targetId, $titre, $corps, $url);
      }
    }
  }
}

function list_notification_rules(): array {
  if (!table_exists('notification_rules')) return [];
  $rows = db()->query('SELECT * FROM notification_rules ORDER BY libelle ASC')->fetchAll();
  return array_map('map_notification_rule', $rows);
}

function get_notification_rule(string $id): ?array {
  if (!table_exists('notification_rules')) return null;
  $stmt = db()->prepare('SELECT * FROM notification_rules WHERE id = ?');
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  return $row ? map_notification_rule($row) : null;
}

function list_user_inbox(string $userId, int $limit = 40): array {
  if (!table_exists('notification_inbox')) return [];
  $stmt = db()->prepare(
    'SELECT id, titre, corps, url, lu, created_at FROM notification_inbox
     WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  );
  $stmt->bindValue(1, $userId);
  $stmt->bindValue(2, $limit, PDO::PARAM_INT);
  $stmt->execute();
  return array_map(function ($r) {
    return [
      'id' => $r['id'],
      'titre' => repair_display_text($r['titre'] ?? '') ?? '',
      'corps' => repair_display_text($r['corps'] ?? '') ?? '',
      'url' => $r['url'],
      'lu' => (bool)$r['lu'],
      'createdAt' => date('c', strtotime($r['created_at'])),
    ];
  }, $stmt->fetchAll());
}

function count_unread_notifications(string $userId): int {
  if (!table_exists('notification_inbox')) return 0;
  $stmt = db()->prepare('SELECT COUNT(*) FROM notification_inbox WHERE user_id = ? AND lu = 0');
  $stmt->execute([$userId]);
  return (int)$stmt->fetchColumn();
}

function mark_notifications_read(string $userId, ?array $ids = null): void {
  if (!table_exists('notification_inbox')) return;
  if ($ids && count($ids) > 0) {
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $params = array_merge([$userId], $ids);
    db()->prepare("UPDATE notification_inbox SET lu = 1 WHERE user_id = ? AND id IN ($placeholders)")
        ->execute($params);
    return;
  }
  db()->prepare('UPDATE notification_inbox SET lu = 1 WHERE user_id = ?')->execute([$userId]);
}

function delete_notification(string $userId, string $id): bool {
  if (!table_exists('notification_inbox')) return false;
  $stmt = db()->prepare('DELETE FROM notification_inbox WHERE user_id = ? AND id = ?');
  $stmt->execute([$userId, $id]);
  return $stmt->rowCount() > 0;
}
