-- Infos contact (page Contact) — gérées depuis l'admin Paramètres
SET NAMES utf8mb4;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'platform_settings' AND COLUMN_NAME = 'contact_email'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE platform_settings
     ADD COLUMN contact_email VARCHAR(120) NULL AFTER updated_by,
     ADD COLUMN contact_telephone VARCHAR(40) NULL AFTER contact_email,
     ADD COLUMN contact_whatsapp VARCHAR(40) NULL AFTER contact_telephone,
     ADD COLUMN contact_adresse VARCHAR(200) NULL AFTER contact_whatsapp,
     ADD COLUMN contact_horaires VARCHAR(120) NULL AFTER contact_adresse',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE platform_settings SET
  contact_email = COALESCE(NULLIF(contact_email, ''), 'contact@tea.tg'),
  contact_telephone = COALESCE(NULLIF(contact_telephone, ''), '+228 90 00 00 00'),
  contact_whatsapp = COALESCE(NULLIF(contact_whatsapp, ''), '+22890000000'),
  contact_adresse = COALESCE(NULLIF(contact_adresse, ''), 'Lomé, Togo'),
  contact_horaires = COALESCE(NULLIF(contact_horaires, ''), 'Lun–Ven, 8h–18h (GMT)')
WHERE id = 1;
