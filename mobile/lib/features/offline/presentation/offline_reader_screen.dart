import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/offline_repository.dart';

/// Relecture hors ligne des pages enregistrées (zoom, pages, mode sombre).
class OfflineReaderScreen extends ConsumerStatefulWidget {
  const OfflineReaderScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<OfflineReaderScreen> createState() => _OfflineReaderScreenState();
}

class _OfflineReaderScreenState extends ConsumerState<OfflineReaderScreen> {
  List<String> _pages = const [];
  bool _loading = true;
  bool _expired = false;
  bool _paperDark = false;
  int _page = 1;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final repo = ref.read(offlineRepositoryProvider);
    final items = await repo.listAll();
    final item = items.where((e) => e.id == widget.id).firstOrNull;
    final meta = item == null ? null : repo.parseMetadata(item);
    final pages = await repo.existingPageImages(widget.id);
    if (!mounted) return;
    setState(() {
      _pages = pages;
      _expired = item != null && !repo.lectureAutorisee(meta);
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    return Scaffold(
      backgroundColor: _paperDark ? const Color(0xFF121816) : pal.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text('Réviser hors ligne', style: EzoaTypography.titleMedium(context)),
        actions: [
          IconButton(
            tooltip: _paperDark ? 'Mode clair' : 'Mode sombre',
            onPressed: () => setState(() => _paperDark = !_paperDark),
            icon: Icon(_paperDark ? LucideIcons.sun : LucideIcons.moon),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _expired
              ? const EmptyState(
                  title: 'Accès expiré',
                  message:
                      'Cette copie Pro n\'est plus lisible hors ligne. Reconnecte-toi pour renouveler l\'abonnement.',
                  icon: LucideIcons.lock,
                )
              : _pages.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const EmptyState(
                              title: 'Pages non enregistrées',
                              message:
                                  'Le PDF est en local. Ouvre-le si l\'aperçu page à page manque.',
                              icon: LucideIcons.fileX,
                            ),
                            EzoaButton(
                              label: 'Ouvrir le PDF',
                              onPressed: () =>
                                  ref.read(offlineRepositoryProvider).openPdf(widget.id),
                            ),
                          ],
                        ),
                      ),
                    )
                  : Column(
                      children: [
                        Expanded(
                          child: PageView.builder(
                            itemCount: _pages.length,
                            onPageChanged: (i) => setState(() => _page = i + 1),
                            itemBuilder: (_, index) {
                              final image = InteractiveViewer(
                                maxScale: 5,
                                child: Image.file(File(_pages[index]), fit: BoxFit.contain),
                              );
                              if (!_paperDark) return image;
                              return ColorFiltered(
                                colorFilter: const ColorFilter.matrix(<double>[
                                  -1, 0, 0, 0, 255,
                                  0, -1, 0, 0, 255,
                                  0, 0, -1, 0, 255,
                                  0, 0, 0, 1, 0,
                                ]),
                                child: image,
                              );
                            },
                          ),
                        ),
                        SafeArea(
                          top: false,
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Text(
                              'Page $_page / ${_pages.length} · pincez pour zoomer',
                              style: EzoaTypography.bodySmall(context),
                            ),
                          ),
                        ),
                      ],
                    ),
    );
  }
}
