import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';

final mesDownloadsProvider = FutureProvider((ref) {
  return ref.watch(apiClientProvider).getMyDownloads();
});

class DownloadsScreen extends ConsumerWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final downloadsAsync = ref.watch(mesDownloadsProvider);
    final dateFmt = DateFormat('dd/MM/yyyy', 'fr_FR');

    return EzoaDetailScreen(
      title: 'Mes téléchargements',
      loading: downloadsAsync.isLoading,
      body: downloadsAsync.when(
        loading: () => const SizedBox.shrink(),
        error: (e, _) =>
            EmptyState(title: 'Erreur', message: '$e', icon: LucideIcons.alertCircle),
        data: (downloads) {
          if (downloads.isEmpty) {
            return const EmptyState(
              title: 'Aucun téléchargement',
              message: 'Les épreuves que vous téléchargez apparaîtront ici',
              icon: LucideIcons.download,
            );
          }
          final pal = EzoaColors.of(context);

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(mesDownloadsProvider),
            color: pal.accent,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: downloads.length,
              itemBuilder: (_, i) {
                final d = downloads[i];
                final date = DateTime.tryParse(d.telechargeLe);
                return EzoaStaggerReveal(
                  index: i,
                  child: EzoaGlassCard(
                    margin: const EdgeInsets.only(bottom: 8),
                    onTap: () => context.push('/epreuve/${d.id}'),
                    child: Row(
                      children: [
                        Icon(LucideIcons.download, size: 20, color: pal.accent),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                d.titre,
                                style: EzoaTypography.titleSmall(context),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${d.matiere} · ${d.classe} · ${d.annee}'
                                '${date != null ? ' · ${dateFmt.format(date)}' : ''}',
                                style: EzoaTypography.bodySmall(context),
                              ),
                            ],
                          ),
                        ),
                        Icon(LucideIcons.chevronRight,
                            size: 18, color: pal.textFaint),
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
