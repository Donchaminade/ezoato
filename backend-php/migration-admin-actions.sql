-- Journal des actions administrateur (audit)
-- mysql -u root zovu < migration-admin-actions.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS admin_actions (
  id         CHAR(36) PRIMARY KEY,
  actor_id   CHAR(36) NOT NULL,
  target_id  CHAR(36) NULL,
  action     VARCHAR(80) NOT NULL,
  details    VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_actor (actor_id, created_at),
  KEY idx_target (target_id, created_at),
  CONSTRAINT fk_admin_actions_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
