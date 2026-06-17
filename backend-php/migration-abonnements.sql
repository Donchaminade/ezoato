-- Migration abonnements — accès illimité aux épreuves payantes (6 mois / 1000 FCFA)
-- Exécuter sur une base existante : mysql -u ... zovu < migration-abonnements.sql

CREATE TABLE IF NOT EXISTS abonnements (
  id          CHAR(36) PRIMARY KEY,
  user_id     CHAR(36) NOT NULL,
  montant     INT NOT NULL DEFAULT 1000,
  methode     ENUM('flooz','tmoney') NULL,
  telephone   VARCHAR(20) NULL,
  reference   VARCHAR(32) NULL UNIQUE,
  date_debut  DATETIME NULL,
  date_fin    DATETIME NULL,
  statut      ENUM('en_attente','actif','expire','annule') NOT NULL DEFAULT 'en_attente',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_abonnement_user (user_id),
  INDEX idx_abonnement_date_fin (date_fin),
  INDEX idx_abonnement_statut (statut)
) ENGINE=InnoDB;
