import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/favoris_providers.dart';

class FavorisScreen extends ConsumerWidget {
  const FavorisScreen({super.key, this.asTab = false});

  /// Quand l'écran est affiché comme onglet de la navbar, on utilise le
  /// header glass sans bouton retour au lieu de l'app bar de détail.
  final bool asTab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favorisAsync = ref.watch(favorisProvider);

    final body = favorisAsync.when(
        loading: () => const SizedBox.shrink(),
        error: (e, _) => EmptyState(title: 'Erreur', message: '$e', icon: LucideIcons.alertCircle),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              title: 'Aucun favori',
              message: 'Ajoutez des épreuves depuis Archives',
              icon: LucideIcons.heart,
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(favorisProvider),
            color: EzoaColors.of(context).accent,
            child: EpreuvesGrid(
              itemCount: items.length,
              itemBuilder: (_, i) {
                final e = items[i];
                return EpreuveGridCard(
                  titre: e.titre,
                  matiere: e.matiere,
                  classe: e.classe,
                  annee: e.annee,
                  ville: e.ville,
                  telechargements: e.telechargements,
                  type: e.type,
                  isFavorite: true,
                  revealIndex: i,
                  onTap: () => context.push('/epreuve/${e.id}'),
                );
              },
            ),
          );
        },
      );

    if (asTab) {
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
