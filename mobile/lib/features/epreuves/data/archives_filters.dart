import 'package:flutter/foundation.dart';

/// Filtres Archives — mappés sur les query params `GET /epreuves`.
@immutable
class ArchivesFilters {
  const ArchivesFilters({
    this.annee,
    this.type,
    this.niveau,
    this.periode,
    this.examen,
  });

  static const empty = ArchivesFilters();

  final int? annee;
  final String? type;
  final String? niveau;
  final String? periode;
  final String? examen;

  bool get isEmpty =>
      annee == null &&
      (type == null || type!.isEmpty) &&
      (niveau == null || niveau!.isEmpty) &&
      (periode == null || periode!.isEmpty) &&
      (examen == null || examen!.isEmpty);

  bool get isNotEmpty => !isEmpty;

  int get activeCount {
    var n = 0;
    if (annee != null) n++;
    if (type != null && type!.isNotEmpty) n++;
    if (niveau != null && niveau!.isNotEmpty) n++;
    if (periode != null && periode!.isNotEmpty) n++;
    if (examen != null && examen!.isNotEmpty) n++;
    return n;
  }

  ArchivesFilters copyWith({
    Object? annee = _sentinel,
    Object? type = _sentinel,
    Object? niveau = _sentinel,
    Object? periode = _sentinel,
    Object? examen = _sentinel,
    bool clearAnnee = false,
    bool clearType = false,
    bool clearNiveau = false,
    bool clearPeriode = false,
    bool clearExamen = false,
  }) {
    return ArchivesFilters(
      annee: clearAnnee
          ? null
          : (identical(annee, _sentinel) ? this.annee : annee as int?),
      type: clearType
          ? null
          : (identical(type, _sentinel) ? this.type : type as String?),
      niveau: clearNiveau
          ? null
          : (identical(niveau, _sentinel) ? this.niveau : niveau as String?),
      periode: clearPeriode
          ? null
          : (identical(periode, _sentinel) ? this.periode : periode as String?),
      examen: clearExamen
          ? null
          : (identical(examen, _sentinel) ? this.examen : examen as String?),
    );
  }

  static const Object _sentinel = Object();

  @override
  bool operator ==(Object other) {
    return other is ArchivesFilters &&
        other.annee == annee &&
        other.type == type &&
        other.niveau == niveau &&
        other.periode == periode &&
        other.examen == examen;
  }

  @override
  int get hashCode => Object.hash(annee, type, niveau, periode, examen);
}
