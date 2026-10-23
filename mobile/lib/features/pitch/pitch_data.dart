import 'package:flutter/material.dart';

/// Données de démonstration embarquées : l'APK de pitch fonctionne
/// entièrement hors ligne, sans backend.
class Exam {
  const Exam(this.code, this.label, this.level, this.icon, this.color, this.count);
  final String code;
  final String label;
  final String level;
  final IconData icon;
  final Color color;
  final int count;
}

const exams = <Exam>[
  Exam('CEPD', 'CEPD', 'Primaire', Icons.backpack_rounded, Color(0xFFFFCE00), 1240),
  Exam('BEPC', 'BEPC', 'Collège', Icons.menu_book_rounded, Color(0xFF02A671), 2860),
  Exam('BAC1', 'BAC I', 'Lycée', Icons.science_rounded, Color(0xFFFFCE00), 1975),
  Exam('BAC2', 'BAC II', 'Lycée', Icons.school_rounded, Color(0xFF02A671), 3410),
  Exam('DEV', 'Devoirs & compos', 'Tous niveaux', Icons.edit_note_rounded, Color(0xFFFFCE00), 5120),
  Exam('UNIV', 'Université', 'Supérieur', Icons.account_balance_rounded, Color(0xFF02A671), 890),
  Exam('CONC', 'Concours', 'ENAM, ENI…', Icons.emoji_events_rounded, Color(0xFFFFCE00), 430),
];

class Exercise {
  const Exercise(this.title, this.points, this.statement);
  final String title;
  final int points;
  final String statement;
}

class Subject {
  const Subject({
    required this.id,
    required this.exam,
    required this.matiere,
    required this.serie,
    required this.year,
    required this.duree,
    required this.coef,
    required this.pages,
    required this.verifiedBy,
    required this.exercises,
    this.pro = false,
    this.offline = false,
    this.views = 0,
  });
  final String id;
  final String exam;
  final String matiere;
  final String serie;
  final int year;
  final String duree;
  final int coef;
  final int pages;
  final String verifiedBy;
  final List<Exercise> exercises;
  final bool pro;
  final bool offline;
  final int views;

  String get examLabel => exam.startsWith('Concours') ? 'Concours' : exam.startsWith('Université') ? 'Université' : exam;
  Exam get examInfo => exams.firstWhere((e) => e.label == examLabel, orElse: () => exams[1]);

  String get title => '$exam${serie.isEmpty ? '' : ' $serie'} · $matiere $year';
}

const subjects = <Subject>[
  Subject(
    id: 'bepc-maths-2024',
    exam: 'BEPC',
    matiere: 'Mathématiques',
    serie: '',
    year: 2024,
    duree: '2 h',
    coef: 4,
    pages: 2,
    verifiedBy: 'M. Kodjo A., prof. de maths · Lomé',
    offline: true,
    views: 18420,
    exercises: [
      Exercise('Exercice 1', 5, 'On donne A = (2x − 3)² − (x + 1)(2x − 3).\n1) Développe et réduis A.\n2) Factorise A.\n3) Résous l\'équation A = 0.'),
      Exercise('Exercice 2', 6, 'Dans un repère orthonormé (O, I, J), on donne les points E(2 ; 3), F(−1 ; 0) et G(4 ; −1).\n1) Calcule les coordonnées du vecteur EF.\n2) Calcule la distance EG.\n3) Détermine une équation de la droite (EF).'),
      Exercise('Problème', 9, 'Un commerçant du marché d\'Adawlato achète des pagnes à 3 500 FCFA l\'unité et les revend à 5 000 FCFA.\n1) Exprime son bénéfice B(x) pour x pagnes vendus.\n2) Combien de pagnes doit-il vendre pour gagner au moins 60 000 FCFA ?\n3) Représente B dans un repère.'),
    ],
  ),
  Subject(
    id: 'bac2-svt-d-2023',
    exam: 'BAC II',
    matiere: 'SVT',
    serie: 'Série D',
    year: 2023,
    duree: '4 h',
    coef: 5,
    pages: 4,
    verifiedBy: 'Mme Afi D., prof. certifiée · Kara',
    pro: true,
    views: 9310,
    exercises: [
      Exercise('Partie A — Restitution', 6, 'Explique le mécanisme de la transmission synaptique au niveau d\'une synapse neuro-neuronique excitatrice.'),
      Exercise('Partie B — Exploitation', 14, 'À partir des documents 1 à 3, montre comment le croisement de deux variétés de maïs permet d\'établir la localisation des gènes.'),
    ],
  ),
  Subject(
    id: 'cepd-francais-2024',
    exam: 'CEPD',
    matiere: 'Français',
    serie: '',
    year: 2024,
    duree: '1 h 30',
    coef: 3,
    pages: 1,
    verifiedBy: 'M. Yao K., instituteur · Atakpamé',
    offline: true,
    views: 12040,
    exercises: [
      Exercise('Lecture', 10, 'Lis le texte « Le marché de Vogan » puis réponds aux questions.'),
      Exercise('Rédaction', 10, 'Raconte une journée passée chez tes grands-parents au village.'),
    ],
  ),
  Subject(
    id: 'enam-cg-2022',
    exam: 'Concours ENAM',
    matiere: 'Culture générale',
    serie: '',
    year: 2022,
    duree: '3 h',
    coef: 4,
    pages: 2,
    verifiedBy: 'Comité de relecture EZOA-TO',
    pro: true,
    views: 4120,
    exercises: [Exercise('Dissertation', 20, '« La décentralisation est-elle une chance pour le développement local au Togo ? »')],
  ),
  Subject(
    id: 'ul-eco-l1-2024',
    exam: 'Université de Lomé',
    matiere: 'Microéconomie',
    serie: 'L1',
    year: 2024,
    duree: '2 h',
    coef: 3,
    pages: 3,
    verifiedBy: 'Dr. Essi M., FASEG',
    views: 2780,
    exercises: [Exercise('Exercice 1', 10, 'Soit la fonction d\'utilité U(x, y) = x·y. Détermine le panier optimal pour R = 1 200 et px = 20, py = 30.')],
  ),
  Subject(
    id: 'bac1-pc-c-2023',
    exam: 'BAC I',
    matiere: 'Physique-Chimie',
    serie: 'Série C',
    year: 2023,
    duree: '3 h',
    coef: 5,
    pages: 3,
    verifiedBy: 'M. Komi T., prof. PC · Sokodé',
    views: 6650,
    exercises: [Exercise('Exercice 1', 8, 'Un solide de masse 200 g glisse sur un plan incliné de 30°…')],
  ),
];

/// Fil scripté du tuteur IA : il guide par questions sans donner la réponse.
const tutorScript = <(String, String)>[
  (
    'Je dois factoriser A = (2x − 3)² − (x + 1)(2x − 3). Tu peux me donner la réponse ?',
    'Je ne vais pas te la donner directement, mais on va la trouver ensemble 💪\n\nRegarde bien les deux termes de A. Est-ce que tu vois une expression qui revient dans les deux ?'
  ),
  (
    'Euh… (2x − 3) ?',
    'Exactement ! (2x − 3) est un **facteur commun**.\n\nSi on le met en évidence, que reste-t-il dans le premier terme (2x − 3)², une fois qu\'on a « sorti » un (2x − 3) ?'
  ),
  (
    'Il reste (2x − 3)',
    'Bravo 👏 Maintenant fais pareil avec le deuxième terme, et écris A = (2x − 3)[ … − … ].\n\nAttention au signe moins devant les parenthèses !'
  ),
];

const tutorHints = ['Donne-moi un indice', 'Explique la méthode', 'Je me suis trompé ?'];
