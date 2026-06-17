<?php
declare(strict_types=1);

/** Envoie une notification in-app (+ push web si activé) à un utilisateur */
function send_user_notification(string $userId, string $titre, string $corps, ?string $url = null, bool $tryPush = true): void {
  insert_notification_inbox($userId, null, $titre, $corps, $url);
  if ($tryPush) {
    send_web_push_to_user($userId, $titre, $corps, $url);
  }
}

/** Diffusion in-app (+ push web optionnel) à tous les utilisateurs */
function broadcast_notification_to_all_users(string $titre, string $corps, ?string $url = null, bool $tryPush = false): int {
  if (!table_exists('users')) return 0;
  $stmt = db()->query('SELECT id FROM users');
  $sent = 0;
  foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $userId) {
    send_user_notification((string)$userId, $titre, $corps, $url, $tryPush);
    $sent++;
  }
  return $sent;
}

/** Notifie les utilisateurs dont la classe correspond à une nouvelle épreuve publiée */
function notify_classe_users_new_epreuve(array $epreuve): int {
  $classe = trim((string)($epreuve['classe'] ?? ''));
  if ($classe === '' || !table_exists('users')) return 0;

  $titre = $epreuve['titre'] ?? 'Nouvelle épreuve';
  $annee = trim((string)($epreuve['annee'] ?? ''));
  $ville = trim((string)($epreuve['ville'] ?? ''));
  $meta = implode(' · ', array_filter([$classe, $annee, $ville], fn($v) => $v !== ''));
  $titreNotif = 'Nouveau Zovu dispo !';
  $corps = $meta !== ''
    ? "Nouveau Zovu dispo ! {$titre} — {$meta}. Téléchargez et exercez-vous rapidement."
    : "Nouveau Zovu dispo ! {$titre}. Téléchargez et exercez-vous rapidement.";
  $epreuveId = $epreuve['id'] ?? '';
  $url = $epreuveId !== '' ? '/epreuves/' . $epreuveId : '/epreuves';

  $stmt = db()->prepare("SELECT id FROM users WHERE role = 'utilisateur' AND classe = ? AND classe IS NOT NULL");
  $stmt->execute([$classe]);
  $sent = 0;
  foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $userId) {
    send_user_notification((string)$userId, $titreNotif, $corps, $url, true);
    $sent++;
  }
  return $sent;
}

/** @deprecated Utiliser notify_classe_users_new_epreuve */
function notify_all_users_new_epreuve(array $epreuve): int {
  return notify_classe_users_new_epreuve($epreuve);
}

