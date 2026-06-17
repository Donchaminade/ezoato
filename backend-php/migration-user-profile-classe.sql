-- Profil utilisateur : classe + établissement (notifications ciblées par classe)
-- mysql -u root zovu < migration-user-profile-classe.sql
SET NAMES utf8mb4;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'classe'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE users ADD COLUMN classe VARCHAR(40) NULL AFTER ville',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'etablissement'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE users ADD COLUMN etablissement VARCHAR(180) NULL AFTER classe',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_classe'
);
SET @sql := IF(@idx = 0,
  'CREATE INDEX idx_users_classe ON users (classe)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
