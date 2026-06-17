-- Migration FAQ — à exécuter sur une base EZOA-TO existante

CREATE TABLE IF NOT EXISTS faq_items (
  id           CHAR(36) PRIMARY KEY,
  category     VARCHAR(40) NOT NULL,
  question     VARCHAR(500) NOT NULL,
  answer       TEXT NOT NULL,
  ordre        SMALLINT NOT NULL DEFAULT 0,
  helpful_yes  INT NOT NULL DEFAULT 0,
  helpful_no   INT NOT NULL DEFAULT 0,
  actif        TINYINT(1) NOT NULL DEFAULT 1,
  INDEX (category),
  INDEX (actif),
  INDEX (ordre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS faq_votes (
  faq_id    CHAR(36) NOT NULL,
  voter_id  VARCHAR(64) NOT NULL,
  helpful   TINYINT(1) NOT NULL,
  cree_le   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (faq_id, voter_id),
  FOREIGN KEY (faq_id) REFERENCES faq_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Données initiales (identique à seed.sql)
INSERT IGNORE INTO faq_items (id, category, question, answer, ordre) VALUES
('10000000-0000-4000-8000-000000000001', 'general', 'Qu''est-ce que EZOA-TO ?',
 'EZOA-TO est une plateforme togolaise qui archive et partage les devoirs, compositions et examens nationaux des établissements scolaires. Les élèves peuvent chercher, consulter et télécharger des épreuves validées par une équipe de gestionnaires.', 1),
('10000000-0000-4000-8000-000000000002', 'general', 'EZOA-TO est-il gratuit ?',
 'Les devoirs et compositions sont gratuits. Les examens nationaux (CEPD, BEPC, BAC) sont accessibles moyennant 100 FCFA via Flooz ou T-Money, pour financer l''hébergement et la maintenance de la plateforme.', 2),
('10000000-0000-4000-8000-000000000003', 'general', 'Qui peut utiliser EZOA-TO ?',
 'Tout élève, enseignant ou parent au Togo peut consulter la bibliothèque. La soumission d''épreuves et l''espace contributeur nécessitent un compte gratuit.', 3),
('10000000-0000-4000-8000-000000000004', 'general', 'Quelles villes sont couvertes ?',
 'EZOA-TO couvre les principales villes du Togo : Lomé, Kara, Sokodé, Kpalimé, Atakpamé, Tsévié, Dapaong et bien d''autres. La liste s''enrichit au fil des contributions.', 4),
('10000000-0000-4000-8000-000000000005', 'telechargement', 'Comment télécharger une épreuve ?',
 'Recherche l''épreuve dans les Archives EZOA-TO, ouvre la fiche détaillée, consulte l''aperçu PDF puis clique sur Télécharger. Pour un examen national payant, le paiement Mobile Money est demandé une seule fois par épreuve.', 1),
('10000000-0000-4000-8000-000000000006', 'telechargement', 'Puis-je imprimer le PDF ?',
 'Oui. Chaque épreuve validée est un PDF optimisé pour l''impression. Tu peux le télécharger sur ton téléphone et l''envoyer à une imprimerie ou l''imprimer si tu as une imprimante.', 2),
('10000000-0000-4000-8000-000000000007', 'telechargement', 'Pourquoi je ne trouve pas mon établissement ?',
 'La bibliothèque dépend des contributions. Si ton établissement n''apparaît pas encore, soumets les épreuves dont tu disposes : elles seront ajoutées après validation.', 3),
('10000000-0000-4000-8000-000000000008', 'paiement', 'Quels examens sont payants ?',
 'Seuls les examens nationaux (CEPD, BEPC, BAC I et BAC II) sont payants. Les devoirs et compositions restent gratuits pour tous.', 1),
('10000000-0000-4000-8000-000000000009', 'paiement', 'Comment payer avec Flooz ou T-Money ?',
 'Sur la fiche d''un examen national, clique sur Télécharger. Choisis Flooz ou T-Money, saisis ton numéro et valide le paiement de 100 FCFA. L''accès au PDF est débloqué immédiatement après confirmation.', 2),
('10000000-0000-4000-8000-000000000010', 'paiement', 'Que faire si mon paiement échoue ?',
 'Vérifie ton solde Mobile Money et réessaie. Si le montant a été débité sans accès au PDF, contacte-nous avec la référence de transaction affichée à l''écran ou reçue par SMS.', 3),
('10000000-0000-4000-8000-000000000011', 'contribution', 'Comment soumettre une épreuve ?',
 'Crée un compte, va sur Soumettre une épreuve, photographie chaque page lisiblement, renseigne matière, classe, année, type et établissement, puis envoie. Un PDF d''aperçu est généré automatiquement.', 1),
('10000000-0000-4000-8000-000000000012', 'contribution', 'Combien de temps dure la validation ?',
 'En général sous 48 heures ouvrées. Tu peux suivre le statut (en attente, validée, rejetée) dans Mon compte → Mes soumissions.', 2),
('10000000-0000-4000-8000-000000000013', 'contribution', 'Comment gagner de l''argent en contribuant ?',
 'Chaque palier de 50 épreuves validées crédite 1 000 FCFA sur ton portefeuille contributeur. Tu peux demander un retrait dès 2 000 FCFA via Flooz ou T-Money.', 3),
('10000000-0000-4000-8000-000000000014', 'contribution', 'Pourquoi ma soumission a été rejetée ?',
 'Les motifs courants : photos floues ou illisibles, informations incorrectes (mauvaise matière ou année), doublon déjà présent, ou document hors sujet. Le motif précis est indiqué dans le détail de ta soumission.', 4),
('10000000-0000-4000-8000-000000000015', 'compte', 'Faut-il un compte pour télécharger ?',
 'Non pour les épreuves gratuites : tu peux consulter et télécharger sans compte. Un compte est nécessaire pour soumettre des épreuves, accéder à l''espace contributeur et retrouver ton historique.', 1),
('10000000-0000-4000-8000-000000000016', 'compte', 'Mes données sont-elles protégées ?',
 'Oui. Ton email et mot de passe sont stockés de manière sécurisée. Nous ne vendons pas tes données. Seuls les gestionnaires autorisés accèdent aux soumissions en attente de validation.', 2);
