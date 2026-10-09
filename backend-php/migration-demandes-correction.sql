-- Demandes de correction : profils, demandes, corrections, revues, journal, versements, réglages.
-- Idempotent. mysql -u root zovu < migration-demandes-correction.sql
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS correction_reglages (
  id                          TINYINT PRIMARY KEY,
  remuneration_correcteur     INT NOT NULL,
  forfait_validateur          INT NOT NULL,
  prix_unitaire               INT NOT NULL,
  quota_pro                   INT NOT NULL,
  nombre_validateurs          INT NOT NULL,
  delai_reassignation_heures  INT NOT NULL,
  reutilisation_active        TINYINT NOT NULL,
  remuneration_reutilisation  INT NOT NULL,
  format_eleve                VARCHAR(40) NOT NULL,
  maj_le                      DATETIME NOT NULL
) ENGINE=InnoDB;

INSERT INTO correction_reglages (
  id, remuneration_correcteur, forfait_validateur, prix_unitaire, quota_pro,
  nombre_validateurs, delai_reassignation_heures, reutilisation_active,
  remuneration_reutilisation, format_eleve, maj_le
)
SELECT 1, 500, 200, 1500, 1, 1, 48, 1, 100, 'pedagogique', NOW()
WHERE NOT EXISTS (SELECT 1 FROM correction_reglages WHERE id = 1);

