-- Téléphone utilisateur (inscription + connexion par email ou numéro) — idempotent
SET NAMES utf8mb4;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'telephone'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE users ADD COLUMN telephone VARCHAR(20) NULL AFTER email',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_telephone'
);
SET @sql := IF(@idx = 0,
  'CREATE UNIQUE INDEX idx_users_telephone ON users (telephone)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
