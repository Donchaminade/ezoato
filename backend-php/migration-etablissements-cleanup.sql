-- Corrige les noms d'établissements / villes mal encodés (sans casser les FK)
SET NAMES utf8mb4;

INSERT IGNORE INTO etablissements (nom, ville, niveau) VALUES
('Lycée de Tokoin', 'Lomé', 'lycee'),
('Lycée 2 Février', 'Lomé', 'lycee'),
('Lycée Anié', 'Aného', 'lycee'),
('Collège Saint-Joseph', 'Lomé', 'college'),
('Collège Protestant de Lomé', 'Lomé', 'college'),
('Lycée de Kara', 'Kara', 'lycee'),
('Lycée Adidogomé', 'Lomé', 'lycee'),
('Collège Bon Pasteur', 'Lomé', 'college'),
('Lycée de Sokodé', 'Sokodé', 'lycee'),
('Lycée de Dapaong', 'Dapaong', 'lycee'),
('Collège de Baguida', 'Lomé', 'college');

-- Collège Protestant de Lomé : fusion des doublons
SET @canon_protestant := (SELECT id FROM etablissements WHERE nom = 'Collège Protestant de Lomé' ORDER BY id LIMIT 1);
UPDATE epreuves SET etablissement_id = @canon_protestant
WHERE etablissement_id IN (SELECT id FROM etablissements WHERE nom LIKE '%Protestant%' AND id != @canon_protestant);
UPDATE soumissions SET etablissement_id = @canon_protestant
WHERE etablissement_id IN (SELECT id FROM etablissements WHERE nom LIKE '%Protestant%' AND id != @canon_protestant);
DELETE FROM etablissements WHERE nom LIKE '%Protestant%' AND id != @canon_protestant;

-- Collège Bon Pasteur
SET @canon_bon := (SELECT id FROM etablissements WHERE nom = 'Collège Bon Pasteur' ORDER BY id LIMIT 1);
UPDATE epreuves SET etablissement_id = @canon_bon
WHERE etablissement_id IN (SELECT id FROM etablissements WHERE nom LIKE '%Bon Pasteur%' AND id != @canon_bon);
UPDATE soumissions SET etablissement_id = @canon_bon
WHERE etablissement_id IN (SELECT id FROM etablissements WHERE nom LIKE '%Bon Pasteur%' AND id != @canon_bon);
DELETE FROM etablissements WHERE nom LIKE '%Bon Pasteur%' AND id != @canon_bon;

-- Collège de Baguida
SET @canon_baguida := (SELECT id FROM etablissements WHERE nom = 'Collège de Baguida' ORDER BY id LIMIT 1);
UPDATE epreuves SET etablissement_id = @canon_baguida
WHERE etablissement_id IN (SELECT id FROM etablissements WHERE nom LIKE '%Baguida%' AND id != @canon_baguida);
UPDATE soumissions SET etablissement_id = @canon_baguida
WHERE etablissement_id IN (SELECT id FROM etablissements WHERE nom LIKE '%Baguida%' AND id != @canon_baguida);
DELETE FROM etablissements WHERE nom LIKE '%Baguida%' AND id != @canon_baguida;

UPDATE epreuves SET ville = 'Lomé' WHERE LOWER(TRIM(ville)) IN ('lome', 'lomé', 'lome?');
UPDATE epreuves SET ville = 'Kara' WHERE LOWER(TRIM(ville)) = 'kara' AND ville != 'Kara';
UPDATE epreuves SET ville = 'Sokodé' WHERE LOWER(TRIM(ville)) IN ('sokode', 'sokodé');
