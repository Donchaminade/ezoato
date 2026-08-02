-- EZOA-TO — Niveaux université / concours + meta_niveau JSON + seeds
-- Idempotent autant que possible (ALTER MODIFY, CREATE IF NOT EXISTS, INSERT IGNORE)

-- Élargir ENUM niveau (epreuves / soumissions)
ALTER TABLE epreuves
  MODIFY COLUMN niveau ENUM('college','lycee','universite','concours') NOT NULL;

ALTER TABLE soumissions
  MODIFY COLUMN niveau ENUM('college','lycee','universite','concours') NOT NULL;

-- Établissements : permettre université
ALTER TABLE etablissements
  MODIFY COLUMN niveau ENUM('college','lycee','mixte','universite') NOT NULL DEFAULT 'mixte';

-- Classes : filières univ / labels concours (optionnel)
ALTER TABLE classes
  MODIFY COLUMN niveau ENUM('college','lycee','universite','concours') NOT NULL;

-- Classe plus longue (filière, nom concours)
ALTER TABLE epreuves
  MODIFY COLUMN classe VARCHAR(80) NOT NULL;

ALTER TABLE soumissions
  MODIFY COLUMN classe VARCHAR(80) NOT NULL;

-- Période / session libre (univ, concours) — conserve T1–T3 / S1–S2 pour college/lycée
ALTER TABLE epreuves
  MODIFY COLUMN periode VARCHAR(40) NULL;

ALTER TABLE soumissions
  MODIFY COLUMN periode VARCHAR(40) NULL;

-- Métadonnées spécifiques au niveau (JSON)
SET @col_ep := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'epreuves' AND COLUMN_NAME = 'meta_niveau'
);
SET @sql_ep := IF(@col_ep = 0,
  'ALTER TABLE epreuves ADD COLUMN meta_niveau JSON NULL AFTER examen',
  'SELECT 1');
PREPARE stmt_ep FROM @sql_ep;
EXECUTE stmt_ep;
DEALLOCATE PREPARE stmt_ep;

SET @col_sou := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'soumissions' AND COLUMN_NAME = 'meta_niveau'
);
SET @sql_sou := IF(@col_sou = 0,
  'ALTER TABLE soumissions ADD COLUMN meta_niveau JSON NULL AFTER examen',
  'SELECT 1');
PREPARE stmt_sou FROM @sql_sou;
EXECUTE stmt_sou;
DEALLOCATE PREPARE stmt_sou;

-- Référentiels concours & filières
CREATE TABLE IF NOT EXISTS concours_ref (
  nom   VARCHAR(120) NOT NULL PRIMARY KEY,
  ordre SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS filieres_universite (
  nom   VARCHAR(120) NOT NULL PRIMARY KEY,
  ordre SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO concours_ref (nom, ordre) VALUES
  ('ENAM', 10),
  ('Police nationale', 20),
  ('Gendarmerie nationale', 30),
  ('Armée togolaise', 40),
  ('Douanes', 50),
  ('Impôts', 60),
  ('Trésor', 70),
  ('ENA', 80),
  ('CAPES', 90),
  ('CAFOP', 100),
  ('Concours magistrature', 110),
  ('Concours notariat', 120),
  ('Autre concours', 999);

INSERT IGNORE INTO filieres_universite (nom, ordre) VALUES
  ('Droit', 10),
  ('Économie', 20),
  ('Gestion', 30),
  ('Lettres modernes', 40),
  ('Histoire-Géographie', 50),
  ('Philosophie', 60),
  ('Sociologie', 70),
  ('Psychologie', 80),
  ('Mathématiques', 90),
  ('Physique', 100),
  ('Chimie', 110),
  ('Biologie', 120),
  ('Informatique', 130),
  ('Médecine', 140),
  ('Pharmacie', 150),
  ('Agronomie', 160),
  ('Génie civil', 170),
  ('Génie électrique', 180),
  ('Autre filière', 999);

-- Années d'études univ stockées aussi comme classes (niveau universite)
INSERT IGNORE INTO classes (nom, niveau, ordre) VALUES
  ('L1', 'universite', 10),
  ('L2', 'universite', 20),
  ('L3', 'universite', 30),
  ('M1', 'universite', 40),
  ('M2', 'universite', 50),
  ('Doctorat', 'universite', 60);
