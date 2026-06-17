import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import 'soumissions_screen.dart';

final mesPaiementsProvider = FutureProvider((ref) {
  return ref.watch(apiClientProvider).getMyPaiements();
});

({String label, Color color}) _paiementStatutConfig(
  BuildContext context,
  String statut,
) {
  final pal = EzoaColors.of(context);
  return switch (statut) {
    'confirme' => (label: 'Confirmé', color: pal.emerald),
    'echec' => (label: 'Échec', color: pal.error),
    'expire' => (label: 'Expiré', color: pal.error),
    _ => (label: 'En attente', color: pal.gold),
  };
}

class PaiementsScreen extends ConsumerWidget {
  const PaiementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paiementsAsync = ref.watch(mesPaiementsProvider);
    final dateFmt = DateFormat('dd/MM/yyyy', 'fr_FR');
    final fmt = NumberFormat.decimalPattern('fr_FR');

    return EzoaDetailScreen(
      title: 'Mes paiements',
      loading: paiementsAsync.isLoading,
      body: paiementsAsync.when(
        loading: () => const SizedBox.shrink(),
        error: (e, _) =>
            EmptyState(title: 'Erreur', message: '$e', icon: LucideIcons.alertCircle),
        data: (paiements) {
          if (paiements.isEmpty) {
            return const EmptyState(
              title: 'Aucun paiement',
              message: 'Vos achats d\u2019épreuves apparaîtront ici',
              icon: LucideIcons.creditCard,
            );
          }
          final pal = EzoaColors.of(context);

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(mesPaiementsProvider),
            color: pal.accent,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: paiements.length,
              itemBuilder: (_, i) {
                final p = paiements[i];
                final cfg = _paiementStatutConfig(context, p.statut);
                final date = DateTime.tryParse(p.creeLe);
                return EzoaStaggerReveal(
                  index: i,
                  child: EzoaGlassCard(
                    margin: const EdgeInsets.only(bottom: 8),
                    onTap: p.epreuveId.isEmpty
                        ? null
                        : () => context.push('/epreuve/${p.epreuveId}'),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                p.epreuveTitre,
                                style: EzoaTypography.titleSmall(context),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${fmt.format(p.montant)} FCFA',
                              style: GoogleFonts.jetBrainsMono(
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                                color: pal.emerald,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${p.epreuveMatiere} · '
                          '${p.methode == 'flooz' ? 'Flooz' : 'T-Money'}'
                          '${date != null ? ' · ${dateFmt.format(date)}' : ''}',
                          style: EzoaTypography.bodySmall(context),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            StatutBadge(label: cfg.label, color: cfg.color),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                p.reference,
                                style: EzoaTypography.mono(context)
                                    .copyWith(fontSize: 9),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
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
