import 'dart:convert';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

import '../../../core/network/api_client.dart';
import '../../../shared/models/models.dart';

class OfflineRepository {
  OfflineRepository(this._api);

  final ApiClient _api;
  Database? _db;

  Future<Database> _database() async {
    if (_db != null) return _db!;
    final dir = await getApplicationDocumentsDirectory();
    final path = p.join(dir.path, 'ezoa_offline.db');
    _db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE offline_epreuves (
            id TEXT PRIMARY KEY,
            titre TEXT NOT NULL,
            matiere TEXT NOT NULL,
            metadata TEXT NOT NULL,
            local_pdf_path TEXT NOT NULL,
            downloaded_at TEXT NOT NULL
          )
        ''');
      },
    );
    return _db!;
  }

  Future<Directory> _offlineDir() async {
    final dir = await getApplicationDocumentsDirectory();
    final offline = Directory(p.join(dir.path, 'offline-epreuves'));
    if (!await offline.exists()) {
      await offline.create(recursive: true);
    }
    return offline;
  }

  /// Chemin conventionnel de la miniature locale (page 1).
  Future<String> previewPathFor(String id) async {
    final dir = await _offlineDir();
    return p.join(dir.path, '$id.preview.jpg');
  }

  /// Retourne le chemin si le fichier miniature existe.
  Future<String?> existingPreviewPath(String id) async {
    final path = await previewPathFor(id);
    if (await File(path).exists()) return path;
    return null;
  }

  Future<bool> isAvailable(String id) async {
    final db = await _database();
    final rows = await db.query(
      'offline_epreuves',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    return rows.isNotEmpty;
  }

  Future<List<OfflineEpreuve>> listAll() async {
    final db = await _database();
    final rows = await db.query('offline_epreuves', orderBy: 'downloaded_at DESC');
    return rows
        .map(
          (r) => OfflineEpreuve(
            id: r['id'] as String,
            titre: r['titre'] as String,
            matiere: r['matiere'] as String,
            metadata: r['metadata'] as String,
            localPdfPath: r['local_pdf_path'] as String,
            downloadedAt: r['downloaded_at'] as String,
          ),
        )
        .toList();
  }

  Epreuve? parseMetadata(OfflineEpreuve item) {
    try {
      final map = jsonDecode(item.metadata) as Map<String, dynamic>;
      return Epreuve.fromJson(map);
    } catch (_) {
      return null;
    }
  }

  Future<void> _cachePreview(Epreuve epreuve) async {
    try {
      final bytes = await _api.downloadEpreuvePreviewBytes(epreuve.id);
      if (bytes.isEmpty) return;
      final path = await previewPathFor(epreuve.id);
      await File(path).writeAsBytes(bytes, flush: true);
    } catch (_) {
      // Aperçu optionnel : le PDF hors ligne reste utilisable sans miniature.
    }
  }

  Future<String> pageImagePath(String id, int page) async {
    final dir = await _offlineDir();
    final n = page.toString().padLeft(2, '0');
    return p.join(dir.path, '$id.p$n.jpg');
  }

  Future<List<String>> existingPageImages(String id) async {
    final dir = await _offlineDir();
    if (!await dir.exists()) return [];
    final prefix = '$id.p';
    final files = dir
        .listSync()
        .whereType<File>()
        .where((f) => p.basename(f.path).startsWith(prefix) && f.path.endsWith('.jpg'))
        .toList();
    files.sort((a, b) => p.basename(a.path).compareTo(p.basename(b.path)));
    return files.map((f) => f.path).toList();
  }

  /// Accès enregistré au téléchargement. Null = quota sans échéance.
  bool lectureAutorisee(Epreuve? meta, [DateTime? now]) {
    final until = meta?.offlineAccessUntil;
    if (until == null || until.isEmpty) return true;
    final fin = DateTime.tryParse(until);
    if (fin == null) return true;
    return fin.isAfter(now ?? DateTime.now());
  }

  Future<void> _cachePages(Epreuve epreuve) async {
    final total = epreuve.pages < 1 ? 1 : (epreuve.pages > 20 ? 20 : epreuve.pages);
    for (var page = 1; page <= total; page++) {
      try {
        final bytes = await _api.downloadEpreuvePreviewBytes(epreuve.id, page: page);
        if (bytes.isEmpty) continue;
        final path = await pageImagePath(epreuve.id, page);
        await File(path).writeAsBytes(bytes, flush: true);
      } catch (_) {
        // Une page manquante n'empêche pas de garder le PDF.
      }
    }
  }

  Future<void> download(Epreuve epreuve, {String? accessUntil}) async {
    final bytes = await _api.downloadEpreuveBytes(epreuve.id);
    if (bytes.isEmpty) throw ApiException('Fichier vide');

    final dir = await _offlineDir();
    final filePath = p.join(dir.path, '${epreuve.id}.pdf');
    await File(filePath).writeAsBytes(bytes, flush: true);
    await _cachePreview(epreuve);
    await _cachePages(epreuve);

    final db = await _database();
    await db.insert(
      'offline_epreuves',
      {
        'id': epreuve.id,
        'titre': epreuve.titre,
        'matiere': epreuve.matiere,
        'metadata': jsonEncode({
          'id': epreuve.id,
          'titre': epreuve.titre,
          'matiere': epreuve.matiere,
          'niveau': epreuve.niveau,
          'classe': epreuve.classe,
          'annee': epreuve.annee,
          'type': epreuve.type,
          'ville': epreuve.ville,
          'pdfUrl': epreuve.pdfUrl,
          'pdfPreviewUrl': epreuve.pdfPreviewUrl,
          'thumbnailUrl': epreuve.thumbnailUrl,
          'pages': epreuve.pages,
          'tailleKo': epreuve.tailleKo,
          'telechargements': epreuve.telechargements,
          'soumisPar': epreuve.soumisPar,
          'soumisLe': epreuve.soumisLe,
          'statut': epreuve.statut,
          'requiresPayment': epreuve.requiresPayment,
          'requiresPro': epreuve.requiresPro,
          'accessTier': epreuve.accessTier,
          'prixFcfa': epreuve.prixFcfa,
          'offlineAccessUntil': accessUntil,
        }),
        'local_pdf_path': filePath,
        'downloaded_at': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> openPdf(String id) async {
    final db = await _database();
    final rows = await db.query(
      'offline_epreuves',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    if (rows.isEmpty) throw ApiException('Fichier introuvable');
    final path = rows.first['local_pdf_path'] as String;
    final result = await OpenFilex.open(path);
    if (result.type != ResultType.done) {
      throw ApiException('Ouverture impossible');
    }
  }

  Future<void> remove(String id) async {
    final db = await _database();
    final rows = await db.query(
      'offline_epreuves',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    if (rows.isNotEmpty) {
      final path = rows.first['local_pdf_path'] as String;
      final file = File(path);
      if (await file.exists()) await file.delete();
    }
    final preview = File(await previewPathFor(id));
    if (await preview.exists()) await preview.delete();
    for (final path in await existingPageImages(id)) {
      final file = File(path);
      if (await file.exists()) await file.delete();
    }
    await db.delete('offline_epreuves', where: 'id = ?', whereArgs: [id]);
  }
}

final offlineRepositoryProvider = Provider<OfflineRepository>((ref) {
  return OfflineRepository(ref.watch(apiClientProvider));
});

final offlineListProvider = FutureProvider<List<OfflineEpreuve>>((ref) async {
  return ref.watch(offlineRepositoryProvider).listAll();
});

/// Entrées hors ligne enrichies (métadonnées + chemin miniature locale).
class OfflineLibraryEntry {
  const OfflineLibraryEntry({
    required this.item,
    this.meta,
    this.previewPath,
  });

  final OfflineEpreuve item;
  final Epreuve? meta;
  final String? previewPath;
}

final offlineLibraryEntriesProvider =
    FutureProvider<List<OfflineLibraryEntry>>((ref) async {
  final repo = ref.watch(offlineRepositoryProvider);
  final items = await ref.watch(offlineListProvider.future);
  final entries = <OfflineLibraryEntry>[];
  for (final item in items) {
    entries.add(
      OfflineLibraryEntry(
        item: item,
        meta: repo.parseMetadata(item),
        previewPath: await repo.existingPreviewPath(item.id),
      ),
    );
  }
  return entries;
});
