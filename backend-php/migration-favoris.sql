-- Migration — favoris utilisateur (épreuves marquées)
CREATE TABLE IF NOT EXISTS favoris (
  user_id     CHAR(36) NOT NULL,
  epreuve_id  CHAR(36) NOT NULL,
  cree_le     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, epreuve_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (epreuve_id) REFERENCES epreuves(id) ON DELETE CASCADE,
  INDEX (cree_le)
) ENGINE=InnoDB;
