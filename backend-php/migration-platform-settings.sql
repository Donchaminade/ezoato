-- Tarifs plateforme + promotions (gérés depuis l'admin)
-- mysql -u root zovu < migration-platform-settings.sql

CREATE TABLE IF NOT EXISTS platform_settings (
  id                      TINYINT PRIMARY KEY DEFAULT 1,
  prix_examen_national    INT NOT NULL DEFAULT 100,
  prix_corrige_type       INT NULL,
  epreuves_par_recompense INT NOT NULL DEFAULT 50,
  montant_recompense      INT NOT NULL DEFAULT 1000,
  min_retrait             INT NOT NULL DEFAULT 2000,
  promo_active            TINYINT(1) NOT NULL DEFAULT 0,
  promo_libelle           VARCHAR(120) NULL,
  promo_pourcentage       INT NULL,
  promo_prix_fixe         INT NULL,
  promo_debut             DATETIME NULL,
  promo_fin               DATETIME NULL,
  promo_applique_examens  TINYINT(1) NOT NULL DEFAULT 1,
  promo_applique_corriges TINYINT(1) NOT NULL DEFAULT 0,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by              CHAR(36) NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO platform_settings (id) VALUES (1);
