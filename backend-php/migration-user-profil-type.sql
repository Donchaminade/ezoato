-- Profil utilisateur à l'inscription (élève, étudiant, parent, etc.)
-- mysql -u root zovu < migration-user-profil-type.sql
SET NAMES utf8mb4;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profil_type'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE users ADD COLUMN profil_type VARCHAR(20) NULL AFTER etablissement',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Comptes existants avec une classe → élève par défaut
UPDATE users
SET profil_type = 'eleve'
WHERE profil_type IS NULL
  AND classe IS NOT NULL
  AND TRIM(classe) <> '';

SET @idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_profil_type'
);
SET @sql := IF(@idx = 0,
  'CREATE INDEX idx_users_profil_type ON users (profil_type)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
