-- Migration portefeuille contributeur
CREATE TABLE IF NOT EXISTS portefeuilles (
  user_id           CHAR(36) PRIMARY KEY,
  solde             INT NOT NULL DEFAULT 0,
  paliers_verses    INT NOT NULL DEFAULT 0,
  epreuves_validees INT NOT NULL DEFAULT 0,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS portefeuille_transactions (
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

CREATE TABLE IF NOT EXISTS retraits (
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
  INDEX (statut), INDEX (cree_le)
) ENGINE=InnoDB;

ALTER TABLE soumissions ADD COLUMN IF NOT EXISTS epreuve_id CHAR(36) NULL;
