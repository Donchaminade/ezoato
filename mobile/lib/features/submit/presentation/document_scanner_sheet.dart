import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/document_image_processor.dart';
import '../domain/scanned_page.dart';

/// Résultat renvoyé au formulaire de soumission.
class DocumentScannerResult {
  const DocumentScannerResult({required this.pages});

  final List<ScannedPage> pages;
}

/// Feuille plein écran : capturer / importer, recadrer, filtrer, réordonner.
Future<DocumentScannerResult?> showDocumentScannerSheet(
  BuildContext context, {
  List<ScannedPage> initialPages = const [],
}) {
  return Navigator.of(context).push<DocumentScannerResult>(
    MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => DocumentScannerSheet(initialPages: initialPages),
    ),
  );
}

class DocumentScannerSheet extends StatefulWidget {
  const DocumentScannerSheet({
    super.key,
    this.initialPages = const [],
  });

  final List<ScannedPage> initialPages;

  @override
  State<DocumentScannerSheet> createState() => _DocumentScannerSheetState();
}

class _DocumentScannerSheetState extends State<DocumentScannerSheet> {
  final _picker = ImagePicker();
  final _processor = const DocumentImageProcessor();
  late List<ScannedPage> _pages;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _pages = [...widget.initialPages];
  }

  Future<String?> _crop(String path) async {
    final cropped = await ImageCropper().cropImage(
      sourcePath: path,
      compressFormat: ImageCompressFormat.jpg,
      compressQuality: 90,
      uiSettings: [
        AndroidUiSettings(
          toolbarTitle: 'Recadrer',
          toolbarColor: EzoaColors.primary,
          toolbarWidgetColor: Colors.white,
          activeControlsWidgetColor: EzoaColors.primary,
          initAspectRatio: CropAspectRatioPreset.original,
          lockAspectRatio: false,
          aspectRatioPresets: const [
            CropAspectRatioPreset.original,
            CropAspectRatioPreset.ratio4x3,
            CropAspectRatioPreset.ratio16x9,
            CropAspectRatioPreset.square,
          ],
        ),
        IOSUiSettings(
          title: 'Recadrer',
          aspectRatioPresets: const [
            CropAspectRatioPreset.original,
            CropAspectRatioPreset.ratio4x3,
            CropAspectRatioPreset.ratio16x9,
            CropAspectRatioPreset.square,
          ],
        ),
      ],
    );
    return cropped?.path;
  }

  Future<DocumentFilter?> _pickFilter(DocumentFilter current) async {
    return showModalBottomSheet<DocumentFilter>(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        final pal = EzoaColors.of(ctx);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Filtre de page',
                  style: EzoaTypography.titleSmall(ctx),
                ),
                const SizedBox(height: 8),
                Text(
                  'Document = noir & blanc contrasté · Contraste = couleurs renforcées',
                  style: EzoaTypography.bodySmall(ctx),
                ),
                const SizedBox(height: 12),
                for (final f in DocumentFilter.values)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      f == DocumentFilter.document
                          ? LucideIcons.fileText
                          : f == DocumentFilter.contrast
                              ? LucideIcons.sun
                              : LucideIcons.image,
                      color: f == current ? pal.emerald : pal.textMuted,
                      size: 20,
                    ),
                    title: Text(f.labelFr),
                    trailing: f == current
                        ? Icon(LucideIcons.check, color: pal.emerald, size: 18)
                        : null,
                    onTap: () => Navigator.pop(ctx, f),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _ingestPaths(List<String> paths) async {
    if (paths.isEmpty) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final added = <ScannedPage>[];
      for (final raw in paths) {
        if (!mounted) return;
        final cropped = await _crop(raw);
        if (cropped == null) continue;

        final filter = await _pickFilter(DocumentFilter.document) ??
            DocumentFilter.document;
        final id = '${DateTime.now().microsecondsSinceEpoch}_${added.length}';
        final filtered = await _processor.applyFilter(
          sourcePath: cropped,
          filter: filter,
          pageId: id,
        );
        added.add(
          ScannedPage(
            id: id,
            path: filtered,
            originalPath: cropped,
            filter: filter,
          ),
        );
      }
      if (!mounted) return;
      setState(() => _pages = [..._pages, ...added]);
    } catch (e) {
      if (mounted) setState(() => _error = 'Traitement impossible : $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _takePhoto() async {
    try {
      final photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 92,
      );
      if (photo == null) return;
      await _ingestPaths([photo.path]);
    } catch (e) {
      setState(() => _error = 'Appareil photo indisponible : $e');
    }
  }

  Future<void> _pickGallery() async {
    try {
      final picked = await _picker.pickMultiImage(imageQuality: 92);
      if (picked.isEmpty) return;
      await _ingestPaths(picked.map((e) => e.path).toList());
    } catch (e) {
      setState(() => _error = 'Galerie indisponible : $e');
    }
  }

  Future<void> _recropPage(int index) async {
    final page = _pages[index];
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final cropped = await _crop(page.originalPath);
      if (cropped == null) return;
      final filtered = await _processor.applyFilter(
        sourcePath: cropped,
        filter: page.filter,
        pageId: page.id,
      );
      if (!mounted) return;
      setState(() {
        _pages = [..._pages];
        _pages[index] = page.copyWith(
          path: filtered,
          originalPath: cropped,
        );
      });
    } catch (e) {
      if (mounted) setState(() => _error = 'Recadrage impossible : $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _refilterPage(int index) async {
    final page = _pages[index];
    final next = await _pickFilter(page.filter);
    if (next == null || next == page.filter) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final filtered = await _processor.applyFilter(
        sourcePath: page.originalPath,
        filter: next,
        pageId: '${page.id}_${next.name}',
      );
      if (!mounted) return;
      setState(() {
        _pages = [..._pages];
        _pages[index] = page.copyWith(path: filtered, filter: next);
      });
    } catch (e) {
      if (mounted) setState(() => _error = 'Filtre impossible : $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _removePage(int index) {
    setState(() => _pages = [..._pages]..removeAt(index));
  }

  void _onReorder(int oldIndex, int newIndex) {
    setState(() {
      if (newIndex > oldIndex) newIndex -= 1;
      final item = _pages.removeAt(oldIndex);
      _pages.insert(newIndex, item);
    });
  }

  void _confirm() {
    if (_pages.isEmpty) {
      setState(() => _error = 'Ajoute au moins une page.');
      return;
    }
    Navigator.of(context).pop(DocumentScannerResult(pages: _pages));
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Scaffold(
      backgroundColor: pal.background,
      appBar: AppBar(
        title: Text(
          'Scanner',
          style: EzoaTypography.titleSmall(context),
        ),
        actions: [
          TextButton(
            onPressed: _busy || _pages.isEmpty ? null : _confirm,
            child: const Text('Utiliser'),
          ),
        ],
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Text(
                  'Photographiez ou importez vos pages, recadrez-les, '
                  'appliquez un filtre document, puis réordonnez.',
                  style: EzoaTypography.bodySmall(context),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _busy ? null : _takePhoto,
                        icon: const Icon(LucideIcons.camera, size: 17),
                        label: const Text('Caméra'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _busy ? null : _pickGallery,
                        icon: const Icon(LucideIcons.image, size: 17),
                        label: const Text('Galerie'),
                      ),
                    ),
                  ],
                ),
              ),
              if (_error != null) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Text(
                    _error!,
                    style: EzoaTypography.bodySmall(context)
                        .copyWith(color: pal.error),
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Expanded(
                child: _pages.isEmpty
                    ? const Center(
                        child: EmptyState(
                          title: 'Aucune page',
                          message:
                              'Utilisez la caméra ou la galerie pour ajouter des pages.',
                          icon: LucideIcons.camera,
                        ),
                      )
                    : ReorderableListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                        itemCount: _pages.length,
                        onReorder: _busy ? (_, __) {} : _onReorder,
                        proxyDecorator: (child, index, animation) {
                          return Material(
                            elevation: 2,
                            borderRadius: BorderRadius.circular(12),
                            child: child,
                          );
                        },
                        itemBuilder: (context, index) {
                          final page = _pages[index];
                          return _PageTile(
                            key: ValueKey(page.id),
                            index: index,
                            page: page,
                            enabled: !_busy,
                            onRecrop: () => _recropPage(index),
                            onFilter: () => _refilterPage(index),
                            onRemove: () => _removePage(index),
                          );
                        },
                      ),
              ),
            ],
          ),
          if (_busy)
            ColoredBox(
              color: Colors.black.withValues(alpha: 0.25),
              child: const Center(child: EzoaGlassLoader()),
            ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: EzoaButton(
            label: _pages.isEmpty
                ? 'Ajouter des pages'
                : 'Utiliser ${_pages.length} page(s)',
            icon: LucideIcons.check,
            disabled: _busy || _pages.isEmpty,
            onPressed: _confirm,
          ),
        ),
      ),
    );
  }
}

