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
