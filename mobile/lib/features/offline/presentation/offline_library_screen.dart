import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/offline_repository.dart';

class OfflineLibraryScreen extends ConsumerWidget {
  const OfflineLibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offlineAsync = ref.watch(offlineListProvider);
    final repo = ref.watch(offlineRepositoryProvider);
    final dateFmt = DateFormat('dd/MM/yyyy', 'fr_FR');

    return EzoaDetailScreen(
      title: 'Ma bibliothèque hors ligne',
      loading: offlineAsync.isLoading,
      body: offlineAsync.when(
        loading: () => const SizedBox.shrink(),
        error: (e, _) => EmptyState(title: 'Erreur', message: '$e', icon: LucideIcons.alertCircle),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              title: 'Aucun téléchargement local',
              message:
                  'Téléchargez des épreuves depuis Archives pour les consulter hors ligne',
              icon: LucideIcons.hardDrive,
            );
          }
          final pal = EzoaColors.of(context);
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(offlineListProvider),
            color: pal.accent,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (_, i) {
                final item = items[i];
                final meta = repo.parseMetadata(item);
                return EzoaStaggerReveal(
                  index: i,
                  child: EzoaGlassCard(
                    margin: const EdgeInsets.only(bottom: 8),
                    enableShine: false,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.matiere.toUpperCase(),
                          style: EzoaTypography.badge(context).copyWith(color: pal.emerald),
                        ),
                        const SizedBox(height: 6),
                        Text(item.titre, style: EzoaTypography.titleSmall(context)),
                        if (meta != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            '${meta.classe} · ${meta.annee}',
                            style: EzoaTypography.bodySmall(context),
                          ),
                        ],
                        const SizedBox(height: 4),
                        Text(
                          'TÉLÉCHARGÉ LE ${dateFmt.format(DateTime.parse(item.downloadedAt)).toUpperCase()}',
                          style: EzoaTypography.badge(context).copyWith(fontSize: 8),
                        ),
                        const SizedBox(height: 14),
                        EzoaButton(
                          label: 'Ouvrir PDF',
                          onPressed: () async {
                            try {
                              await repo.openPdf(item.id);
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('$e')),
                                );
                              }
                            }
                          },
                          icon: LucideIcons.bookOpen,
                        ),
                        TextButton(
                          onPressed: () async {
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
                                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
                                  TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Supprimer')),
                                ],
                              ),
                            );
                            if (ok == true) {
                              await repo.remove(item.id);
                              ref.invalidate(offlineListProvider);
                            }
                          },
                          child: Text('Supprimer', style: TextStyle(color: pal.error)),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
