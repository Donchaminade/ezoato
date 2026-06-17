-- EZOA-TO — Partenaires, demandes de soutien et demandes établissements
-- Exécuter après schema.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS partenaires (
  id          CHAR(36) PRIMARY KEY,
  nom         VARCHAR(180) NOT NULL,
  logo_path   VARCHAR(255) NULL,
  site_web    VARCHAR(255) NULL,
  ville       VARCHAR(80) NULL,
  type        ENUM('etablissement','entreprise','association','autre') NOT NULL DEFAULT 'etablissement',
  ordre       SMALLINT NOT NULL DEFAULT 0,
  visible     TINYINT(1) NOT NULL DEFAULT 1,
  cree_le     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (visible),
  INDEX (ordre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS demandes_soutien (
  id            CHAR(36) PRIMARY KEY,
  user_id       CHAR(36) NULL,
  nom           VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  telephone     VARCHAR(20) NULL,
  organisation  VARCHAR(180) NULL,
  type          ENUM('partenariat','sponsor','don','mecenat','autre') NOT NULL DEFAULT 'partenariat',
  message       TEXT NOT NULL,
  statut        ENUM('nouvelle','en_cours','acceptee','refusee','archivee') NOT NULL DEFAULT 'nouvelle',
  lu            TINYINT(1) NOT NULL DEFAULT 0,
  notes_admin   TEXT NULL,
  cree_le       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  traite_le     DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX (statut),
  INDEX (lu),
  INDEX (cree_le)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS demandes_etablissement (
  id                CHAR(36) PRIMARY KEY,
  user_id           CHAR(36) NULL,
  nom_etablissement VARCHAR(180) NOT NULL,
  ville             VARCHAR(80) NOT NULL,
  nom_contact       VARCHAR(120) NOT NULL,
  email             VARCHAR(190) NOT NULL,
  telephone         VARCHAR(20) NULL,
  fonction          VARCHAR(120) NULL,
  type_demande      ENUM('collaboration','modification','retrait','autre') NOT NULL DEFAULT 'collaboration',
  message           TEXT NOT NULL,
  statut            ENUM('nouvelle','en_cours','traitee','archivee') NOT NULL DEFAULT 'nouvelle',
  lu                TINYINT(1) NOT NULL DEFAULT 0,
  notes_admin       TEXT NULL,
  cree_le           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  traite_le         DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX (statut),
  INDEX (lu),
  INDEX (cree_le)
) ENGINE=InnoDB;
