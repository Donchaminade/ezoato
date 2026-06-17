-- Réinitialisation de mot de passe EZOA-TO
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         CHAR(36) PRIMARY KEY,
  user_id    CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token_hash (token_hash),
  INDEX idx_user_active (user_id, used_at, expires_at)
) ENGINE=InnoDB;
