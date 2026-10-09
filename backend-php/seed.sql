-- Données de référence EZOA-TO (à exécuter après schema.sql)
SET NAMES utf8mb4;

INSERT IGNORE INTO villes (nom) VALUES
('Lomé'),('Tsévié'),('Aného'),('Tabligbo'),('Vogan'),('Kévé'),
('Afagnan'),('Agbodrafo'),('Aflao'),('Notsé'),('Kpalimé'),('Atakpamé'),
('Badou'),('Anié'),('Elavagnon'),('Amou-Oblo'),('Blitta'),('Sokodé'),
('Tchamba'),('Sotouboua'),('Bafilo'),('Kara'),('Bassar'),('Niamtougou'),
('Kanté'),('Pagouda'),('Kozah'),('Dapaong'),('Mango'),('Cinkassé'),
('Tandjouaré'),('Gando'),('Naki-Est'),('Kpagouda'),('Vakpo'),('Kouvé'),
('Tové'),('Adidogomé'),('Baguida'),('Agoè');

INSERT IGNORE INTO matieres (nom) VALUES
('Mathématiques'),('Physique-Chimie'),('SVT'),('Français'),('Anglais'),('Allemand'),
('Espagnol'),('Histoire-Géographie'),('Philosophie'),('ECM'),('Informatique');

INSERT IGNORE INTO classes (nom, niveau, ordre) VALUES
('6e', 'college', 1),('5e', 'college', 2),('4e', 'college', 3),('3e', 'college', 4),
('2nde A', 'lycee', 1),('2nde C', 'lycee', 2),('1ère A', 'lycee', 3),('1ère C', 'lycee', 4),
('1ère D', 'lycee', 5),('Tle A1', 'lycee', 6),('Tle A2', 'lycee', 7),('Tle C', 'lycee', 8),('Tle D', 'lycee', 9);

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

-- FAQ (questions fréquentes)
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