CREATE TABLE IF NOT EXISTS correcteur_profils (
  id                       CHAR(36) PRIMARY KEY,
  user_id                  CHAR(36) NOT NULL,
  qualite                  VARCHAR(20) NOT NULL,
  statut                   VARCHAR(20) NOT NULL,
  matieres_json            TEXT NOT NULL,
  niveaux_json             TEXT NOT NULL,
  fiabilite                INT NOT NULL DEFAULT 50,
  piece_identite_path      VARCHAR(500) NOT NULL,
  preuve_enseignement_path VARCHAR(500) NOT NULL,
  motif                    VARCHAR(500) NULL,
  valide_par               CHAR(36) NULL,
  cree_le                  DATETIME NOT NULL,
  maj_le                   DATETIME NOT NULL,
  UNIQUE KEY uk_correcteur_user (user_id),
  CONSTRAINT fk_correcteur_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS correction_demandes (
  id                       CHAR(36) PRIMARY KEY,
  eleve_id                 CHAR(36) NOT NULL,
  epreuve_id               CHAR(36) NOT NULL,
  epreuve_titre            VARCHAR(255) NOT NULL DEFAULT '',
  matiere                  VARCHAR(120) NOT NULL DEFAULT '',
  niveau                   VARCHAR(40) NOT NULL DEFAULT '',
  exercices_json           TEXT NOT NULL,
  exercices_signature      CHAR(64) NOT NULL,
  blocage_texte            TEXT NULL,
  audio_path               VARCHAR(500) NULL,
  transcription            TEXT NULL,
  statut                   VARCHAR(40) NOT NULL,
  origine                  VARCHAR(20) NOT NULL DEFAULT 'nouvelle',
  classe_ia                VARCHAR(40) NULL,
  reponse_ia_json          MEDIUMTEXT NULL,
  confirmee                TINYINT NOT NULL DEFAULT 0,
  correcteur_id            CHAR(36) NULL,
  correction_active_id     CHAR(36) NULL,
  assignee_le              DATETIME NULL,
  echeance_le              DATETIME NULL,
  reglement_mode           VARCHAR(20) NOT NULL,
  reglement_statut         VARCHAR(20) NOT NULL,
  reglement_reference      VARCHAR(80) NULL,
  montant                  INT NOT NULL DEFAULT 0,
  periode_quota            VARCHAR(40) NULL,
  correction_reutilisee_id CHAR(36) NULL,
  format_eleve             VARCHAR(40) NOT NULL,
  admin_notifie            TINYINT NOT NULL DEFAULT 0,
  cree_le                  DATETIME NOT NULL,
  maj_le                   DATETIME NOT NULL,
  KEY idx_cd_eleve (eleve_id, cree_le),
  KEY idx_cd_statut (statut, echeance_le),
  KEY idx_cd_correcteur (correcteur_id, statut),
  KEY idx_cd_reutilisation (epreuve_id, exercices_signature),
  CONSTRAINT fk_cd_eleve FOREIGN KEY (eleve_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS correction_corrections (
  id            CHAR(36) PRIMARY KEY,
  demande_id    CHAR(36) NOT NULL,
  correcteur_id CHAR(36) NOT NULL,
  contenu       MEDIUMTEXT NOT NULL,
  version       INT NOT NULL DEFAULT 1,
  statut        VARCHAR(20) NOT NULL,
  cree_le       DATETIME NOT NULL,
  KEY idx_cc_demande (demande_id),
  KEY idx_cc_statut (statut),
  CONSTRAINT fk_cc_demande FOREIGN KEY (demande_id) REFERENCES correction_demandes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS correction_livraisons (
  id            CHAR(36) PRIMARY KEY,
  demande_id    CHAR(36) NOT NULL,
  correction_id CHAR(36) NULL,
  format        VARCHAR(40) NOT NULL,
  contenu       MEDIUMTEXT NOT NULL,
  cree_le       DATETIME NOT NULL,
  KEY idx_cl_demande (demande_id),
  CONSTRAINT fk_cl_demande FOREIGN KEY (demande_id) REFERENCES correction_demandes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS correction_revues (
  id                   CHAR(36) PRIMARY KEY,
  correction_id        CHAR(36) NOT NULL,
  demande_id           CHAR(36) NOT NULL,
  validateur_id        CHAR(36) NOT NULL,
  decision             VARCHAR(20) NOT NULL,
  commentaire          TEXT NULL,
  divergence_signalee  TINYINT NOT NULL DEFAULT 0,
  divergence_note      VARCHAR(500) NULL,
  cree_le              DATETIME NOT NULL,
  UNIQUE KEY uk_revue (correction_id, validateur_id),
  KEY idx_revue_demande (demande_id),
  CONSTRAINT fk_revue_correction FOREIGN KEY (correction_id) REFERENCES correction_corrections(id),
  CONSTRAINT fk_revue_demande FOREIGN KEY (demande_id) REFERENCES correction_demandes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS correction_evenements (
  id           CHAR(36) PRIMARY KEY,
  demande_id   CHAR(36) NOT NULL,
  type         VARCHAR(60) NOT NULL,
  acteur_id    CHAR(36) NULL,
  payload_json TEXT NULL,
  cree_le      DATETIME NOT NULL,
  KEY idx_ce_demande (demande_id, cree_le),
  CONSTRAINT fk_ce_demande FOREIGN KEY (demande_id) REFERENCES correction_demandes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS correction_versements (
  id               CHAR(36) PRIMARY KEY,
  idempotency_key  VARCHAR(160) NOT NULL,
  user_id          CHAR(36) NOT NULL,
  montant          INT NOT NULL,
  role_versement   VARCHAR(30) NOT NULL,
  demande_id       CHAR(36) NOT NULL,
  reference_metier VARCHAR(80) NULL,
  cree_le          DATETIME NOT NULL,
  UNIQUE KEY uk_versement (idempotency_key),
  KEY idx_versement_user (user_id),
  CONSTRAINT fk_versement_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_versement_demande FOREIGN KEY (demande_id) REFERENCES correction_demandes(id)
) ENGINE=InnoDB;

-- Attestation d'énoncé et signalement « ressemble à un corrigé » sur les soumissions.
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'soumissions' AND COLUMN_NAME = 'attestation_enonce'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE soumissions ADD COLUMN attestation_enonce TINYINT NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'soumissions' AND COLUMN_NAME = 'signalement_corrige'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE soumissions ADD COLUMN signalement_corrige TINYINT NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'soumissions' AND COLUMN_NAME = 'signalement_motif'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE soumissions ADD COLUMN signalement_motif VARCHAR(255) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Modèles d'alerte. L'administration est notifiée directement par le module,
-- même si ces règles sont inactives : le triage IA ne peut pas être réduit au silence.
INSERT IGNORE INTO notification_rules
  (id, code, libelle, description, declencheur, canal, destinataire, titre, corps, active)
VALUES
  ('c0de0001-0000-4000-8000-000000000001', 'correction_triage_admin',
   'Demande de correction — triage',
   'Modèle. L''alerte part aussi en direct, y compris quand l''IA traite seule.',
   'correction_triage', 'in_app', 'gestionnaire',
   'Demande de correction',
   'Une demande sur « {titre} » a été triée ({classe}).', 0),
  ('c0de0001-0000-4000-8000-000000000002', 'correction_candidature_admin',
   'Candidature correcteur',
   'Enseignant ou répétiteur en attente de validation.',
   'correction_candidature', 'in_app', 'admin',
   'Candidature correcteur',
   '{nom} candidate comme {qualite}.', 0);
