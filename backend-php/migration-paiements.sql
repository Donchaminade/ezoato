-- Migration pour bases existantes — ajouter la table paiements
-- Exécuter si la base a déjà été créée avant cette version

CREATE TABLE IF NOT EXISTS paiements (
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

ALTER TABLE telechargements ADD UNIQUE KEY IF NOT EXISTS uq_user_epreuve (user_id, epreuve_id);
