-- Freemium (quota gratuit), déduplication et idempotence des paiements Pro.
-- Idempotent. Ne modifie pas le statut des abonnements existants : un Pro actif reste Pro.
-- mysql -u root zovu < migration-freemium-paiement.sql

SET NAMES utf8mb4;

-- Clé de doublon (empreinte, pas le document)
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'epreuves' AND COLUMN_NAME = 'dedup_key'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE epreuves ADD COLUMN dedup_key CHAR(64) NULL AFTER ville',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'epreuves' AND INDEX_NAME = 'idx_epreuves_dedup'
);
SET @sql := IF(@idx = 0,
  'CREATE INDEX idx_epreuves_dedup ON epreuves (dedup_key)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'soumissions' AND COLUMN_NAME = 'dedup_key'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE soumissions ADD COLUMN dedup_key CHAR(64) NULL AFTER ville',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'soumissions' AND INDEX_NAME = 'idx_soumissions_dedup'
);
SET @sql := IF(@idx = 0,
  'CREATE INDEX idx_soumissions_dedup ON soumissions (dedup_key)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1 = compte pour le palier 50 épreuves / 1 000 FCFA. Les remplacements ne comptent pas.
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'soumissions' AND COLUMN_NAME = 'recompense_eligible'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE soumissions ADD COLUMN recompense_eligible TINYINT(1) NOT NULL DEFAULT 1',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Consultations / téléchargements qui consomment le quota gratuit (une ligne par couple user+épreuve)
CREATE TABLE IF NOT EXISTS acces_gratuits (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id       CHAR(36) NOT NULL,
  epreuve_id    CHAR(36) NOT NULL,
  categorie     ENUM('devoir','composition','partage') NOT NULL DEFAULT 'partage',
  premier_acces DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_acces_user_epreuve (user_id, epreuve_id),
  INDEX idx_acces_user_cat (user_id, categorie),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (epreuve_id) REFERENCES epreuves(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verrou : une seule épreuve validée par clé (course entre contributeurs)
CREATE TABLE IF NOT EXISTS epreuve_dedup_verrous (
  dedup_key     CHAR(64) PRIMARY KEY,
  epreuve_id    CHAR(36) NOT NULL,
  soumission_id CHAR(36) NOT NULL,
  cree_le       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Événements webhook (unicité fournisseur + id = idempotence)
CREATE TABLE IF NOT EXISTS paiement_evenements (
  id                CHAR(36) PRIMARY KEY,
  provider          VARCHAR(32) NOT NULL,
  provider_event_id VARCHAR(160) NOT NULL,
  reference         VARCHAR(64) NOT NULL,
  abonnement_id     CHAR(36) NULL,
  payload           JSON NULL,
  cree_le           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_provider_event (provider, provider_event_id),
  INDEX idx_paiement_evt_ref (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'abonnements' AND COLUMN_NAME = 'provider'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE abonnements ADD COLUMN provider VARCHAR(32) NULL AFTER reference, ADD COLUMN provider_ref VARCHAR(128) NULL AFTER provider',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FAQ : aligne le texte sur le freemium et le barème réel (les lignes restent, seules les réponses changent)
UPDATE faq_items SET answer = 'Chaque compte gratuit peut consulter ou télécharger 50 épreuves (devoirs et compositions, quota commun par défaut). Au-delà, et dès la première épreuve pour les examens officiels (CEPD, BEPC, BAC) et les concours, il faut l''abonnement Pro : 1 000 FCFA pour 6 mois, via Flooz ou T-Money.'
WHERE id = '10000000-0000-4000-8000-000000000002';

UPDATE faq_items SET answer = 'Ouvre la fiche dans les archives. Les devoirs et compositions décomptent ton quota gratuit (50 par défaut). Les examens officiels et les concours demandent l''abonnement Pro. Le téléchargement nécessite un compte, pour mémoriser le quota.'
WHERE id = '10000000-0000-4000-8000-000000000005';

UPDATE faq_items SET answer = 'Les examens officiels (CEPD, BEPC, BAC) et les concours sont réservés à l''abonnement Pro dès la première épreuve. Les devoirs et les compositions sont inclus dans le quota gratuit, puis Pro au-delà.'
WHERE id = '10000000-0000-4000-8000-000000000008';

UPDATE faq_items SET answer = 'Depuis la page Abonnement Pro, choisis Flooz ou T-Money, saisis ton numéro et valide 1 000 FCFA. L''accès dure 6 mois. Tant qu''aucune clé d''opérateur n''est configurée, la confirmation reste simulée côté serveur.'
WHERE id = '10000000-0000-4000-8000-000000000009';

UPDATE faq_items SET answer = 'Un devoir est propre à un établissement (champ obligatoire). Une composition vient de l''inspection : elle est identique sur le territoire et n''est pas rattachée à une école. Plusieurs personnes peuvent envoyer la même épreuve ; seule la première validée par l''admin est rémunérée. Les suivantes sont refusées comme doublons.'
WHERE id = '10000000-0000-4000-8000-000000000011';

UPDATE faq_items SET answer = 'Chaque palier de 50 épreuves validées (uniquement la première soumission validée de chaque épreuve) crédite 1 000 FCFA. Le retrait est possible à partir de 2 000 FCFA, via Flooz ou T-Money.'
WHERE id = '10000000-0000-4000-8000-000000000013';

UPDATE faq_items SET answer = 'Un compte gratuit est nécessaire pour consulter au-delà de l''aperçu et pour télécharger : le quota de 50 épreuves est suivi par compte. Le compte sert aussi à soumettre des épreuves et à suivre le portefeuille contributeur.'
WHERE id = '10000000-0000-4000-8000-000000000015';
