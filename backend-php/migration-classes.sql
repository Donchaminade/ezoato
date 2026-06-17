-- Classes scolaires par niveau (collège / lycée)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS classes (
  nom    VARCHAR(40) NOT NULL,
  niveau ENUM('college','lycee') NOT NULL,
  ordre  SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (nom, niveau)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO classes (nom, niveau, ordre) VALUES
('6e', 'college', 1),
('5e', 'college', 2),
('4e', 'college', 3),
('3e', 'college', 4),
('2nde A', 'lycee', 1),
('2nde C', 'lycee', 2),
('1ère A', 'lycee', 3),
('1ère C', 'lycee', 4),
('1ère D', 'lycee', 5),
('Tle A1', 'lycee', 6),
('Tle A2', 'lycee', 7),
('Tle C', 'lycee', 8),
('Tle D', 'lycee', 9);
