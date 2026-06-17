-- Corrige encodage établissements (mojibake, ?) et fusionne les doublons
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

-- Villes corrompues sur les lignes restantes
UPDATE etablissements SET ville = 'Lomé' WHERE ville REGEXP '^Lom.+$' AND ville != 'Lomé';
UPDATE etablissements SET ville = 'Aného' WHERE ville REGEXP '^An.ho$' AND ville != 'Aného';
UPDATE etablissements SET ville = 'Sokodé' WHERE ville REGEXP '^Sokod.+$' AND ville != 'Sokodé';

-- Fusion : garder le nom UTF-8 canonique, réaffecter les FK, supprimer les doublons
-- Lycée de Tokoin
SET @canon := (SELECT id FROM etablissements WHERE nom = 'Lycée de Tokoin' ORDER BY id LIMIT 1);
UPDATE epreuves e JOIN etablissements et ON et.id = e.etablissement_id
  SET e.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e de Tokoin$';
UPDATE soumissions s JOIN etablissements et ON et.id = s.etablissement_id
  SET s.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e de Tokoin$';
DELETE et FROM etablissements et WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e de Tokoin$';

-- Lycée 2 Février
SET @canon := (SELECT id FROM etablissements WHERE nom = 'Lycée 2 Février' ORDER BY id LIMIT 1);
UPDATE epreuves e JOIN etablissements et ON et.id = e.etablissement_id
  SET e.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e 2 F.+vrier$';
UPDATE soumissions s JOIN etablissements et ON et.id = s.etablissement_id
  SET s.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e 2 F.+vrier$';
DELETE et FROM etablissements et WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e 2 F.+vrier$';

-- Lycée Anié
SET @canon := (SELECT id FROM etablissements WHERE nom = 'Lycée Anié' ORDER BY id LIMIT 1);
UPDATE epreuves e JOIN etablissements et ON et.id = e.etablissement_id
  SET e.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e Ani.+$';
UPDATE soumissions s JOIN etablissements et ON et.id = s.etablissement_id
  SET s.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e Ani.+$';
DELETE et FROM etablissements et WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e Ani.+$';

-- Collège Saint-Joseph
SET @canon := (SELECT id FROM etablissements WHERE nom = 'Collège Saint-Joseph' ORDER BY id LIMIT 1);
UPDATE epreuves e JOIN etablissements et ON et.id = e.etablissement_id
  SET e.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Coll.+ge Saint-Joseph$';
UPDATE soumissions s JOIN etablissements et ON et.id = s.etablissement_id
  SET s.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Coll.+ge Saint-Joseph$';
DELETE et FROM etablissements et WHERE et.id != @canon AND et.nom REGEXP '^Coll.+ge Saint-Joseph$';

-- Collège Protestant de Lomé
SET @canon := (SELECT id FROM etablissements WHERE nom = 'Collège Protestant de Lomé' ORDER BY id LIMIT 1);
UPDATE epreuves e JOIN etablissements et ON et.id = e.etablissement_id
  SET e.etablissement_id = @canon WHERE et.id != @canon AND et.nom LIKE '%Protestant%';
UPDATE soumissions s JOIN etablissements et ON et.id = s.etablissement_id
  SET s.etablissement_id = @canon WHERE et.id != @canon AND et.nom LIKE '%Protestant%';
DELETE et FROM etablissements et WHERE et.id != @canon AND et.nom LIKE '%Protestant%';

-- Lycée de Kara
SET @canon := (SELECT id FROM etablissements WHERE nom = 'Lycée de Kara' ORDER BY id LIMIT 1);
UPDATE epreuves e JOIN etablissements et ON et.id = e.etablissement_id
  SET e.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e de Kara$';
UPDATE soumissions s JOIN etablissements et ON et.id = s.etablissement_id
  SET s.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e de Kara$';
DELETE et FROM etablissements et WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e de Kara$';

-- Lycée Adidogomé
SET @canon := (SELECT id FROM etablissements WHERE nom = 'Lycée Adidogomé' ORDER BY id LIMIT 1);
UPDATE epreuves e JOIN etablissements et ON et.id = e.etablissement_id
  SET e.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e Adidogom.+$';
UPDATE soumissions s JOIN etablissements et ON et.id = s.etablissement_id
  SET s.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e Adidogom.+$';
DELETE et FROM etablissements et WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e Adidogom.+$';

-- Collège Bon Pasteur
SET @canon := (SELECT id FROM etablissements WHERE nom = 'Collège Bon Pasteur' ORDER BY id LIMIT 1);
UPDATE epreuves e JOIN etablissements et ON et.id = e.etablissement_id
  SET e.etablissement_id = @canon WHERE et.id != @canon AND et.nom LIKE '%Bon Pasteur%';
