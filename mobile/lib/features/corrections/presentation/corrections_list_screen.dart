import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/demande_correction.dart';

final mesDemandesCorrectionProvider = FutureProvider<List<DemandeCorrection>>((ref) async {
  final rows = await ref.watch(apiClientProvider).getMesDemandesCorrection();
  return rows.map(DemandeCorrection.fromJson).toList();
});

class CorrectionsListScreen extends ConsumerWidget {
  const CorrectionsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final demandes = ref.watch(mesDemandesCorrectionProvider);
    return EzoaScreen(
      title: 'Corrections',
      subtitle: 'Tes demandes et leur suivi',
      loading: demandes.isLoading,
      child: demandes.when(
        loading: () => const SizedBox.shrink(),
        error: (error, _) => _Message(
          text: '$error',
          action: 'Réessayer',
          onPressed: () => ref.invalidate(mesDemandesCorrectionProvider),
        ),
        data: (items) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            EzoaButton(
              label: 'Nouvelle demande',
              icon: LucideIcons.pencil,
              onPressed: () => context.push('/corrections/nouvelle'),
            ),
            const SizedBox(height: 16),
            if (items.isEmpty)
              Text(
                'Aucune demande pour le moment. Choisis une épreuve du catalogue et indique les exercices qui bloquent.',
                style: EzoaTypography.body(context),
              )
            else
              ...items.map((demande) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Material(
                      color: EzoaColors.of(context).surface,
                      borderRadius: BorderRadius.circular(16),
                      child: ListTile(
                        title: Text(demande.epreuveTitre, style: EzoaTypography.titleSmall(context)),
                        subtitle: Text(
                          '${demande.matiere} · ${statutDemandeLabel[demande.statut] ?? demande.statut}',
                          style: EzoaTypography.bodySmall(context),
                        ),
                        trailing: const Icon(LucideIcons.chevronRight, size: 18),
                        onTap: () => context.push('/corrections/${demande.id}'),
                      ),
                    ),
                  )),
          ],
        ),
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({required this.text, required this.action, required this.onPressed});

  final String text;
  final String action;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(text, textAlign: TextAlign.center, style: EzoaTypography.body(context)),
          const SizedBox(height: 16),
          EzoaButton(label: action, onPressed: onPressed),
        ],
      ),
    );
  }
}
