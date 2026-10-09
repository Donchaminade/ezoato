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
 'Chaque compte gratuit peut consulter ou télécharger 50 épreuves (devoirs et compositions, quota commun par défaut). Au-delà, et dès la première épreuve pour les examens officiels (CEPD, BEPC, BAC) et les concours, il faut l''abonnement Pro : 1 000 FCFA pour 6 mois, via Flooz ou T-Money.', 2),
('10000000-0000-4000-8000-000000000003', 'general', 'Qui peut utiliser EZOA-TO ?',
 'Tout élève, enseignant ou parent au Togo peut consulter la bibliothèque. La soumission d''épreuves et l''espace contributeur nécessitent un compte gratuit.', 3),
('10000000-0000-4000-8000-000000000004', 'general', 'Quelles villes sont couvertes ?',
 'EZOA-TO couvre les principales villes du Togo : Lomé, Kara, Sokodé, Kpalimé, Atakpamé, Tsévié, Dapaong et bien d''autres. La liste s''enrichit au fil des contributions.', 4),
('10000000-0000-4000-8000-000000000005', 'telechargement', 'Comment télécharger une épreuve ?',
 'Ouvre la fiche dans les archives. Les devoirs et compositions décomptent ton quota gratuit (50 par défaut). Les examens officiels et les concours demandent l''abonnement Pro. Le téléchargement nécessite un compte, pour mémoriser le quota.', 1),
('10000000-0000-4000-8000-000000000006', 'telechargement', 'Puis-je imprimer le PDF ?',
 'Oui. Chaque épreuve validée est un PDF optimisé pour l''impression. Tu peux le télécharger sur ton téléphone et l''envoyer à une imprimerie ou l''imprimer si tu as une imprimante.', 2),
('10000000-0000-4000-8000-000000000007', 'telechargement', 'Pourquoi je ne trouve pas mon établissement ?',
 'La bibliothèque dépend des contributions. Si ton établissement n''apparaît pas encore, soumets les épreuves dont tu disposes : elles seront ajoutées après validation.', 3),
('10000000-0000-4000-8000-000000000008', 'paiement', 'Quels examens sont payants ?',
 'Les examens officiels (CEPD, BEPC, BAC) et les concours sont réservés à l''abonnement Pro dès la première épreuve. Les devoirs et les compositions sont inclus dans le quota gratuit, puis Pro au-delà.', 1),
('10000000-0000-4000-8000-000000000009', 'paiement', 'Comment payer avec Flooz ou T-Money ?',
 'Depuis la page Abonnement Pro, choisis Flooz ou T-Money, saisis ton numéro et valide 1 000 FCFA. L''accès dure 6 mois. Tant qu''aucune clé d''opérateur n''est configurée, la confirmation reste simulée côté serveur.', 2),
('10000000-0000-4000-8000-000000000010', 'paiement', 'Que faire si mon paiement échoue ?',
 'Vérifie ton solde Mobile Money et réessaie. Si le montant a été débité sans accès au PDF, contacte-nous avec la référence de transaction affichée à l''écran ou reçue par SMS.', 3),
('10000000-0000-4000-8000-000000000011', 'contribution', 'Comment soumettre une épreuve ?',
 'Un devoir est propre à un établissement (champ obligatoire). Une composition vient de l''inspection : elle est identique sur le territoire et n''est pas rattachée à une école. Plusieurs personnes peuvent envoyer la même épreuve ; seule la première validée par l''admin est rémunérée. Les suivantes sont refusées comme doublons.', 1),
('10000000-0000-4000-8000-000000000012', 'contribution', 'Combien de temps dure la validation ?',
 'En général sous 48 heures ouvrées. Tu peux suivre le statut (en attente, validée, rejetée) dans Mon compte → Mes soumissions.', 2),
('10000000-0000-4000-8000-000000000013', 'contribution', 'Comment gagner de l''argent en contribuant ?',
 'Chaque palier de 50 épreuves validées (uniquement la première soumission validée de chaque épreuve) crédite 1 000 FCFA. Le retrait est possible à partir de 2 000 FCFA, via Flooz ou T-Money.', 3),
('10000000-0000-4000-8000-000000000014', 'contribution', 'Pourquoi ma soumission a été rejetée ?',
 'Les motifs courants : photos floues ou illisibles, informations incorrectes (mauvaise matière ou année), doublon déjà présent, ou document hors sujet. Le motif précis est indiqué dans le détail de ta soumission.', 4),
('10000000-0000-4000-8000-000000000015', 'compte', 'Faut-il un compte pour télécharger ?',
 'Un compte gratuit est nécessaire pour consulter au-delà de l''aperçu et pour télécharger : le quota de 50 épreuves est suivi par compte. Le compte sert aussi à soumettre des épreuves et à suivre le portefeuille contributeur.', 1),
('10000000-0000-4000-8000-000000000016', 'compte', 'Mes données sont-elles protégées ?',
 'Oui. Ton email et mot de passe sont stockés de manière sécurisée. Nous ne vendons pas tes données. Seuls les gestionnaires autorisés accèdent aux soumissions en attente de validation.', 2);
