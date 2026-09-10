-- Ezoato AI — sessions de tutorat + compteurs de rate-limit (MySQL)
-- Remplace les fichiers JSON temporaires du MVP.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS ai_sessions (
  id            CHAR(36) PRIMARY KEY,
  user_id       CHAR(36) NOT NULL,
  mode          ENUM('redaction','calcul','quiz') NOT NULL DEFAULT 'quiz',
  epreuve_id    CHAR(36) NULL,
  matiere       VARCHAR(80) NULL,
  payload       JSON NOT NULL,
  reveal_level  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (epreuve_id) REFERENCES epreuves(id) ON DELETE SET NULL,
  INDEX idx_ai_sess_user (user_id),
  INDEX idx_ai_sess_epreuve (epreuve_id),
  INDEX idx_ai_sess_updated (updated_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_rate_limits (
  id       BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id  CHAR(36) NOT NULL,
  bucket   VARCHAR(32) NOT NULL,
  hit_at   INT UNSIGNED NOT NULL,
  INDEX idx_ai_rl_lookup (user_id, bucket, hit_at)
) ENGINE=InnoDB;
