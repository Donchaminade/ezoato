import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/offline_repository.dart';

class OfflineLibraryScreen extends ConsumerWidget {
  const OfflineLibraryScreen({super.key});

  Future<void> _confirmRemove(
    BuildContext context,
    WidgetRef ref,
    OfflineEpreuve item,
  ) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: EzoaColors.of(ctx).dialogBg,
        title: Text('Supprimer', style: EzoaTypography.titleSmall(ctx)),
        content: Text(
          'Retirer « ${item.titre} » du stockage local ?',
          style: EzoaTypography.body(ctx),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              'Supprimer',
              style: TextStyle(color: EzoaColors.of(ctx).error),
            ),
          ),
        ],
      ),
    );
    if (ok == true) {
      await ref.read(offlineRepositoryProvider).remove(item.id);
      ref.invalidate(offlineListProvider);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entriesAsync = ref.watch(offlineLibraryEntriesProvider);

    return EzoaDetailScreen(
      title: 'Ma bibliothèque hors ligne',
      loading: entriesAsync.isLoading,
      body: entriesAsync.when(
        loading: () => const SizedBox.shrink(),
        error: (e, _) => EmptyState(
          title: 'Erreur',
          message: '$e',
          icon: LucideIcons.alertCircle,
        ),
        data: (entries) {
          if (entries.isEmpty) {
            return const EmptyState(
              title: 'Aucun téléchargement local',
              message:
                  'Téléchargez des épreuves depuis Archives pour les consulter hors ligne',
              icon: LucideIcons.hardDrive,
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(offlineListProvider),
            color: EzoaColors.of(context).accent,
            child: EpreuvesGrid(
              itemCount: entries.length,
              itemBuilder: (_, i) {
                final entry = entries[i];
                final item = entry.item;
                final meta = entry.meta;
                final previewPath = entry.previewPath;
                return EpreuveGridCard(
                  titre: item.titre,
                  matiere: item.matiere,
                  classe: meta?.classe ?? '—',
                  annee: meta?.annee ?? 0,
                  ville: meta?.ville,
                  telechargements: meta?.telechargements,
                  type: meta?.type ?? 'epreuve',
                  periode: meta?.periode,
                  examen: meta?.examen,
                  isOffline: true,
                  revealIndex: i,
                  previewImage: previewPath != null
                      ? FileImage(File(previewPath))
                      : null,
                  onTap: () => context.push('/epreuve/${item.id}'),
                  onLongPress: () => _confirmRemove(context, ref, item),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
