import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/connectivity_service.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/favoris_providers.dart';

class FavorisScreen extends ConsumerStatefulWidget {
  const FavorisScreen({super.key, this.asTab = false});

  /// Quand l'écran est affiché comme onglet de la navbar, on utilise le
  /// header glass sans bouton retour au lieu de l'app bar de détail.
  final bool asTab;

  @override
  ConsumerState<FavorisScreen> createState() => _FavorisScreenState();
}

class _FavorisScreenState extends ConsumerState<FavorisScreen> {
  final Set<String> _optimisticRemoved = {};

  Future<void> _confirmRemove(Epreuve epreuve) async {
    if (_optimisticRemoved.contains(epreuve.id)) return;

    if (!ref.read(isOnlineProvider)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Connexion requise pour modifier vos favoris'),
        ),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: EzoaColors.of(ctx).dialogBg,
        title: Text('Retirer des favoris', style: EzoaTypography.titleSmall(ctx)),
        content: Text(
          'Retirer « ${epreuve.titre} » de vos favoris ?',
          style: EzoaTypography.body(ctx),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Retirer', style: TextStyle(color: EzoaColors.of(ctx).error)),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _optimisticRemoved.add(epreuve.id));

    try {
      await toggleFavori(ref, epreuve.id, true);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Retirée des favoris')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _optimisticRemoved.remove(epreuve.id));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final favorisAsync = ref.watch(favorisProvider);

    final body = favorisAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (e, _) => EmptyState(title: 'Erreur', message: '$e', icon: LucideIcons.alertCircle),
      data: (items) {
        final visibleItems =
            items.where((e) => !_optimisticRemoved.contains(e.id)).toList();

        if (visibleItems.isEmpty) {
          return const EmptyState(
            title: 'Aucun favori',
            message: 'Ajoutez des épreuves depuis Archives',
            icon: LucideIcons.heart,
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            setState(() => _optimisticRemoved.clear());
            ref.invalidate(favorisProvider);
          },
          color: EzoaColors.of(context).accent,
          child: EpreuvesGrid(
            itemCount: visibleItems.length,
            itemBuilder: (_, i) {
              final e = visibleItems[i];
              return EpreuveGridCard(
                titre: e.titre,
                matiere: e.matiere,
                classe: e.classe,
                annee: e.annee,
                ville: e.ville,
                telechargements: e.telechargements,
                type: e.type,
                epreuve: e,
                isFavorite: true,
                revealIndex: i,
                onTap: () => context.push('/epreuve/${e.id}'),
                onLongPress: () => _confirmRemove(e),
              );
            },
          ),
        );
      },
    );

    if (widget.asTab) {
      return EzoaScreen(
        title: 'Favoris',
        subtitle: 'Vos épreuves préférées',
        loading: favorisAsync.isLoading,
        child: body,
      );
    }

    return EzoaDetailScreen(
      title: 'Favoris',
      loading: favorisAsync.isLoading,
      body: body,
    );
  }
}
