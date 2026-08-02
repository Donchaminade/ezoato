// Libellés FR pour les métadonnées d'épreuve (cartes, filtres).

String epreuveTypeLabel(String type) {
  switch (type) {
    case 'devoir':
      return 'Devoir';
    case 'composition':
      return 'Composition';
    case 'examen':
      return 'Examen';
    case 'corrige':
      return 'Corrigé';
    default:
      return type.isEmpty ? 'Épreuve' : type;
  }
}

String epreuvePeriodeLabel(String? periode) {
  if (periode == null || periode.isEmpty) return '';
  switch (periode) {
    case 'T1':
      return 'Trimestre 1';
    case 'T2':
      return 'Trimestre 2';
    case 'T3':
      return 'Trimestre 3';
    case 'S1':
      return 'Semestre 1';
    case 'S2':
      return 'Semestre 2';
    default:
      return periode;
  }
}

String epreuveNiveauLabel(String niveau) {
  switch (niveau) {
    case 'college':
      return 'Collège';
    case 'lycee':
      return 'Lycée';
    case 'universite':
      return 'Université';
    case 'concours':
      return 'Concours';
    default:
      return niveau;
  }
}

String epreuveExamenLabel(String? examen) {
  if (examen == null || examen.isEmpty) return '';
  switch (examen) {
    case 'BAC1':
      return 'BAC I';
    case 'BAC2':
      return 'BAC II';
    default:
      return examen;
  }
}

/// Ligne compacte pour overlay produit : « Composition · Trimestre 2 ».
String epreuveOverlayMetaLine({
  required String type,
  String? periode,
  String? examen,
}) {
  final parts = <String>[epreuveTypeLabel(type)];
  final exam = epreuveExamenLabel(examen);
  if (exam.isNotEmpty) {
    parts.add(exam);
  } else {
    final per = epreuvePeriodeLabel(periode);
    if (per.isNotEmpty) parts.add(per);
  }
  return parts.join(' · ');
}
