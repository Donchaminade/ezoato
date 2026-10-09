-- Tuteur guidé : le mode `guide` doit être accepté par ai_sessions.
-- Les installations neuves l'ont déjà via schema.sql / migration-ai-sessions.sql.

ALTER TABLE ai_sessions
  MODIFY mode ENUM('guide','redaction','calcul','quiz') NOT NULL DEFAULT 'quiz';
