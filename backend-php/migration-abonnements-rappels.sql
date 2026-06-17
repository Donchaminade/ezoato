-- Rappels d'abonnement (sans renouvellement automatique)
-- mysql -u root zovu < migration-abonnements-rappels.sql

ALTER TABLE abonnements
  ADD COLUMN IF NOT EXISTS rappel_2mois DATETIME NULL AFTER statut,
  ADD COLUMN IF NOT EXISTS rappel_2sem DATETIME NULL AFTER rappel_2mois,
  ADD COLUMN IF NOT EXISTS rappel_3j DATETIME NULL AFTER rappel_2sem,
  ADD COLUMN IF NOT EXISTS rappel_expiration DATETIME NULL AFTER rappel_3j;
