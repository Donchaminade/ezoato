import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/wallet_providers.dart';

Future<void> _openRetraitSheet(
  BuildContext context,
  WidgetRef ref,
  ContributorWallet wallet,
) async {
  final message = await showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => RetraitSheet(wallet: wallet),
  );
  if (message != null) {
    ref.invalidate(walletProvider);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    }
  }
}

class PortefeuilleScreen extends ConsumerWidget {
  const PortefeuilleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final walletAsync = ref.watch(walletProvider);
    final fmt = NumberFormat.decimalPattern('fr_FR');

    return EzoaDetailScreen(
      title: 'Portefeuille',
      loading: walletAsync.isLoading,
      body: walletAsync.when(
        loading: () => const SizedBox.shrink(),
        error: (e, _) => EmptyState(title: 'Erreur', message: '$e', icon: LucideIcons.alertCircle),
        data: (wallet) {
          final pal = EzoaColors.of(context);
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(walletProvider),
            color: pal.accent,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                EzoaScrollReveal(
                  child: EzoaGlassCard(
                    margin: EdgeInsets.zero,
                    enableShine: false,
                    padding: const EdgeInsets.all(22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'SOLDE DISPONIBLE',
                          style: EzoaTypography.badge(context),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${fmt.format(wallet.solde)} FCFA',
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: pal.emerald,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${wallet.epreuvesParRecompense} épreuves validées = ${fmt.format(wallet.montantRecompense)} FCFA',
                          style: EzoaTypography.bodySmall(context).copyWith(color: pal.accent),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Progression vers la prochaine récompense',
                                style: EzoaTypography.bodySmall(context),
                              ),
                            ),
                            Text(
                              '+${fmt.format(wallet.montantRecompense)} FCFA',
                              style: EzoaTypography.mono(context)
                                  .copyWith(fontSize: 10, color: pal.emerald),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: LinearProgressIndicator(
                            value: wallet.epreuvesParRecompense > 0
                                ? wallet.progressionPalier / wallet.epreuvesParRecompense
                                : 0,
                            minHeight: 6,
                            backgroundColor: pal.progressTrack,
                            color: pal.emerald,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${wallet.progressionPalier}/${wallet.epreuvesParRecompense} épreuves validées',
                          style: EzoaTypography.mono(context).copyWith(fontSize: 10),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${wallet.epreuvesValidees} épreuves validées au total · '
                          '${wallet.paliersVerses} palier(s) déjà versé(s)',
                          style: EzoaTypography.bodySmall(context),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                EzoaScrollReveal(
                  child: EzoaMenuTile(
                    title: 'Mes soumissions',
                    subtitle: 'Suivre vos épreuves soumises',
                    icon: LucideIcons.clipboardList,
                    onTap: () => context.push('/account/soumissions'),
                  ),
                ),
                const SizedBox(height: 8),
                Text('Transactions', style: EzoaTypography.titleSmall(context)),
                const SizedBox(height: 8),
                if (wallet.transactions.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Text('Aucune transaction', style: EzoaTypography.bodySmall(context)),
                  )
                else
                  ...wallet.transactions.asMap().entries.map(
                        (entry) => EzoaStaggerReveal(
                          index: entry.key,
                          child: EzoaGlassCard(
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            enableShine: false,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            child: Row(
                              children: [
                                Icon(
                                  entry.value.type == 'credit' ? LucideIcons.arrowDownLeft : LucideIcons.arrowUpRight,
                                  size: 18,
                                  color: entry.value.type == 'credit' ? pal.emerald : pal.error,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(entry.value.description, style: EzoaTypography.titleSmall(context).copyWith(fontSize: 14)),
                                      Text(entry.value.creeLe, style: EzoaTypography.mono(context).copyWith(fontSize: 9)),
                                    ],
                                  ),
                                ),
                                Text(
                                  '${entry.value.type == 'credit' ? '+' : '-'}${fmt.format(entry.value.montant)} FCFA',
                                  style: GoogleFonts.jetBrainsMono(
                                    fontWeight: FontWeight.w700,
                                    color: entry.value.type == 'credit' ? pal.emerald : pal.error,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                const SizedBox(height: 20),
                Text('Retraits', style: EzoaTypography.titleSmall(context)),
                const SizedBox(height: 8),
                if (wallet.retraits.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Text('Aucun retrait', style: EzoaTypography.bodySmall(context)),
                  )
                else
                  ...wallet.retraits.map(
                    (r) => EzoaGlassCard(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      enableShine: false,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
                        children: [
                          Icon(LucideIcons.banknote, size: 18, color: pal.accent),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${r.methode.toUpperCase()} — ${r.statut}', style: EzoaTypography.titleSmall(context).copyWith(fontSize: 14)),
                                Text(r.creeLe, style: EzoaTypography.mono(context).copyWith(fontSize: 9)),
                              ],
                            ),
                          ),
                          Text('${fmt.format(r.montant)} FCFA', style: EzoaTypography.mono(context)),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                if (wallet.peutRetirer)
                  EzoaButton(
                    label: 'Demander un retrait',
                    icon: LucideIcons.banknote,
                    onPressed: () => _openRetraitSheet(context, ref, wallet),
                  )
                else
                  Text(
                    'Retrait Flooz/T-Money disponible à partir de ${fmt.format(wallet.minRetrait)} FCFA',
                    style: EzoaTypography.bodySmall(context),
                    textAlign: TextAlign.center,
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Bottom sheet de demande de retrait Flooz/T-Money (`POST /wallet/retrait`).
/// Renvoie le message de confirmation via `Navigator.pop` en cas de succès.
class RetraitSheet extends ConsumerStatefulWidget {
  const RetraitSheet({super.key, required this.wallet});

  final ContributorWallet wallet;

  @override
  ConsumerState<RetraitSheet> createState() => _RetraitSheetState();
}

class _RetraitSheetState extends ConsumerState<RetraitSheet> {
  late final TextEditingController _montantController;
  final _phoneController = TextEditingController();
  String _methode = 'flooz';
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _montantController =
        TextEditingController(text: widget.wallet.solde.toInt().toString());
  }

  @override
  void dispose() {
    _montantController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final montant = int.tryParse(_montantController.text.trim()) ?? 0;
    final phone = _phoneController.text.replaceAll(RegExp(r'\D'), '');
    if (montant < widget.wallet.minRetrait) {
      setState(() => _error = 'Minimum ${widget.wallet.minRetrait} FCFA');
      return;
    }
    if (montant > widget.wallet.solde) {
      setState(() => _error = 'Solde insuffisant');
      return;
    }
    if (phone.length < 8) {
      setState(() => _error = 'Numéro de téléphone invalide (8 chiffres min.)');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final message = await ref.read(apiClientProvider).requestRetrait(
            montant: montant,
            methode: _methode,
            telephone: phone,
          );
      if (mounted) Navigator.of(context).pop(message);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = '$e';
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final fmt = NumberFormat.decimalPattern('fr_FR');

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: EzoaGlassCard(
            margin: EdgeInsets.zero,
            enableShine: false,
            blurSigma: 30,
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Demande de retrait', style: EzoaTypography.titleMedium(context)),
                const SizedBox(height: 6),
                Text(
                  'Solde disponible : ${fmt.format(widget.wallet.solde)} FCFA — traitement sous 48 h.',
                  style: EzoaTypography.bodySmall(context),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _MethodeOption(
                        label: 'Flooz (Moov)',
                        selected: _methode == 'flooz',
                        onTap: () => setState(() => _methode = 'flooz'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _MethodeOption(
                        label: 'T-Money (Togocom)',
                        selected: _methode == 'tmoney',
                        onTap: () => setState(() => _methode = 'tmoney'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                EzoaTextField(
                  label: 'Montant (FCFA)',
                  controller: _montantController,
                  keyboardType: TextInputType.number,
                  prefixIcon: LucideIcons.coins,
                ),
                EzoaTextField(
                  label: 'Numéro de téléphone',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  prefixIcon: LucideIcons.phone,
                ),
                if (_error != null) ...[
                  Text(
                    _error!,
                    style: EzoaTypography.bodySmall(context)
                        .copyWith(color: EzoaColors.of(context).error),
                  ),
                  const SizedBox(height: 12),
                ],
                EzoaButton(
                  label: 'Envoyer la demande',
                  icon: LucideIcons.send,
                  loading: _loading,
                  onPressed: _submit,
                ),
                const SizedBox(height: 8),
                EzoaButton(
                  label: 'Annuler',
                  variant: EzoaButtonVariant.ghost,
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MethodeOption extends StatelessWidget {
  const _MethodeOption({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected
              ? EzoaColors.primary.withValues(alpha: pal.isDark ? 0.3 : 0.15)
              : pal.subtleFill,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? pal.emerald : pal.border,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: EzoaTypography.titleSmall(context).copyWith(fontSize: 13),
        ),
      ),
    );
  }
}
