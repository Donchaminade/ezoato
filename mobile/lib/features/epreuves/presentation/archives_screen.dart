import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/connectivity_service.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../../offline/data/offline_repository.dart';
import '../data/archives_epreuves_provider.dart';

class ArchivesScreen extends ConsumerStatefulWidget {
  const ArchivesScreen({super.key});

  @override
  ConsumerState<ArchivesScreen> createState() => _ArchivesScreenState();
}

class _ArchivesScreenState extends ConsumerState<ArchivesScreen> {
  final _search = TextEditingController();
  Timer? _debounce;
  final _offlineIds = <String>{};
  String? _downloadingId;
  final Set<int> _prefetchTriggered = {};

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  void _onSearchChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      _prefetchTriggered.clear();
      ref.read(archivesSearchProvider.notifier).state = v;
    });
  }

  void _maybePrefetch(int index, PaginatedEpreuvesState paginated) {
    if (_prefetchTriggered.contains(index)) return;
    if (index < paginated.items.length - ArchivesEpreuvesNotifier.prefetchAhead) {
      return;
    }
    _prefetchTriggered.add(index);
    ref.read(archivesEpreuvesProvider.notifier).maybePrefetch(index);
  }

  Future<void> _onRefresh() async {
    _prefetchTriggered.clear();
    await ref.read(archivesEpreuvesProvider.notifier).refresh();
  }

  Future<void> _refreshOffline(Set<String> ids) async {
    final repo = ref.read(offlineRepositoryProvider);
    final set = <String>{};
    for (final id in ids) {
      if (await repo.isAvailable(id)) set.add(id);
    }
    if (mounted) setState(() => _offlineIds..clear()..addAll(set));
  }

  Future<void> _download(Epreuve epreuve) async {
    setState(() => _downloadingId = epreuve.id);
    try {
      await ref.read(offlineRepositoryProvider).download(epreuve);
      ref.invalidate(offlineListProvider);
      setState(() => _offlineIds.add(epreuve.id));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Épreuve disponible hors ligne')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _downloadingId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOnline = ref.watch(isOnlineProvider);
    final epreuvesAsync = ref.watch(archivesEpreuvesProvider);

    ref.listen(archivesEpreuvesProvider, (_, next) {
      next.whenData(
        (paginated) =>
            _refreshOffline(paginated.items.map((e) => e.id).toSet()),
      );
    });

    return EzoaScreen(
      title: 'Archives',
      subtitle: 'Recherchez et téléchargez',
      isOnline: isOnline,
      child: Column(
        children: [
          const SizedBox(height: 6),
          EzoaSearchField(
            controller: _search,
            hintText: 'Rechercher une épreuve…',
            enabled: isOnline,
            onChanged: isOnline ? _onSearchChanged : null,
          ),
          Expanded(
            child: !isOnline
                ? const EmptyState(
                    title: 'Archives indisponibles hors ligne',
                    message: 'Consultez Accueil ou Ma bibliothèque hors ligne',
                    icon: LucideIcons.wifiOff,
                  )
                : RefreshIndicator(
                    onRefresh: _onRefresh,
                    color: EzoaColors.of(context).accent,
                    child: epreuvesAsync.when(
                      data: (paginated) {
                        final items = paginated.items;
                        if (items.isEmpty) {
                          return ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: const [
                              SizedBox(height: 80),
                              EmptyState(
                                title: 'Aucun résultat',
                                message: 'Modifiez votre recherche',
                                icon: LucideIcons.searchX,
                              ),
                            ],
                          );
                        }
                        return CustomScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          slivers: [
                            SliverPadding(
                              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                              sliver: SliverGrid(
                                gridDelegate:
                                    const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  mainAxisSpacing: 12,
                                  crossAxisSpacing: 12,
                                  mainAxisExtent: 208,
                                ),
                                delegate: SliverChildBuilderDelegate(
                                  childCount: items.length,
                                  (context, i) {
                                    _maybePrefetch(i, paginated);
                                    final e = items[i];
                                    return EzoaStaggerReveal(
                                      index: i % 6,
                                      child: _ArchiveEpreuveGridCard(
                                        epreuve: e,
                                        isOffline: _offlineIds.contains(e.id),
                                        downloading: _downloadingId == e.id,
                                        onTap: () =>
                                            context.push('/epreuve/${e.id}'),
                                        onDownload: () => _download(e),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),
                            SliverToBoxAdapter(
                              child: _ArchivesListFooter(paginated: paginated),
                            ),
                          ],
                        );
                      },
                      loading: () => ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: const [
                          SizedBox(height: 120),
                          Center(child: EzoaGlassLoader()),
                        ],
                      ),
                      error: (e, _) => EmptyState(
                        title: 'Erreur',
                        message: '$e',
                        icon: LucideIcons.alertCircle,
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _ArchivesListFooter extends ConsumerWidget {
  const _ArchivesListFooter({required this.paginated});

  final PaginatedEpreuvesState paginated;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pal = EzoaColors.of(context);

    if (paginated.loadMoreError != null) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
        child: Column(
          children: [
            Text(
              'Impossible de charger la suite',
              style: TextStyle(color: pal.textDim, fontSize: 13),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            TextButton.icon(
              onPressed: () =>
                  ref.read(archivesEpreuvesProvider.notifier).retryLoadMore(),
              icon: Icon(LucideIcons.refreshCw, size: 16, color: pal.accent),
              label: Text('Réessayer', style: TextStyle(color: pal.accent)),
            ),
          ],
        ),
      );
    }

    if (paginated.isLoadingMore) {
      return const Padding(
        padding: EdgeInsets.fromLTRB(16, 20, 16, 110),
        child: Center(
          child: SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(strokeWidth: 2.5),
          ),
        ),
      );
    }

    if (!paginated.hasMore && paginated.items.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 110),
        child: Text(
          '${paginated.total} épreuve${paginated.total > 1 ? 's' : ''}',
          textAlign: TextAlign.center,
          style: TextStyle(color: pal.textFaint, fontSize: 12),
        ),
      );
    }

    return const SizedBox(height: 110);
  }
}

/// Carte compacte pour la grille Archives : zone dégradée matière, badges,
/// titre, méta classe/année et actions téléchargement.
class _ArchiveEpreuveGridCard extends StatelessWidget {
  const _ArchiveEpreuveGridCard({
    required this.epreuve,
    required this.isOffline,
    required this.downloading,
    required this.onTap,
    required this.onDownload,
  });

  final Epreuve epreuve;
  final bool isOffline;
  final bool downloading;
  final VoidCallback onTap;
  final VoidCallback onDownload;

  static const _gradients = [
    [Color(0xFF006A4E), Color(0xFF004D38)],
    [Color(0xFF4338CA), Color(0xFF312E81)],
    [Color(0xFF0E7490), Color(0xFF155E75)],
    [Color(0xFF7C3AED), Color(0xFF5B21B6)],
    [Color(0xFFB45309), Color(0xFF92400E)],
  ];

  IconData get _typeIcon {
    switch (epreuve.type) {
      case 'examen':
        return LucideIcons.graduationCap;
      case 'composition':
        return LucideIcons.clipboardList;
      case 'corrige':
        return LucideIcons.checkCircle2;
      default:
        return LucideIcons.fileText;
    }
  }

  String get _priceLabel {
    if (epreuve.requiresPayment == true && epreuve.prixFcfa != null) {
      return '${epreuve.prixFcfa} F';
    }
    return 'GRATUIT';
  }

  bool get _isPaid =>
      epreuve.requiresPayment == true && epreuve.prixFcfa != null;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final gradient =
        _gradients[epreuve.matiere.hashCode.abs() % _gradients.length];

    return EzoaGlassCard(
      margin: EdgeInsets.zero,
      padding: EdgeInsets.zero,
      borderRadius: 14,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 78,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: gradient,
                ),
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(14),
                ),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: -12,
                    right: -12,
                    child: Icon(
                      LucideIcons.sparkles,
                      size: 52,
                      color: Colors.white.withValues(alpha: 0.08),
                    ),
                  ),
                  Center(
                    child: Icon(
                      _typeIcon,
                      size: 28,
                      color: Colors.white.withValues(alpha: 0.88),
                    ),
                  ),
                  Positioned(
                    top: 7,
                    left: 7,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.32),
                        borderRadius: BorderRadius.circular(7),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.22),
                        ),
                      ),
                      child: Text(
                        epreuve.matiere.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 7.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                          color: Colors.white.withValues(alpha: 0.95),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 7,
                    right: 7,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(7),
                        border: Border.all(
                          color: (_isPaid ? EzoaColors.gold : EzoaColors.emerald)
                              .withValues(alpha: 0.65),
                        ),
                      ),
                      child: Text(
                        _priceLabel,
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 7.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.4,
                          color: _isPaid ? EzoaColors.gold : EzoaColors.emerald,
                        ),
                      ),
                    ),
                  ),
                  if (isOffline)
                    Positioned(
                      bottom: 7,
                      left: 7,
                      child: _ArchiveStatusDot(
                        icon: LucideIcons.hardDrive,
                        color: pal.emerald,
                        label: 'Hors ligne',
                      ),
                    ),
                ],
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 9, 10, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    epreuve.titre,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: pal.text,
                      height: 1.25,
                    ),
                  ),
                  const Spacer(),
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: [
                      _ArchiveMiniBadge(label: epreuve.classe),
                      _ArchiveMiniBadge(label: '${epreuve.annee}'),
                      if (epreuve.telechargements > 0)
                        _ArchiveMiniBadge(
                          label: formatCompteurCompact(epreuve.telechargements),
                          icon: LucideIcons.download,
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          epreuve.ville.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: EzoaTypography.badge(context).copyWith(
                            color: pal.textFaint,
                            fontSize: 7.5,
                          ),
                        ),
                      ),
                      _ArchiveDownloadButton(
                        downloading: downloading,
                        isOffline: isOffline,
                        onDownload: onDownload,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ArchiveStatusDot extends StatelessWidget {
  const _ArchiveStatusDot({
    required this.icon,
    required this.color,
    required this.label,
  });

  final IconData icon;
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.35),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.5)),
        ),
        child: Icon(icon, size: 11, color: color),
      ),
    );
  }
}

class _ArchiveDownloadButton extends StatelessWidget {
  const _ArchiveDownloadButton({
    required this.downloading,
    required this.isOffline,
    required this.onDownload,
  });

  final bool downloading;
  final bool isOffline;
  final VoidCallback onDownload;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: downloading || isOffline ? null : onDownload,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
          decoration: BoxDecoration(
            color: pal.subtleFill,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: pal.border),
          ),
          child: downloading
              ? SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.5,
                    color: pal.accent,
                  ),
                )
              : Icon(
                  isOffline ? LucideIcons.check : LucideIcons.download,
                  size: 13,
                  color: isOffline ? pal.emerald : pal.accent,
                ),
        ),
      ),
    );
  }
}

class _ArchiveMiniBadge extends StatelessWidget {
  const _ArchiveMiniBadge({required this.label, this.icon});

  final String label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: pal.subtleFill,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: pal.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 9, color: pal.textDim),
            const SizedBox(width: 3),
          ],
          Flexible(
            child: Text(
              label.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.jetBrainsMono(
                fontSize: 7.5,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.6,
                color: pal.textDim,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
