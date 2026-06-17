import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import 'soumissions_screen.dart';

final soumissionDetailProvider = FutureProvider.family((ref, String id) {
  return ref.watch(apiClientProvider).getMySoumission(id);
});

class SoumissionDetailScreen extends ConsumerWidget {
  const SoumissionDetailScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(soumissionDetailProvider(id));

    return EzoaDetailScreen(
      title: 'Détail soumission',
      loading: detailAsync.isLoading,
      body: detailAsync.when(
        loading: () => const SizedBox.shrink(),
        error: (e, _) =>
            EmptyState(title: 'Erreur', message: '$e', icon: LucideIcons.alertCircle),
        data: (s) {
          if (s == null) {
            return const EmptyState(
              title: 'Soumission introuvable',
              message: "Cette soumission n'existe pas ou n'est plus accessible",
              icon: LucideIcons.fileQuestion,
            );
          }
          final pal = EzoaColors.of(context);
          final cfg = soumissionStatutConfig(context, s.statut);
          final date = DateTime.tryParse(s.soumisLe);
          final dateFmt = DateFormat('dd/MM/yyyy', 'fr_FR');

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              EzoaScrollReveal(
                child: EzoaGlassCard(
                  margin: EdgeInsets.zero,
                  enableShine: false,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(cfg.icon, size: 28, color: cfg.color),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                StatutBadge(label: cfg.label, color: cfg.color),
                                const SizedBox(height: 6),
                                Text(s.titre,
                                    style: EzoaTypography.titleMedium(context)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (s.statut == 'en_attente') ...[
                        const SizedBox(height: 12),
                        Text(
                          'Un gestionnaire examine votre soumission. '
                          'Délai habituel : 24 à 48 h.',
                          style: EzoaTypography.bodySmall(context),
                        ),
                      ],
                      if (s.statut == 'rejetee' && s.motifRejet != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: pal.error.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: pal.error.withValues(alpha: 0.35),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Motif du rejet',
                                style: EzoaTypography.titleSmall(context)
                                    .copyWith(fontSize: 13, color: pal.error),
                              ),
                              const SizedBox(height: 4),
                              Text(s.motifRejet!,
                                  style: EzoaTypography.bodySmall(context)),
                            ],
                          ),
                        ),
                      ],
                      if (s.statut == 'validee' && s.epreuveId != null) ...[
                        const SizedBox(height: 14),
                        EzoaButton(
                          label: "Voir l'épreuve publiée",
                          icon: LucideIcons.externalLink,
                          onPressed: () => context.push('/epreuve/${s.epreuveId}'),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              EzoaScrollReveal(
                child: EzoaGlassCard(
                  margin: EdgeInsets.zero,
                  enableShine: false,
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    children: [
                      _MetaRow(label: 'Matière', value: s.matiere),
                      _MetaRow(
                        label: 'Niveau',
                        value: s.niveau == 'lycee' ? 'Lycée' : 'Collège',
                      ),
                      _MetaRow(label: 'Classe', value: s.classe),
                      _MetaRow(label: 'Année', value: '${s.annee}'),
                      _MetaRow(
                        label: 'Type',
                        value: [
                          s.type,
                          if (s.periode != null) s.periode!,
                          if (s.examen != null) s.examen!,
                        ].join(' · '),
                      ),
                      _MetaRow(label: 'Ville', value: s.ville),
                      _MetaRow(
                        label: 'Établissement',
                        value: s.etablissement ?? s.examen ?? '—',
                      ),
                      if (s.pages != null)
                        _MetaRow(label: 'Pages', value: '${s.pages}'),
                      if (date != null)
                        _MetaRow(
                          label: 'Soumis le',
                          value: dateFmt.format(date),
                          isLast: true,
                        ),
                    ],
                  ),
                ),
              ),
              if (s.doublonsPotentiels.isNotEmpty) ...[
                const SizedBox(height: 16),
                EzoaScrollReveal(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: pal.gold.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: pal.gold.withValues(alpha: 0.35)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(LucideIcons.alertTriangle, size: 16, color: pal.gold),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Des épreuves similaires existent déjà. '
                            'Le gestionnaire comparera avant validation.',
                            style: EzoaTypography.bodySmall(context),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),
            ],
          );
        },
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({
    required this.label,
    required this.value,
    this.isLast = false,
  });

  final String label;
  final String value;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: isLast
          ? null
          : BoxDecoration(
              border: Border(bottom: BorderSide(color: pal.border)),
            ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label.toUpperCase(),
              style: EzoaTypography.badge(context),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: EzoaTypography.titleSmall(context).copyWith(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