/** Prolonge un abonnement actif ou expiré de N jours et notifie l'utilisateur */
function prolonger_abonnement(string $abonnementId, int $jours): array {
  if (!table_exists('abonnements')) fail('Migration abonnements requise', 503);
  if ($jours < 1 || $jours > 365) fail('Nombre de jours invalide (1–365)', 422);

  $stmt = db()->prepare('SELECT * FROM abonnements WHERE id = ? LIMIT 1');
  $stmt->execute([$abonnementId]);
  $ab = $stmt->fetch();
  if (!$ab) fail('Abonnement introuvable', 404);

  $base = !empty($ab['date_fin']) && strtotime((string)$ab['date_fin']) > time()
    ? (string)$ab['date_fin']
    : date('Y-m-d H:i:s');

  db()->prepare("UPDATE abonnements SET
      date_fin = DATE_ADD(?, INTERVAL ? DAY),
      statut = 'actif',
      date_debut = COALESCE(date_debut, NOW()),
      rappel_2mois = NULL,
      rappel_2sem = NULL,
      rappel_3j = NULL,
      rappel_expiration = NULL
    WHERE id = ?")
    ->execute([$base, $jours, $abonnementId]);

  $titre = 'Abonnement prolongé';
  $corps = "Bonne nouvelle ! Votre abonnement a été prolongé de {$jours} jour"
    . ($jours > 1 ? 's' : '')
    . '. Profitez-en et pensez à renouveler.';
  send_user_notification((string)$ab['user_id'], $titre, $corps, '/account/abonnement');

  $stmt = db()->prepare('SELECT * FROM abonnements WHERE id = ?');
  $stmt->execute([$abonnementId]);
  $updated = $stmt->fetch();

  return [
    'ok' => true,
    'abonnement' => [
      'id' => $updated['id'],
      'userId' => $updated['user_id'],
      'dateFin' => date('c', strtotime((string)$updated['date_fin'])),
      'statut' => 'actif',
      'joursAjoutes' => $jours,
    ],
  ];
}

/** Cron quotidien : rappels d'expiration d'abonnement (sans renouvellement auto) */
function process_abonnement_reminders(): array {
  if (!table_exists('abonnements')) {
    return ['skipped' => true, 'reason' => 'table abonnements absente'];
  }

  expire_stale_abonnements();
  $stats = ['rappel_2mois' => 0, 'rappel_2sem' => 0, 'rappel_3j' => 0, 'rappel_expiration' => 0];

  $price = number_format(subscription_price(), 0, ',', ' ');
  $months = subscription_duration_months();

  $windows = [
    'rappel_2mois' => [
      'min' => 58,
      'max' => 62,
      'titre' => 'Abonnement EZOA — rappel',
      'corps' => 'Votre abonnement EZOA expire dans 2 mois. Renouvelez pour continuer à accéder aux épreuves.',
    ],
    'rappel_2sem' => [
      'min' => 13,
      'max' => 15,
      'titre' => 'Abonnement EZOA — rappel',
      'corps' => 'Votre abonnement EZOA expire dans 2 semaines. Renouvelez pour conserver l\'accès illimité aux épreuves.',
    ],
    'rappel_3j' => [
      'min' => 2,
      'max' => 4,
      'titre' => 'Abonnement EZOA — urgent',
      'corps' => 'Votre abonnement EZOA expire dans 3 jours. Renouvelez dès maintenant pour ne pas perdre l\'accès aux épreuves.',
    ],
  ];

  foreach ($windows as $column => $cfg) {
    $sql = "SELECT * FROM abonnements
      WHERE statut = 'actif'
        AND date_fin IS NOT NULL
        AND date_fin > NOW()
        AND {$column} IS NULL
        AND DATEDIFF(date_fin, CURDATE()) BETWEEN ? AND ?";
    $stmt = db()->prepare($sql);
    $stmt->execute([$cfg['min'], $cfg['max']]);
    foreach ($stmt->fetchAll() as $ab) {
      send_user_notification(
        (string)$ab['user_id'],
        $cfg['titre'],
        $cfg['corps'],
        '/account/abonnement'
      );
      db()->prepare("UPDATE abonnements SET {$column} = NOW() WHERE id = ?")
        ->execute([$ab['id']]);
      $stats[$column]++;
    }
  }

  // Expiration : le jour même (ou abonnement expiré aujourd'hui sans rappel envoyé)
  $expSql = "SELECT * FROM abonnements
    WHERE statut IN ('actif', 'expire')
      AND date_fin IS NOT NULL
      AND rappel_expiration IS NULL
      AND (
        DATE(date_fin) = CURDATE()
        OR (statut = 'expire' AND DATE(date_fin) = DATE_SUB(CURDATE(), INTERVAL 1 DAY))
      )";
  foreach (db()->query($expSql)->fetchAll() as $ab) {
    send_user_notification(
      (string)$ab['user_id'],
      'Abonnement expiré',
      "Votre abonnement a expiré. Renouvelez ({$price} FCFA / {$months} mois) pour retrouver l'accès.",
      '/account/abonnement'
    );
    db()->prepare("UPDATE abonnements SET rappel_expiration = NOW(), statut = 'expire' WHERE id = ?")
      ->execute([$ab['id']]);
    $stats['rappel_expiration']++;
  }

  return $stats;
}
