-- Règles de notifications (programmables par l'admin)
-- mysql -u root zovu < migration-notification-rules.sql

CREATE TABLE IF NOT EXISTS notification_rules (
  id           CHAR(36) PRIMARY KEY,
  code         VARCHAR(80) NOT NULL UNIQUE,
  libelle      VARCHAR(140) NOT NULL,
  description  VARCHAR(500) NULL,
  declencheur  VARCHAR(80) NOT NULL,
  canal        ENUM('in_app','push','email') NOT NULL DEFAULT 'in_app',
  destinataire ENUM('utilisateur','admin','gestionnaire') NOT NULL DEFAULT 'utilisateur',
  titre        VARCHAR(180) NOT NULL,
  corps        TEXT NOT NULL,
  active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_notif_declencheur_dest (declencheur, destinataire)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notification_inbox (
  id         CHAR(36) PRIMARY KEY,
  user_id    CHAR(36) NOT NULL,
  rule_id    CHAR(36) NULL,
  titre      VARCHAR(180) NOT NULL,
  corps      TEXT NOT NULL,
  url        VARCHAR(255) NULL,
  lu         TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_inbox_user (user_id, lu, created_at),
  CONSTRAINT fk_inbox_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_inbox_rule FOREIGN KEY (rule_id) REFERENCES notification_rules(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO notification_rules (id, code, libelle, description, declencheur, canal, destinataire, titre, corps, active) VALUES
('a1000001-0000-4000-8000-000000000001', 'soumission_validee_user', 'Soumission validée', 'Confirmé au contributeur quand une épreuve est acceptée', 'soumission_validee', 'in_app', 'utilisateur', 'Épreuve validée ✓', 'Félicitations {nom} ! Votre épreuve « {titre} » a été validée et publiée.', 1),
('a1000001-0000-4000-8000-000000000002', 'soumission_rejetee_user', 'Soumission rejetée', 'Informe le contributeur du rejet avec motif', 'soumission_rejetee', 'in_app', 'utilisateur', 'Soumission rejetée', 'Votre épreuve « {titre} » a été rejetée. Motif : {motif}', 1),
('a1000001-0000-4000-8000-000000000003', 'soumission_recue_admin', 'Nouvelle soumission', 'Alerte modération : nouvelle épreuve soumise', 'soumission_recue', 'in_app', 'gestionnaire', 'Nouvelle soumission', '{nom} a soumis « {titre} » ({matiere}) — en attente de validation.', 1),
('a1000001-0000-4000-8000-000000000004', 'retrait_approuve_user', 'Retrait approuvé', 'Confirmation de paiement du retrait contributeur', 'retrait_approuve', 'in_app', 'utilisateur', 'Retrait effectué', 'Votre retrait de {montant} FCFA a été traité avec succès.', 1),
('a1000001-0000-4000-8000-000000000005', 'retrait_rejete_user', 'Retrait rejeté', 'Retrait refusé — solde recrédité', 'retrait_rejete', 'in_app', 'utilisateur', 'Retrait rejeté', 'Votre demande de retrait de {montant} FCFA a été rejetée. Motif : {motif}', 1),
('a1000001-0000-4000-8000-000000000006', 'retrait_demande_admin', 'Demande de retrait', 'Alerte admin : nouveau retrait à traiter', 'retrait_demande', 'in_app', 'gestionnaire', 'Retrait en attente', '{nom} demande un retrait de {montant} FCFA via {methode}.', 1),
('a1000001-0000-4000-8000-000000000007', 'paiement_confirme_user', 'Paiement confirmé', 'Accès débloqué après paiement Mobile Money', 'paiement_confirme', 'in_app', 'utilisateur', 'Paiement confirmé', 'Votre paiement de {montant} FCFA pour « {titre} » est confirmé. Accès permanent activé.', 1);
