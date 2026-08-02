import 'dart:io';
import 'dart:typed_data';

import 'package:image/image.dart' as img;
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../domain/scanned_page.dart';

/// Applique un filtre style document / contraste sur une image locale.
class DocumentImageProcessor {
  const DocumentImageProcessor();

  /// Retourne le chemin d'une nouvelle image JPEG filtrée (ou [sourcePath]
  /// si le filtre est [DocumentFilter.original]).
  Future<String> applyFilter({
    required String sourcePath,
    required DocumentFilter filter,
    String? pageId,
  }) async {
    if (filter == DocumentFilter.original) return sourcePath;

    final bytes = await File(sourcePath).readAsBytes();
    final decoded = img.decodeImage(bytes);
    if (decoded == null) {
      throw StateError('Image illisible : $sourcePath');
    }

    // Réduit les très grandes photos (Samsung) pour rester raisonnable en PDF.
    final base = decoded.width > 2000
        ? img.copyResize(decoded, width: 2000)
        : decoded;

    final processed = switch (filter) {
      DocumentFilter.document => _documentLook(base),
      DocumentFilter.contrast => _boostContrast(base),
      DocumentFilter.original => base,
    };

    final outBytes = Uint8List.fromList(
      img.encodeJpg(processed, quality: 88),
    );
    final dir = await getTemporaryDirectory();
    final name =
        'scan_${pageId ?? DateTime.now().millisecondsSinceEpoch}_${filter.name}.jpg';
    final out = File(p.join(dir.path, name));
    await out.writeAsBytes(outBytes, flush: true);
    return out.path;
  }

  /// Niveaux + niveaux de gris pour un rendu « document » lisible.
  img.Image _documentLook(img.Image src) {
    var g = img.grayscale(src);
    g = img.adjustColor(
      g,
      contrast: 1.35,
      brightness: 1.05,
    );
    return img.contrast(g, contrast: 120);
  }

  img.Image _boostContrast(img.Image src) {
    return img.adjustColor(
      src,
      contrast: 1.45,
      saturation: 0.85,
    );
  }
}
