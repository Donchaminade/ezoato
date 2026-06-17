import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/config/subscription_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/subscription_providers.dart';

class AbonnementScreen extends ConsumerWidget {
  const AbonnementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusAsync = ref.watch(subscriptionStatusProvider);

    return EzoaScreen(
      title: 'Abonnement',
      subtitle: 'Accès illimité aux épreuves payantes',
      child: statusAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => EmptyState(
          title: 'Erreur',
          message: '$e',
          icon: LucideIcons.alertCircle,
        ),
        data: (status) {
          final s = status;
          return RefreshIndicator(
          onRefresh: () async => ref.invalidate(subscriptionStatusProvider),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
            children: [
              EzoaGlassCard(
                margin: EdgeInsets.zero,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Icon(
                          s.actif
                              ? LucideIcons.badgeCheck
                              : s.expire
                                  ? LucideIcons.alertCircle
                                  : LucideIcons.crown,
                          color: s.actif
                              ? EzoaColors.of(context).emerald
                              : s.expire
                                  ? EzoaColors.of(context).error
                                  : EzoaColors.of(context).gold,
                          size: 28,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            s.actif
                                ? 'Abonnement actif'
                                : s.expire
                                    ? 'Abonnement expiré'
                                    : 'Pas d\'abonnement actif',
                            style: EzoaTypography.titleMedium(context),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (s.actif && s.dateFin != null) ...[
                      _InfoRow(
                        label: 'Expire le',
                        value: _formatDate(s.dateFin!),
                      ),
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: 'Jours restants',
                        value: '${s.joursRestants} jour${s.joursRestants > 1 ? 's' : ''}',
                      ),
                    ] else if (s.expire) ...[
                      Text(
                        'Votre abonnement a expiré. Renouvelez (${s.montant} FCFA / ${s.dureeMois} mois) '
                        'pour retrouver l\'accès illimité aux épreuves payantes.',
                        style: EzoaTypography.bodySmall(context).copyWith(
                          color: EzoaColors.of(context).error,
                        ),
                      ),
                      if (s.dateFin != null) ...[
                        const SizedBox(height: 12),
                        _InfoRow(
                          label: 'Expiré le',
                          value: _formatDate(s.dateFin!),
                        ),
                      ],
                    ] else ...[
                      Text(
                        'Accédez à toutes les épreuves payantes (examens nationaux et corrigés types) '
                        'sans payer à chaque fois.',
                        style: EzoaTypography.bodySmall(context),
                      ),
                      const SizedBox(height: 12),
                      _InfoRow(
                        label: 'Tarif',
                        value: '${s.montant} FCFA / ${s.dureeMois} mois',
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),
              if (!s.actif)
                EzoaButton(
                  label: s.expire
                      ? 'Renouveler — ${s.montant} FCFA / ${s.dureeMois} mois'
                      : 'S\'abonner — ${s.montant} FCFA / ${s.dureeMois} mois',
                  icon: LucideIcons.smartphone,
                  onPressed: () => _openSubscribeSheet(context, ref, s.montant),
                ),
            ],
          ),
        );
        },
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      return DateFormat('dd/MM/yyyy').format(DateTime.parse(iso).toLocal());
    } catch (_) {
      return iso;
    }
  }

  Future<void> _openSubscribeSheet(BuildContext context, WidgetRef ref, int montant) async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => SubscriptionPaymentSheet(montant: montant),
    );
    if (ok == true) {
      ref.invalidate(subscriptionStatusProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Abonnement activé — accès débloqué')),
        );
      }
    }
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: EzoaTypography.bodySmall(context)),
        Text(value, style: EzoaTypography.titleSmall(context)),
      ],
    );
  }
}

/// Bottom sheet paiement abonnement (Flooz / T-Money).
class SubscriptionPaymentSheet extends ConsumerStatefulWidget {
  const SubscriptionPaymentSheet({super.key, required this.montant});

  final int montant;

  @override
  ConsumerState<SubscriptionPaymentSheet> createState() => _SubscriptionPaymentSheetState();
}

class _SubscriptionPaymentSheetState extends ConsumerState<SubscriptionPaymentSheet> {
  final _phoneController = TextEditingController();
  String _methode = 'flooz';
  PaymentInit? _init;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _initier() async {
    final phone = _phoneController.text.replaceAll(RegExp(r'\D'), '');
    if (phone.length < 8) {
      setState(() => _error = 'Numéro de téléphone invalide (8 chiffres min.)');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final init = await ref.read(apiClientProvider).initierAbonnement(
            methode: _methode,
            telephone: phone,
          );
      if (!mounted) return;
      if (init.alreadyPaid) {
        Navigator.of(context).pop(true);
        return;
      }
      setState(() => _init = init);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirmer() async {
    final reference = _init?.reference;
    if (reference == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final status = await ref.read(apiClientProvider).confirmerAbonnement(reference);
      if (!mounted) return;
      if (status.actif) {
        Navigator.of(context).pop(true);
      } else {
        setState(() => _error = 'Paiement non confirmé. Réessayez.');
      }
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final init = _init;

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
                Text(
                  init == null
                      ? 'Abonnement — ${widget.montant} FCFA / $kSubscriptionDurationMonths mois'
                      : init.instructions?.titre ?? 'Instructions de paiement',
                  style: EzoaTypography.titleMedium(context),
                ),
                const SizedBox(height: 8),
                if (init == null)
                  Text(
                    'Accès illimité à toutes les épreuves payantes pendant $kSubscriptionDurationMonths mois.',
                    style: EzoaTypography.bodySmall(context),
                  ),
                const SizedBox(height: 16),
                if (init == null) ...[
                  Row(
                    children: [
                      Expanded(
                        child: _MethodeChip(
                          label: 'Flooz',
                          selected: _methode == 'flooz',
                          onTap: () => setState(() => _methode = 'flooz'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _MethodeChip(
                          label: 'T-Money',
                          selected: _methode == 'tmoney',
                          onTap: () => setState(() => _methode = 'tmoney'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Numéro de téléphone',
                      hintText: '90 00 00 00',
                    ),
                  ),
                  const SizedBox(height: 16),
                  EzoaButton(
                    label: 'Continuer',
                    loading: _loading,
                    onPressed: _loading ? null : _initier,
                  ),
                ] else ...[
                  if (init.instructions != null)
                    ...init.instructions!.etapes.map(
                      (e) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Text('• $e', style: EzoaTypography.bodySmall(context)),
                      ),
                    ),
                  const SizedBox(height: 16),
                  EzoaButton(
                    label: 'J\'ai payé — confirmer',
                    loading: _loading,
                    onPressed: _loading ? null : _confirmer,
                  ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: TextStyle(color: EzoaColors.of(context).error)),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MethodeChip extends StatelessWidget {
  const _MethodeChip({
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
    return Material(
      color: selected ? EzoaColors.primary.withValues(alpha: 0.15) : pal.subtleFill,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? EzoaColors.primary : pal.border,
              width: selected ? 2 : 1,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: EzoaTypography.titleSmall(context).copyWith(
              color: selected ? EzoaColors.primary : pal.text,
            ),
          ),
        ),
      ),
    );
  }
}