UPDATE soumissions s JOIN etablissements et ON et.id = s.etablissement_id
  SET s.etablissement_id = @canon WHERE et.id != @canon AND et.nom LIKE '%Bon Pasteur%';
DELETE et FROM etablissements et WHERE et.id != @canon AND et.nom LIKE '%Bon Pasteur%';

-- Lycée de Sokodé
SET @canon := (SELECT id FROM etablissements WHERE nom = 'Lycée de Sokodé' ORDER BY id LIMIT 1);
UPDATE epreuves e JOIN etablissements et ON et.id = e.etablissement_id
  SET e.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e de Sokod.+$';
UPDATE soumissions s JOIN etablissements et ON et.id = s.etablissement_id
  SET s.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e de Sokod.+$';
DELETE et FROM etablissements et WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e de Sokod.+$';

-- Lycée de Dapaong
SET @canon := (SELECT id FROM etablissements WHERE nom = 'Lycée de Dapaong' ORDER BY id LIMIT 1);
UPDATE epreuves e JOIN etablissements et ON et.id = e.etablissement_id
  SET e.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e de Dapaong$';
UPDATE soumissions s JOIN etablissements et ON et.id = s.etablissement_id
  SET s.etablissement_id = @canon WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e de Dapaong$';
DELETE et FROM etablissements et WHERE et.id != @canon AND et.nom REGEXP '^Lyc.+e de Dapaong$';

-- Collège de Baguida
SET @canon := (SELECT id FROM etablissements WHERE nom = 'Collège de Baguida' ORDER BY id LIMIT 1);
UPDATE epreuves e JOIN etablissements et ON et.id = e.etablissement_id
  SET e.etablissement_id = @canon WHERE et.id != @canon AND et.nom LIKE '%Baguida%';
UPDATE soumissions s JOIN etablissements et ON et.id = s.etablissement_id
  SET s.etablissement_id = @canon WHERE et.id != @canon AND et.nom LIKE '%Baguida%';
DELETE et FROM etablissements et WHERE et.id != @canon AND et.nom LIKE '%Baguida%';

-- Normaliser les noms canoniques restants (au cas où seule la variante corrompue subsistait)
UPDATE etablissements SET nom = 'Lycée de Tokoin', ville = 'Lomé' WHERE nom REGEXP '^Lyc.+e de Tokoin$' AND nom != 'Lycée de Tokoin';
UPDATE etablissements SET nom = 'Lycée 2 Février', ville = 'Lomé' WHERE nom REGEXP '^Lyc.+e 2 F.+vrier$' AND nom != 'Lycée 2 Février';
UPDATE etablissements SET nom = 'Lycée Anié', ville = 'Aného' WHERE nom REGEXP '^Lyc.+e Ani.+$' AND nom != 'Lycée Anié';
UPDATE etablissements SET nom = 'Collège Saint-Joseph', ville = 'Lomé' WHERE nom REGEXP '^Coll.+ge Saint-Joseph$' AND nom != 'Collège Saint-Joseph';
UPDATE etablissements SET nom = 'Lycée de Kara', ville = 'Kara' WHERE nom REGEXP '^Lyc.+e de Kara$' AND nom != 'Lycée de Kara';
UPDATE etablissements SET nom = 'Lycée Adidogomé', ville = 'Lomé' WHERE nom REGEXP '^Lyc.+e Adidogom.+$' AND nom != 'Lycée Adidogomé';
UPDATE etablissements SET nom = 'Lycée de Sokodé', ville = 'Sokodé' WHERE nom REGEXP '^Lyc.+e de Sokod.+$' AND nom != 'Lycée de Sokodé';
UPDATE etablissements SET nom = 'Lycée de Dapaong', ville = 'Dapaong' WHERE nom REGEXP '^Lyc.+e de Dapaong$' AND nom != 'Lycée de Dapaong';

UPDATE epreuves SET ville = 'Lomé' WHERE ville REGEXP '^Lom.+$' AND ville != 'Lomé';
UPDATE epreuves SET ville = 'Aného' WHERE ville REGEXP '^An.ho$' AND ville != 'Aného';
UPDATE epreuves SET ville = 'Sokodé' WHERE ville REGEXP '^Sokod.+$' AND ville != 'Sokodé';
UPDATE soumissions SET ville = 'Lomé' WHERE ville REGEXP '^Lom.+$' AND ville != 'Lomé';
UPDATE soumissions SET ville = 'Aného' WHERE ville REGEXP '^An.ho$' AND ville != 'Aného';
UPDATE soumissions SET ville = 'Sokodé' WHERE ville REGEXP '^Sokod.+$' AND ville != 'Sokodé';
