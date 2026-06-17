-- Migration corrigés type — idempotent
SET NAMES utf8mb4;

ALTER TABLE epreuves
  MODIFY type ENUM('devoir','composition','examen','corrige') NOT NULL;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'epreuves' AND COLUMN_NAME = 'epreuve_parent_id'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE epreuves ADD COLUMN epreuve_parent_id CHAR(36) NULL AFTER statut',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'epreuves' AND CONSTRAINT_NAME = 'fk_epreuve_parent'
);
SET @sql := IF(@fk = 0,
  'ALTER TABLE epreuves ADD CONSTRAINT fk_epreuve_parent FOREIGN KEY (epreuve_parent_id) REFERENCES epreuves(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'epreuves' AND INDEX_NAME = 'idx_epreuve_parent'
);
SET @sql := IF(@idx = 0,
  'CREATE INDEX idx_epreuve_parent ON epreuves (epreuve_parent_id)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