class _PageTile extends StatelessWidget {
  const _PageTile({
    super.key,
    required this.index,
    required this.page,
    required this.enabled,
    required this.onRecrop,
    required this.onFilter,
    required this.onRemove,
  });

  final int index;
  final ScannedPage page;
  final bool enabled;
  final VoidCallback onRecrop;
  final VoidCallback onFilter;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: pal.subtleFill,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: pal.border),
      ),
      child: Row(
        children: [
          ReorderableDragStartListener(
            index: index,
            enabled: enabled,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Icon(LucideIcons.gripVertical, size: 18, color: pal.textFaint),
            ),
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.file(
              File(page.path),
              width: 56,
              height: 72,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                width: 56,
                height: 72,
                color: pal.inputFill,
                alignment: Alignment.center,
                child: Icon(LucideIcons.imageOff, size: 18, color: pal.textFaint),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Page ${index + 1}',
                  style: EzoaTypography.titleSmall(context).copyWith(fontSize: 14),
                ),
                const SizedBox(height: 2),
                Text(
                  'Filtre : ${page.filter.labelFr}',
                  style: EzoaTypography.bodySmall(context),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 4,
                  children: [
                    TextButton(
                      onPressed: enabled ? onRecrop : null,
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                      child: const Text('Recadrer'),
                    ),
                    TextButton(
                      onPressed: enabled ? onFilter : null,
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                      child: const Text('Filtre'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: enabled ? onRemove : null,
            icon: Icon(LucideIcons.trash2, size: 16, color: pal.textFaint),
          ),
        ],
      ),
    );
  }
}
