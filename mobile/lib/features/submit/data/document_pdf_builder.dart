import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

/// Assemble une liste de chemins d'images en un PDF multipage A4.
class DocumentPdfBuilder {
  const DocumentPdfBuilder();

  Future<String> buildFromImagePaths(List<String> imagePaths) async {
    if (imagePaths.isEmpty) {
      throw ArgumentError('Aucune page à assembler.');
    }

    final doc = pw.Document(
      title: 'Soumission EZOA-TO',
      creator: 'EZOA-TO Scanner',
    );

    for (final path in imagePaths) {
      final bytes = await File(path).readAsBytes();
      final image = pw.MemoryImage(bytes);
      doc.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(24),
          build: (context) {
            return pw.Center(
              child: pw.Image(image, fit: pw.BoxFit.contain),
            );
          },
        ),
      );
    }

    final dir = await getTemporaryDirectory();
    final outPath = p.join(
      dir.path,
      'soumission_${DateTime.now().millisecondsSinceEpoch}.pdf',
    );
    final file = File(outPath);
    await file.writeAsBytes(await doc.save(), flush: true);
    return outPath;
  }
}
