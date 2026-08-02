import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/connectivity_service.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/epreuve_thumbnail.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../../offline/data/offline_repository.dart';
import '../data/archives_epreuves_provider.dart';
import '../data/archives_filters.dart';
import 'archives_filter_sheet.dart';

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

  void _clearSearch() {
    _debounce?.cancel();
    _search.clear();
    _prefetchTriggered.clear();
    ref.read(archivesSearchProvider.notifier).state = '';
  }

  void _clearFilters() {
    _prefetchTriggered.clear();
    ref.read(archivesFiltersProvider.notifier).state = ArchivesFilters.empty;
  }

  void _clearSearchAndFilters() {
    _clearSearch();
    _clearFilters();
  }

  Future<void> _openFilters() async {
    final current = ref.read(archivesFiltersProvider);
    final result = await showArchivesFilterSheet(context, initial: current);
    if (result == null || !mounted) return;
    _prefetchTriggered.clear();
    ref.read(archivesFiltersProvider.notifier).state = result;
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
    final filters = ref.watch(archivesFiltersProvider);
    final searchQ = ref.watch(archivesSearchProvider);
    final pal = EzoaColors.of(context);

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
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: EzoaSearchField(
                    controller: _search,
                    hintText: 'Rechercher une épreuve…',
                    enabled: isOnline,
                    margin: EdgeInsets.zero,
                    onChanged: isOnline ? _onSearchChanged : null,
                    onClear: isOnline ? _clearSearch : null,
                  ),
                ),
                const SizedBox(width: 8),
                _FilterIconButton(
                  enabled: isOnline,
                  activeCount: filters.activeCount,
                  onTap: isOnline ? _openFilters : null,
                ),
              ],
            ),
          ),
          if (filters.isNotEmpty || searchQ.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    if (searchQ.isNotEmpty)
                      _ActiveClearChip(
                        label: 'Recherche',
                        onClear: _clearSearch,
                      ),
                    if (filters.annee != null)
                      _ActiveClearChip(
                        label: '${filters.annee}',
                        onClear: () {
                          _prefetchTriggered.clear();
                          ref.read(archivesFiltersProvider.notifier).state =
                              filters.copyWith(clearAnnee: true);
                        },
                      ),
                    if (filters.type != null)
                      _ActiveClearChip(
                        label: epreuveTypeLabel(filters.type!),
                        onClear: () {
                          _prefetchTriggered.clear();
                          ref.read(archivesFiltersProvider.notifier).state =
                              filters.copyWith(
                            clearType: true,
                            clearExamen: filters.type == 'examen',
                          );
                        },
                      ),
                    if (filters.niveau != null)
                      _ActiveClearChip(
                        label: epreuveNiveauLabel(filters.niveau!),
                        onClear: () {
                          _prefetchTriggered.clear();
                          ref.read(archivesFiltersProvider.notifier).state =
                              filters.copyWith(clearNiveau: true);
                        },
                      ),
                    if (filters.periode != null)
                      _ActiveClearChip(
                        label: epreuvePeriodeLabel(filters.periode),
                        onClear: () {
                          _prefetchTriggered.clear();
                          ref.read(archivesFiltersProvider.notifier).state =
                              filters.copyWith(clearPeriode: true);
                        },
                      ),
                    if (filters.examen != null)
                      _ActiveClearChip(
                        label: epreuveExamenLabel(filters.examen),
                        onClear: () {
                          _prefetchTriggered.clear();
                          ref.read(archivesFiltersProvider.notifier).state =
                              filters.copyWith(clearExamen: true);
                        },
                      ),
                    if (filters.isNotEmpty || searchQ.isNotEmpty)
                      TextButton(
                        onPressed: _clearSearchAndFilters,
                        style: TextButton.styleFrom(
                          foregroundColor: pal.accent,
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('Tout effacer'),
                      ),
                  ],
                ),
              ),
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
                            children: [
                              const SizedBox(height: 80),
                              EmptyState(
                                title: 'Aucun résultat',
                                message: filters.isNotEmpty || searchQ.isNotEmpty
                                    ? 'Modifiez la recherche ou les filtres'
                                    : 'Modifiez votre recherche',
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
                                  mainAxisExtent: 232,
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

class _FilterIconButton extends StatelessWidget {
  const _FilterIconButton({
    required this.enabled,
    required this.activeCount,
    required this.onTap,
  });

  final bool enabled;
  final int activeCount;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final active = activeCount > 0;

    return EzoaGlassCard(
      margin: EdgeInsets.zero,
      padding: EdgeInsets.zero,
      enableShine: false,
      blurSigma: 14,
      onTap: onTap,
      child: SizedBox(
        width: 48,
        height: 48,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(
              LucideIcons.slidersHorizontal,
              size: 20,
              color: !enabled
                  ? pal.textFaint
                  : active
                      ? pal.accent
                      : pal.textDim,
            ),
            if (active)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  width: 16,
                  height: 16,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: EzoaColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '$activeCount',
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 8,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ActiveClearChip extends StatelessWidget {
  const _ActiveClearChip({required this.label, required this.onClear});

  final String label;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onClear,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.fromLTRB(10, 6, 8, 6),
          decoration: BoxDecoration(
            color: EzoaColors.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: EzoaColors.primary.withValues(alpha: 0.35)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: pal.accent,
                ),
              ),
              const SizedBox(width: 4),
              Icon(LucideIcons.x, size: 14, color: pal.accent),
            ],
          ),
        ),
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

/// Carte Archives : aperçu produit + badges opaques + bandeau type/période.
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
    [Color(0xFF0E7490), Color(0xFF155E75)],
    [Color(0xFFB45309), Color(0xFF92400E)],
    [Color(0xFF1A2220), Color(0xFF121816)],
    [Color(0xFF365314), Color(0xFF1A2E05)],
  ];

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
            height: 108,
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
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(14),
                ),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    EpreuveThumbnail(
                      epreuve: epreuve,
                      placeholderIconSize: 28,
                    ),
                    EpreuvePreviewChrome(
                      matiere: epreuve.matiere,
                      type: epreuve.type,
                      periode: epreuve.periode,
                      examen: epreuve.examen,
                      priceLabel: _priceLabel,
                      isPaid: _isPaid,
                      topTrailing: isOffline
                          ? Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1A2220),
                                borderRadius: BorderRadius.circular(7),
                                border: Border.all(
                                  color: EzoaColors.emerald.withValues(alpha: 0.45),
                                ),
                              ),
                              child: Icon(
                                LucideIcons.hardDrive,
                                size: 12,
                                color: pal.emerald,
                              ),
                            )
                          : null,
                    ),
                  ],
                ),
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
