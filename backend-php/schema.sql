-- EZOA-TO — schéma MySQL (PHP/PDO)
-- À importer dans une base utf8mb4

SET NAMES utf8mb4;

CREATE TABLE users (
  id           CHAR(36) PRIMARY KEY,
  nom          VARCHAR(120) NOT NULL,
  email        VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role         ENUM('utilisateur','gestionnaire','admin') NOT NULL DEFAULT 'utilisateur',
  ville        VARCHAR(80) NULL,
  classe       VARCHAR(40) NULL,
  etablissement VARCHAR(180) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (classe)
) ENGINE=InnoDB;

CREATE TABLE etablissements (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  nom   VARCHAR(180) NOT NULL UNIQUE,
  ville VARCHAR(80) NOT NULL,
  niveau ENUM('college','lycee','mixte','universite') NOT NULL DEFAULT 'mixte'
) ENGINE=InnoDB;

CREATE TABLE epreuves (
  id            CHAR(36) PRIMARY KEY,
  titre         VARCHAR(220) NOT NULL,
  matiere       VARCHAR(80)  NOT NULL,
  niveau        ENUM('college','lycee','universite','concours') NOT NULL,
  classe        VARCHAR(80)  NOT NULL,
  annee         SMALLINT     NOT NULL,
  type          ENUM('devoir','composition','examen') NOT NULL,
  periode       VARCHAR(40) NULL,
  examen        ENUM('CEPD','BEPC','BAC1','BAC2') NULL,
  meta_niveau   JSON NULL,
  etablissement_id INT NULL,
  ville         VARCHAR(80) NOT NULL,
  pdf_path      VARCHAR(255) NOT NULL,
  pages         SMALLINT NOT NULL DEFAULT 0,
  taille_ko     INT NOT NULL DEFAULT 0,
  telechargements INT NOT NULL DEFAULT 0,
  soumis_par    CHAR(36) NOT NULL,
  soumis_le     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valide_le     DATETIME NULL,
  statut        ENUM('en_attente','validee','rejetee','archivee') NOT NULL DEFAULT 'validee',
  epreuve_parent_id CHAR(36) NULL,
  INDEX (matiere), INDEX (niveau), INDEX (classe), INDEX (annee),
  INDEX (type), INDEX (ville), INDEX (statut), INDEX (epreuve_parent_id),
  FOREIGN KEY (etablissement_id) REFERENCES etablissements(id),
  FOREIGN KEY (soumis_par) REFERENCES users(id),
  FOREIGN KEY (epreuve_parent_id) REFERENCES epreuves(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE soumissions (
  id            CHAR(36) PRIMARY KEY,
  titre         VARCHAR(220) NOT NULL,
  matiere       VARCHAR(80)  NOT NULL,
  niveau        ENUM('college','lycee','universite','concours') NOT NULL,
  classe        VARCHAR(80)  NOT NULL,
  annee         SMALLINT     NOT NULL,
  type          ENUM('devoir','composition','examen') NOT NULL,
  periode       VARCHAR(40) NULL,
  examen        ENUM('CEPD','BEPC','BAC1','BAC2') NULL,
  meta_niveau   JSON NULL,
  etablissement_id INT NULL,
  ville         VARCHAR(80) NOT NULL,
  images_json   JSON NOT NULL,
  pdf_preview_path VARCHAR(255) NOT NULL,
  soumis_par    CHAR(36) NOT NULL,
  soumis_le     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  statut        ENUM('en_attente','validee','rejetee') NOT NULL DEFAULT 'en_attente',
  motif_rejet   VARCHAR(500) NULL,
  doublons_json JSON NULL,
  epreuve_id    CHAR(36) NULL,
  FOREIGN KEY (etablissement_id) REFERENCES etablissements(id),
  FOREIGN KEY (soumis_par) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE telechargements (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     CHAR(36) NOT NULL,
  epreuve_id  CHAR(36) NOT NULL,
  telecharge_le DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (epreuve_id) REFERENCES epreuves(id),
  UNIQUE KEY uq_user_epreuve (user_id, epreuve_id)
) ENGINE=InnoDB;

-- Paiements Mobile Money pour examens nationaux (100 FCFA)
CREATE TABLE paiements (
  id            CHAR(36) PRIMARY KEY,
  user_id       CHAR(36) NOT NULL,
  epreuve_id    CHAR(36) NOT NULL,
  montant       INT NOT NULL DEFAULT 100,
  methode       ENUM('flooz','tmoney') NOT NULL,
  telephone     VARCHAR(20) NOT NULL,
  reference     VARCHAR(32) NOT NULL UNIQUE,
  statut        ENUM('en_attente','confirme','echec','expire') NOT NULL DEFAULT 'en_attente',
  cree_le       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirme_le   DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (epreuve_id) REFERENCES epreuves(id),
  UNIQUE KEY uq_paiement_user_epreuve (user_id, epreuve_id)
) ENGINE=InnoDB;

-- Abonnement 6 mois — accès illimité aux épreuves payantes (1000 FCFA)
CREATE TABLE abonnements (
  id          CHAR(36) PRIMARY KEY,
  user_id     CHAR(36) NOT NULL,
  montant     INT NOT NULL DEFAULT 1000,
  methode     ENUM('flooz','tmoney') NULL,
  telephone   VARCHAR(20) NULL,
  reference   VARCHAR(32) NULL UNIQUE,
  date_debut  DATETIME NULL,
  date_fin    DATETIME NULL,
  statut      ENUM('en_attente','actif','expire','annule') NOT NULL DEFAULT 'en_attente',
  rappel_2mois DATETIME NULL,
  rappel_2sem  DATETIME NULL,
  rappel_3j    DATETIME NULL,
  rappel_expiration DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_abonnement_user (user_id),
  INDEX idx_abonnement_date_fin (date_fin),
  INDEX idx_abonnement_statut (statut)
) ENGINE=InnoDB;

-- Portefeuille contributeur (50 épreuves validées = 1000 FCFA)
CREATE TABLE portefeuilles (
  user_id           CHAR(36) PRIMARY KEY,
  solde             INT NOT NULL DEFAULT 0,
  paliers_verses    INT NOT NULL DEFAULT 0,
  epreuves_validees INT NOT NULL DEFAULT 0,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE portefeuille_transactions (
  id          CHAR(36) PRIMARY KEY,
  user_id     CHAR(36) NOT NULL,
  type        ENUM('credit','debit') NOT NULL,
  montant     INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  reference   VARCHAR(64) NULL,
  cree_le     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX (user_id), INDEX (cree_le)
) ENGINE=InnoDB;

CREATE TABLE retraits (
  id          CHAR(36) PRIMARY KEY,
  user_id     CHAR(36) NOT NULL,
  montant     INT NOT NULL,
  methode     ENUM('flooz','tmoney') NOT NULL,
  telephone   VARCHAR(20) NOT NULL,
  statut      ENUM('en_attente','approuve','rejete','paye') NOT NULL DEFAULT 'en_attente',
  motif_rejet VARCHAR(500) NULL,
  cree_le     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  traite_le   DATETIME NULL,
  traite_par  CHAR(36) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (traite_par) REFERENCES users(id),
  INDEX (statut), INDEX (cree_le)
) ENGINE=InnoDB;

CREATE TABLE villes (
  nom VARCHAR(80) PRIMARY KEY
) ENGINE=InnoDB;

CREATE TABLE matieres (
  nom VARCHAR(80) PRIMARY KEY
) ENGINE=InnoDB;

CREATE TABLE classes (
  nom    VARCHAR(40) NOT NULL,
  niveau ENUM('college','lycee','universite','concours') NOT NULL,
  ordre  SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (nom, niveau)
) ENGINE=InnoDB;

CREATE TABLE concours_ref (
  nom   VARCHAR(120) NOT NULL PRIMARY KEY,
  ordre SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE filieres_universite (
  nom   VARCHAR(120) NOT NULL PRIMARY KEY,
  ordre SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE contact_messages (
  id        CHAR(36) PRIMARY KEY,
  user_id   CHAR(36) NULL,
  nom       VARCHAR(120) NOT NULL,
  email     VARCHAR(190) NOT NULL,
  sujet     VARCHAR(200) NOT NULL,
  message   TEXT NOT NULL,
  lu        TINYINT(1) NOT NULL DEFAULT 0,
  cree_le   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX (cree_le), INDEX (lu)
) ENGINE=InnoDB;

CREATE TABLE faq_items (
  id           CHAR(36) PRIMARY KEY,
  category     VARCHAR(40) NOT NULL,
  question     VARCHAR(500) NOT NULL,
  answer       TEXT NOT NULL,
  ordre        SMALLINT NOT NULL DEFAULT 0,
  helpful_yes  INT NOT NULL DEFAULT 0,
  helpful_no   INT NOT NULL DEFAULT 0,
  actif        TINYINT(1) NOT NULL DEFAULT 1,
  INDEX (category),
  INDEX (actif),
  INDEX (ordre)
) ENGINE=InnoDB;

CREATE TABLE faq_votes (
  faq_id    CHAR(36) NOT NULL,
  voter_id  VARCHAR(64) NOT NULL,
  helpful   TINYINT(1) NOT NULL,
  cree_le   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (faq_id, voter_id),
  FOREIGN KEY (faq_id) REFERENCES faq_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE favoris (
  user_id     CHAR(36) NOT NULL,
  epreuve_id  CHAR(36) NOT NULL,
  cree_le     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, epreuve_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (epreuve_id) REFERENCES epreuves(id) ON DELETE CASCADE,
  INDEX (cree_le)
) ENGINE=InnoDB;
