-- Invalide les JWT après changement de mot de passe.
-- À exécuter une fois sur la base existante.
SET NAMES utf8mb4;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'session_version'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN session_version INT NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
