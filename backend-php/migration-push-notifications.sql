-- Notifications push Web — abonnements et préférences utilisateur
-- Exécuter une fois : mysql -u root tea < migration-push-notifications.sql

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         CHAR(36) PRIMARY KEY,
  user_id    CHAR(36) NOT NULL,
  endpoint   VARCHAR(512) NOT NULL,
  p256dh     VARCHAR(255) NOT NULL,
  auth_key   VARCHAR(255) NOT NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_push_endpoint (endpoint(255)),
  KEY idx_push_user (user_id),
  CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id      CHAR(36) PRIMARY KEY,
  soumissions  TINYINT(1) NOT NULL DEFAULT 1,
  retraits     TINYINT(1) NOT NULL DEFAULT 1,
  paiements    TINYINT(1) NOT NULL DEFAULT 1,
  moderation   TINYINT(1) NOT NULL DEFAULT 1,
  marketing    TINYINT(1) NOT NULL DEFAULT 0,
  push_enabled TINYINT(1) NOT NULL DEFAULT 0,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_prefs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
