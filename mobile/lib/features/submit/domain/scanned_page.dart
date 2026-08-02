/// Une page du scanner de soumission (chemin image local + filtre appliqué).
enum DocumentFilter {
  original,
  document,
  contrast,
}

extension DocumentFilterLabel on DocumentFilter {
  String get labelFr {
    switch (this) {
      case DocumentFilter.original:
        return 'Original';
      case DocumentFilter.document:
        return 'Document';
      case DocumentFilter.contrast:
        return 'Contraste';
    }
  }
}

class ScannedPage {
  const ScannedPage({
    required this.id,
    required this.path,
    required this.originalPath,
    this.filter = DocumentFilter.document,
  });

  final String id;

  /// Image affichée / exportée (éventuellement filtrée).
  final String path;

  /// Image recadrée avant filtre — source pour réappliquer un filtre.
  final String originalPath;

  final DocumentFilter filter;

  ScannedPage copyWith({
    String? path,
    String? originalPath,
    DocumentFilter? filter,
  }) {
    return ScannedPage(
      id: id,
      path: path ?? this.path,
      originalPath: originalPath ?? this.originalPath,
      filter: filter ?? this.filter,
    );
  }
}
