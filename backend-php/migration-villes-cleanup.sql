-- Nettoie les villes en double / mal encodées (PowerShell sans UTF-8, anciens seeds)
SET NAMES utf8mb4;

DELETE FROM villes
WHERE nom LIKE '%?%'
   OR nom LIKE '%├%'
   OR nom LIKE '%Ã%';

-- Réinsère la liste propre (INSERT IGNORE = sans doublon)
INSERT IGNORE INTO villes (nom) VALUES
('Lomé'),('Tsévié'),('Aného'),('Tabligbo'),('Vogan'),('Kévé'),
('Afagnan'),('Agbodrafo'),('Aflao'),('Notsé'),('Kpalimé'),('Atakpamé'),
('Badou'),('Anié'),('Elavagnon'),('Amou-Oblo'),('Blitta'),('Sokodé'),
('Tchamba'),('Sotouboua'),('Bafilo'),('Kara'),('Bassar'),('Niamtougou'),
('Kanté'),('Pagouda'),('Kozah'),('Dapaong'),('Mango'),('Cinkassé'),
('Tandjouaré'),('Gando'),('Naki-Est'),('Kpagouda'),('Vakpo'),('Kouvé'),
('Tové'),('Adidogomé'),('Baguida'),('Agoè');
