import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';

final mesSoumissionsProvider = FutureProvider((ref) {
  return ref.watch(apiClientProvider).getMySoumissions();
});

/// Configuration d'affichage d'un statut de soumission.
({String label, IconData icon, Color color}) soumissionStatutConfig(
  BuildContext context,
  String statut,
) {
  final pal = EzoaColors.of(context);
  return switch (statut) {
    'validee' => (label: 'Validée', icon: LucideIcons.checkCircle2, color: pal.emerald),
    'rejetee' => (label: 'Rejetée', icon: LucideIcons.xCircle, color: pal.error),
    _ => (label: 'En attente', icon: LucideIcons.clock, color: pal.gold),
  };
}

/// Badge coloré de statut (soumissions, paiements…).
class StatutBadge extends StatelessWidget {
  const StatutBadge({
    super.key,
    required this.label,
    required this.color,
    this.icon,
  });

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label.toUpperCase(),
            style: EzoaTypography.mono(context).copyWith(
              fontSize: 9,
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class SoumissionsScreen extends ConsumerWidget {
  const SoumissionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final soumissionsAsync = ref.watch(mesSoumissionsProvider);
    final dateFmt = DateFormat('dd/MM/yyyy', 'fr_FR');

    return EzoaDetailScreen(
      title: 'Mes soumissions',
      loading: soumissionsAsync.isLoading,
      body: soumissionsAsync.when(
        loading: () => const SizedBox.shrink(),
        error: (e, _) =>
            EmptyState(title: 'Erreur', message: '$e', icon: LucideIcons.alertCircle),
        data: (soumissions) {
          final pal = EzoaColors.of(context);
          final enAttente =
              soumissions.where((s) => s.statut == 'en_attente').length;
          final validees =
              soumissions.where((s) => s.statut == 'validee').length;
          final rejetees =
              soumissions.where((s) => s.statut == 'rejetee').length;

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(mesSoumissionsProvider),
            color: pal.accent,
            child: ListView(
              clipBehavior: Clip.none,
              padding: const EdgeInsets.all(16),
              children: [
                EzoaScrollReveal(
                  child: Padding(
                    // Laisse de l'espace pour le flou d'ombre (blur 24 + offset 8).
                    padding: const EdgeInsets.fromLTRB(8, 0, 8, 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: AspectRatio(
                            aspectRatio: 1,
                            child: EzoaGlassStat(
                              label: 'En attente',
                              value: enAttente,
                              icon: LucideIcons.clock,
                              square: true,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: AspectRatio(
                            aspectRatio: 1,
                            child: EzoaGlassStat(
                              label: 'Validées',
                              value: validees,
                              icon: LucideIcons.checkCircle2,
                              square: true,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: AspectRatio(
                            aspectRatio: 1,
                            child: EzoaGlassStat(
                              label: 'Rejetées',
                              value: rejetees,
                              icon: LucideIcons.xCircle,
                              square: true,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                if (soumissions.isEmpty)
                  Column(
                    children: [
                      const EmptyState(
                        title: 'Aucune soumission',
                        message:
                            'Soumettez votre première épreuve pour gagner des récompenses',
                        icon: LucideIcons.clipboardList,
                      ),
                      const SizedBox(height: 12),
                      EzoaButton(
                        label: 'Soumettre une épreuve',
                        icon: LucideIcons.upload,
                        onPressed: () => context.go('/submit'),
                      ),
                    ],
                  )
                else
                  ...soumissions.asMap().entries.map((entry) {
                    final s = entry.value;
                    final cfg = soumissionStatutConfig(context, s.statut);
                    final date = DateTime.tryParse(s.soumisLe);
                    return EzoaStaggerReveal(
                      index: entry.key,
                      child: EzoaGlassCard(
                        margin: const EdgeInsets.only(bottom: 8),
                        onTap: () =>
                            context.push('/account/soumissions/${s.id}'),
                        child: Row(
                          children: [
                            Icon(cfg.icon, size: 20, color: cfg.color),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    s.titre,
                                    style: EzoaTypography.titleSmall(context),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${s.matiere} · ${s.classe} · ${s.annee}'
                                    '${date != null ? ' · ${dateFmt.format(date)}' : ''}',
                                    style: EzoaTypography.bodySmall(context),
                                  ),
                                  const SizedBox(height: 6),
                                  StatutBadge(label: cfg.label, color: cfg.color),
                                ],
                              ),
                            ),
                            Icon(LucideIcons.chevronRight,
                                size: 18, color: pal.textFaint),
                          ],
                        ),
                      ),
                    );
                  }),
              ],
            ),
          );
        },
      ),
    );
  }
}
