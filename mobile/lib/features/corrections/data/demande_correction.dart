class QcmGuide {
  const QcmGuide({required this.id, required this.prompt, required this.choices});

  final String id;
  final String prompt;
  final List<String> choices;

  factory QcmGuide.fromJson(Map<String, dynamic> json) {
    final raw = json['choices'];
    return QcmGuide(
      id: '${json['id'] ?? ''}',
      prompt: '${json['prompt'] ?? ''}',
      choices: raw is List ? raw.map((item) => '$item').toList() : const [],
    );
  }
}

class GuideCorrection {
  const GuideCorrection({
    required this.explications,
    required this.exemples,
    required this.qcm,
  });

  final String explications;
  final List<String> exemples;
  final List<QcmGuide> qcm;

  factory GuideCorrection.fromJson(Map<String, dynamic> json) {
    final exemples = json['exemples'];
    final qcm = json['qcm'];
    return GuideCorrection(
      explications: '${json['explications'] ?? ''}',
      exemples: exemples is List ? exemples.map((item) => '$item').toList() : const [],
      qcm: qcm is List
          ? qcm.whereType<Map>().map((item) => QcmGuide.fromJson(Map<String, dynamic>.from(item))).toList()
          : const [],
    );
  }
}

class DemandeCorrection {
  const DemandeCorrection({
    required this.id,
    required this.epreuveId,
    required this.epreuveTitre,
    required this.matiere,
    required this.niveau,
    required this.exercices,
    required this.statut,
    this.blocageTexte,
    this.transcription,
    this.montant,
    this.guide,
    this.livraison,
  });

  final String id;
  final String epreuveId;
  final String epreuveTitre;
  final String matiere;
  final String niveau;
  final List<String> exercices;
  final String statut;
  final String? blocageTexte;
  final String? transcription;
  final int? montant;
  final GuideCorrection? guide;
  final String? livraison;

  factory DemandeCorrection.fromJson(Map<String, dynamic> json) {
    final exercices = json['exercices'];
    final guide = json['guide'];
    final livraison = json['livraison'];
    return DemandeCorrection(
      id: '${json['id'] ?? ''}',
      epreuveId: '${json['epreuveId'] ?? ''}',
      epreuveTitre: '${json['epreuveTitre'] ?? 'Épreuve'}',
      matiere: '${json['matiere'] ?? ''}',
      niveau: '${json['niveau'] ?? ''}',
      exercices: exercices is List ? exercices.map((item) => '$item').toList() : const [],
      statut: '${json['statut'] ?? ''}',
      blocageTexte: json['blocageTexte'] as String?,
      transcription: json['transcription'] as String?,
      montant: (json['montant'] as num?)?.toInt(),
      guide: guide is Map ? GuideCorrection.fromJson(Map<String, dynamic>.from(guide)) : null,
      livraison: livraison is Map ? '${livraison['contenu'] ?? ''}' : null,
    );
  }
}

const statutDemandeLabel = <String, String>{
  'en_attente_reglement': 'En attente de règlement',
  'recue': 'Reçue',
  'traitee_ia': 'Aide de l\'IA',
  'en_attente_admin': 'Chez l\'administration',
  'confirmee_admin': 'Confirmée, à assigner',
  'assignee': 'Chez le correcteur',
  'en_revue': 'En revue',
  'rejetee': 'Revue rejetée',
  'livree': 'Livrée',
  'annulee': 'Annulée',
};
