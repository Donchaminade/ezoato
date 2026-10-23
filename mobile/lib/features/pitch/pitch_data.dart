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
    this.pageAssets = const [],
    this.sourceUrl,
    this.region = 'Examen national · Togo',
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
  /// Pages réelles du sujet (images compressées embarquées dans l'APK de démo).
  final List<String> pageAssets;
  /// Page d'origine du sujet (crédit obligatoire).
  final String? sourceUrl;
  final String region;
  String get sourceLabel => sourceUrl == null ? '' : 'Source : epreuvesetcorriges.com';

  String get examLabel => exam.startsWith('Concours') ? 'Concours' : exam.startsWith('Université') ? 'Université' : exam;
  Exam get examInfo => exams.firstWhere((e) => e.label == examLabel, orElse: () => exams[1]);

  String get title => '$exam${serie.isEmpty ? '' : ' $serie'} · $matiere $year';
}

/// Sujets RÉELS (démo uniquement) — examens nationaux du Togo, publiés gratuitement
/// sur epreuvesetcorriges.com. Chaque sujet affiche le crédit « Source : epreuvesetcorriges.com ».
final subjects = <Subject>[
  Subject(
    id: 'ec-42934',
    exam: 'BEPC',
    matiere: 'Mathématiques',
    serie: '',
    year: 2026,
    duree: '2 h',
    coef: 4,
    pages: 2,
    verifiedBy: 'Sujet officiel · crédit epreuvesetcorriges.com',
    exercises: const [],
    pageAssets: ['assets/demo_subjects/ec42934-1.jpg', 'assets/demo_subjects/ec42934-2.jpg'],
    sourceUrl: 'https://epreuvesetcorriges.com/categories/togo/examens/bepc/42934-bepc-2026-mathematiques-togo-pdf',
    offline: true,
    views: 18420,
  ),
  Subject(
    id: 'ec-42932',
    exam: 'BEPC',
    matiere: 'Français',
    serie: '',
    year: 2026,
    duree: '2 h',
    coef: 4,
    pages: 2,
    verifiedBy: 'Sujet officiel · crédit epreuvesetcorriges.com',
    exercises: const [],
    pageAssets: ['assets/demo_subjects/ec42932-1.jpg', 'assets/demo_subjects/ec42932-2.jpg'],
    sourceUrl: 'https://epreuvesetcorriges.com/categories/togo/examens/bepc/42932-bepc-2026-francais-togo-pdf',
    offline: true,
    views: 15230,
  ),
  Subject(
    id: 'ec-42935',
    exam: 'BEPC',
    matiere: 'Physique-Chimie (PCT)',
    serie: '',
    year: 2026,
    duree: '2 h',
    coef: 3,
    pages: 2,
    verifiedBy: 'Sujet officiel · crédit epreuvesetcorriges.com',
    exercises: const [],
    pageAssets: ['assets/demo_subjects/ec42935-1.jpg', 'assets/demo_subjects/ec42935-2.jpg'],
    sourceUrl: 'https://epreuvesetcorriges.com/categories/togo/examens/bepc/42935-bepc-2026-pct-togo-pdf',
    views: 9870,
  ),
  Subject(
    id: 'ec-42926',
    exam: 'BEPC',
    matiere: 'Anglais',
    serie: '',
    year: 2026,
    duree: '2 h',
    coef: 2,
    pages: 2,
    verifiedBy: 'Sujet officiel · crédit epreuvesetcorriges.com',
    exercises: const [],
    pageAssets: ['assets/demo_subjects/ec42926-1.jpg', 'assets/demo_subjects/ec42926-2.jpg'],
    sourceUrl: 'https://epreuvesetcorriges.com/categories/togo/examens/bepc/42926-bepc-2026-anglais-togo-pdf',
    offline: true,
    views: 8140,
  ),
  Subject(
    id: 'ec-42929',
    exam: 'BEPC',
    matiere: 'ECM',
    serie: '',
    year: 2026,
    duree: '1 h',
    coef: 1,
    pages: 2,
    verifiedBy: 'Sujet officiel · crédit epreuvesetcorriges.com',
    exercises: const [],
    pageAssets: ['assets/demo_subjects/ec42929-1.jpg', 'assets/demo_subjects/ec42929-2.jpg'],
    sourceUrl: 'https://epreuvesetcorriges.com/categories/togo/examens/bepc/42929-bepc-2026-ecm-togo-pdf',
    views: 5210,
  ),
  Subject(
    id: 'ec-35834',
    exam: 'BAC I',
    matiere: 'Mathématiques',
    serie: 'Série C4',
    year: 2024,
    duree: '4 h',
    coef: 5,
    pages: 2,
    verifiedBy: 'Sujet officiel · crédit epreuvesetcorriges.com',
    exercises: const [],
    pageAssets: ['assets/demo_subjects/ec35834-1.jpg', 'assets/demo_subjects/ec35834-2.jpg'],
    sourceUrl: 'https://epreuvesetcorriges.com/categories/togo/examens/bac/35834-epreuve-bac1-2024-mathematiques-serie-c4',
    views: 7720,
  ),
  Subject(
    id: 'ec-39824',
    exam: 'BAC II',
    matiere: 'Anglais',
    serie: 'Série A4',
    year: 2025,
    duree: '3 h',
    coef: 3,
    pages: 2,
    verifiedBy: 'Sujet officiel · crédit epreuvesetcorriges.com',
    exercises: const [],
    pageAssets: ['assets/demo_subjects/ec39824-1.jpg', 'assets/demo_subjects/ec39824-2.jpg'],
    sourceUrl: 'https://epreuvesetcorriges.com/categories/togo/examens/bac/39824-epreuve-d-anglais-baccalaureat-2025-serie-a4-togo',
    pro: true,
    views: 6930,
  ),
  Subject(
    id: 'ec-1818',
    exam: 'BAC II',
    matiere: 'SVT',
    serie: 'Série A4',
    year: 2020,
    duree: '2 h',
    coef: 1,
    pages: 3,
    verifiedBy: 'Sujet officiel · crédit epreuvesetcorriges.com',
    exercises: const [],
    pageAssets: ['assets/demo_subjects/ec1818-1.jpg', 'assets/demo_subjects/ec1818-2.jpg', 'assets/demo_subjects/ec1818-3.jpg'],
    sourceUrl: 'https://epreuvesetcorriges.com/categories/togo/examens/bac/1818-epreuve-bac-a4-2020-svt-togo',
    views: 4310,
  ),
  Subject(
    id: 'ec-1817',
    exam: 'BAC II',
    matiere: 'Anglais',
    serie: 'Série A4',
    year: 2020,
    duree: '3 h',
    coef: 3,
    pages: 2,
    verifiedBy: 'Sujet officiel · crédit epreuvesetcorriges.com',
    exercises: const [],
    pageAssets: ['assets/demo_subjects/ec1817-1.jpg', 'assets/demo_subjects/ec1817-2.jpg'],
    sourceUrl: 'https://epreuvesetcorriges.com/categories/togo/examens/bac/1817-epreuve-bac-a4-2020-anglais-togo',
    views: 3980,
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
