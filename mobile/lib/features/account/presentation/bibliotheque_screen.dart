import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_widgets.dart';

final bibliothequeProvider = FutureProvider((ref) {
  return ref.watch(apiClientProvider).getMyLibrary();
});

class BibliothequeScreen extends ConsumerWidget {
  const BibliothequeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final libraryAsync = ref.watch(bibliothequeProvider);

    return EzoaDetailScreen(
      title: 'Bibliothèque en ligne',
      loading: libraryAsync.isLoading,
      body: libraryAsync.when(
        loading: () => const SizedBox.shrink(),
        error: (e, _) => EmptyState(title: 'Erreur', message: '$e', icon: LucideIcons.alertCircle),
        data: (library) {
          if (library.paid.isEmpty && library.free.isEmpty) {
            return const EmptyState(
              title: 'Bibliothèque vide',
              message: 'Vos achats et téléchargements apparaîtront ici',
              icon: LucideIcons.library,
            );
          }
          final pal = EzoaColors.of(context);

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(bibliothequeProvider),
            color: pal.accent,
            child: CustomScrollView(
              slivers: [
                if (library.paid.isNotEmpty) ...[
                  _SectionHeader(
                    title: 'Achats',
                    count: library.paid.length,
                    icon: LucideIcons.shoppingBag,
                  ),
                  _LibraryGrid(items: library.paid, paid: true),
                ],
                if (library.free.isNotEmpty) ...[
                  _SectionHeader(
                    title: 'Gratuits',
                    count: library.free.length,
                    icon: LucideIcons.download,
                  ),
                  _LibraryGrid(items: library.free, paid: false),
                ],
                const SliverToBoxAdapter(child: SizedBox(height: 32)),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.count,
    required this.icon,
  });

  final String title;
  final int count;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
        child: Row(
          children: [
            Icon(icon, size: 16, color: pal.accent),
            const SizedBox(width: 8),
            Text(title, style: EzoaTypography.titleSmall(context)),
            const SizedBox(width: 8),
            Text(
              '$count',
              style: EzoaTypography.mono(context).copyWith(fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }
}

/// Grille catalogue : 2 colonnes sur téléphone, davantage sur écrans larges
/// (largeur max de tuile 220 px via [SliverGridDelegateWithMaxCrossAxisExtent]).
class _LibraryGrid extends StatelessWidget {
  const _LibraryGrid({required this.items, required this.paid});

  final List<LibraryItem> items;
  final bool paid;

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 220,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          mainAxisExtent: 204,
        ),
        delegate: SliverChildBuilderDelegate(
          childCount: items.length,
          (context, i) => EzoaStaggerReveal(
            index: i % 6,
            child: _LibraryCard(item: items[i], paid: paid),
          ),
        ),
      ),
    );
  }
}

/// Carte produit verticale : zone visuelle dégradée (icône matière) en haut,
/// titre 2 lignes, badges matière/classe/année, indicateur payé/gratuit.
class _LibraryCard extends StatelessWidget {
  const _LibraryCard({required this.item, required this.paid});

  final LibraryItem item;
  final bool paid;

  // Dégradés stylisés assignés par matière (stable via hashCode).
  static const _gradients = [
    [Color(0xFF006A4E), Color(0xFF004D38)],
    [Color(0xFF4338CA), Color(0xFF312E81)],
    [Color(0xFF0E7490), Color(0xFF155E75)],
    [Color(0xFF7C3AED), Color(0xFF5B21B6)],
    [Color(0xFFB45309), Color(0xFF92400E)],
  ];

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final gradient =
        _gradients[item.matiere.hashCode.abs() % _gradients.length];

    return EzoaGlassCard(
      margin: EdgeInsets.zero,
      padding: EdgeInsets.zero,
      enableShine: false,
      onTap: () => context.push('/epreuve/${item.id}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Zone visuelle stylisée.
          Container(
            height: 82,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: gradient,
              ),
            ),
            child: Stack(
              children: [
                Center(
                  child: Icon(
                    item.type == 'examen'
                        ? LucideIcons.graduationCap
                        : LucideIcons.fileText,
                    size: 30,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.35),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: (paid ? EzoaColors.gold : EzoaColors.emerald)
                            .withValues(alpha: 0.6),
                      ),
                    ),
                    child: Text(
                      paid ? 'PAYÉ' : 'GRATUIT',
                      style: GoogleFonts.jetBrainsMono(
                        fontSize: 8,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: paid ? EzoaColors.gold : EzoaColors.emerald,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.titre,
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
                      _MiniBadge(label: item.matiere),
                      _MiniBadge(label: item.classe),
                      _MiniBadge(label: '${item.annee}'),
                      if (item.telechargements > 0)
                        _MiniBadge(
                          label: formatCompteurCompact(item.telechargements),
                          icon: LucideIcons.download,
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

class _MiniBadge extends StatelessWidget {
  const _MiniBadge({required this.label, this.icon});

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
