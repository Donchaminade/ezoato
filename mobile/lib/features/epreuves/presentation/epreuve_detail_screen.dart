import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/connectivity_service.dart';
import '../../../core/security/secure_screen.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../../favorites/data/favoris_providers.dart';
import '../../offline/data/offline_repository.dart';
import 'epreuve_preview_viewer.dart';

final epreuveDetailProvider = FutureProvider.family<Epreuve?, String>((ref, id) async {
  if (ref.watch(isOnlineProvider)) {
    return ref.watch(apiClientProvider).getEpreuve(id);
  }
  final offline = await ref.watch(offlineListProvider.future);
  final repo = ref.watch(offlineRepositoryProvider);
  final item = offline.where((e) => e.id == id).firstOrNull;
  return item != null ? repo.parseMetadata(item) : null;
});

final epreuveOfflineAvailableProvider = FutureProvider.family<bool, String>((ref, id) {
  return ref.watch(offlineRepositoryProvider).isAvailable(id);
});

/// Accès paiement (`GET /paiements/acces/{id}`) — uniquement en ligne.
final paymentAccessProvider = FutureProvider.family<PaymentAccess?, String>((ref, id) async {
  if (!ref.watch(isOnlineProvider)) return null;
  return ref.watch(apiClientProvider).checkPaymentAccess(id);
});

class EpreuveDetailScreen extends ConsumerStatefulWidget {
  const EpreuveDetailScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<EpreuveDetailScreen> createState() => _EpreuveDetailScreenState();
}

class _EpreuveDetailScreenState extends ConsumerState<EpreuveDetailScreen> {
  bool _downloading = false;
  bool _togglingFavori = false;

  Future<void> _download(Epreuve epreuve) async {
    setState(() => _downloading = true);
    try {
      await ref.read(offlineRepositoryProvider).download(epreuve);
      ref.invalidate(offlineListProvider);
      ref.invalidate(epreuveOfflineAvailableProvider(widget.id));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Épreuve disponible hors ligne')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _downloading = false);
    }
  }

  Future<void> _openOffline() async {
    try {
      if (ref.read(isOnlineProvider)) {
        final access = await ref.read(paymentAccessProvider(widget.id).future);
        if (access?.requiresPayment == true && access?.hasAccess != true) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Accès expiré ou non payé — renouvelez pour ouvrir le PDF'),
              ),
            );
          }
          return;
        }
      }
      await ref.read(offlineRepositoryProvider).openPdf(widget.id);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  Future<void> _toggleFavori(bool isFavorite) async {
    if (_togglingFavori) return;
    setState(() => _togglingFavori = true);
    try {
      final added = await toggleFavori(ref, widget.id, isFavorite);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(added ? 'Ajoutée aux favoris' : 'Retirée des favoris'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _togglingFavori = false);
    }
  }

  Future<void> _openPaymentSheet(Epreuve epreuve, PaymentAccess access) async {
    final paid = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PaymentSheet(epreuveId: epreuve.id, montant: access.montant),
    );
    if (paid == true) {
      ref.invalidate(paymentAccessProvider(widget.id));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Paiement confirmé — épreuve débloquée')),
        );
      }
    }
  }

  String _formatExpiry(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    } catch (_) {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOnline = ref.watch(isOnlineProvider);
    final epreuveAsync = ref.watch(epreuveDetailProvider(widget.id));
    final offlineAsync = ref.watch(epreuveOfflineAvailableProvider(widget.id));
    final favorisIdsAsync = ref.watch(favorisIdsProvider);
    final accessAsync = ref.watch(paymentAccessProvider(widget.id));

    final isFavorite = favorisIdsAsync.value?.contains(widget.id) ?? false;

    return EzoaDetailScreen(
      title: 'Détail épreuve',
      loading: epreuveAsync.isLoading,
      actions: [
        if (isOnline)
          IconButton(
            tooltip: isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris',
            onPressed: _togglingFavori ? null : () => _toggleFavori(isFavorite),
            icon: _togglingFavori
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(
                    isFavorite ? Icons.favorite : Icons.favorite_border,
                    color: isFavorite
                        ? EzoaColors.of(context).error
                        : EzoaColors.of(context).textDim,
                    size: 22,
                  ),
          ),
      ],
      body: epreuveAsync.when(
        loading: () => const SizedBox.shrink(),
        error: (e, _) => EmptyState(
          title: isOnline ? 'Erreur' : 'Non disponible hors ligne',
          message: '$e',
          icon: LucideIcons.alertCircle,
        ),
        data: (epreuve) {
          if (epreuve == null) {
            return EmptyState(
              title: isOnline ? 'Épreuve introuvable' : 'Non disponible hors ligne',
              icon: LucideIcons.fileX,
            );
          }

          final offline = offlineAsync.value ?? false;
          final access = accessAsync.value;
          final requiresPayment =
              access?.requiresPayment ?? (epreuve.requiresPayment == true);
          final hasAccess = access?.hasAccess ?? !requiresPayment;
          final locked = requiresPayment && !hasAccess;
          final montant = access?.montant ?? epreuve.prixFcfa ?? 0;

          Widget content = SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                EzoaScrollReveal(
                  child: EzoaGlassCard(
                    margin: EdgeInsets.zero,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                EzoaColors.primary,
                                EzoaColors.primaryDark,
                              ],
                            ),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            epreuve.matiere.toUpperCase(),
                            style: EzoaTypography.badge(context).copyWith(
                              color: Colors.white,
                              fontSize: 10,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          epreuve.titre,
                          style: EzoaTypography.titleLarge(context).copyWith(fontSize: 22),
                        ),
                        const SizedBox(height: 12),
                        _MetaRow(
                          icon: LucideIcons.graduationCap,
                          text: '${epreuve.classe} · ${epreuve.annee} · ${epreuve.ville}',
                        ),
                        const SizedBox(height: 6),
                        _MetaRow(
                          icon: LucideIcons.fileText,
                          text: '${epreuve.type} · ${epreuve.pages} pages · ${epreuve.tailleKo} Ko',
                        ),
                        const SizedBox(height: 6),
                        _MetaRow(
                          icon: LucideIcons.download,
                          text: epreuve.telechargements == 1
                              ? '1 téléchargement'
                              : '${formatCompteurCompact(epreuve.telechargements)} téléchargements',
                        ),
                      ],
                    ),
                  ),
                ),
                if (isOnline) ...[
                  const SizedBox(height: 12),
                  EzoaScrollReveal(
                    child: EpreuvePreviewCard(
                      epreuve: epreuve,
                      locked: locked,
                      montant: montant,
                      onUnlock: locked && access != null
                          ? () => _openPaymentSheet(epreuve, access)
                          : null,
                    ),
                  ),
                ],
                if (requiresPayment) ...[
                  const SizedBox(height: 12),
                  EzoaScrollReveal(
                    child: EzoaGlassCard(
                      margin: EdgeInsets.zero,
                      enableShine: false,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              Icon(
                                hasAccess ? LucideIcons.badgeCheck : LucideIcons.creditCard,
                                color: hasAccess
                                    ? EzoaColors.of(context).emerald
                                    : EzoaColors.of(context).gold,
                                size: 22,
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Épreuve payante — $montant FCFA',
                                      style: EzoaTypography.titleSmall(context),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      hasAccess
                                          ? access?.expiresAt != null
                                              ? 'Accès débloqué jusqu\'au ${_formatExpiry(access!.expiresAt!)}'
                                              : 'Accès débloqué — téléchargement disponible'
                                          : 'Payez par Flooz ou T-Money pour débloquer l\'aperçu et le téléchargement',
                                      style: EzoaTypography.bodySmall(context),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (locked && isOnline && access != null) ...[
                            const SizedBox(height: 16),
                            EzoaButton(
                              label: 'Payer avec Flooz / T-Money',
                              icon: LucideIcons.smartphone,
                              onPressed: () => _openPaymentSheet(epreuve, access),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                if (isOnline)
                  EzoaScrollReveal(
                    child: EzoaButton(
                      label: locked
                          ? 'Paiement requis'
                          : offline
                              ? 'Déjà téléchargée'
                              : 'Télécharger hors ligne',
                      onPressed:
                          offline || locked ? null : () => _download(epreuve),
                      loading: _downloading,
                      disabled: offline || locked,
                      icon: locked ? LucideIcons.lock : LucideIcons.download,
                    ),
                  ),
                if (offline) ...[
                  const SizedBox(height: 12),
                  EzoaScrollReveal(
                    child: EzoaButton(
                      label: 'Ouvrir PDF hors ligne',
                      variant: EzoaButtonVariant.outline,
                      onPressed: _openOffline,
                      icon: LucideIcons.bookOpen,
                    ),
                  ),
                ],
              ],
            ),
          );

          if (requiresPayment) {
            content = SecureScreenScope(child: content);
          }

          return content;
        },
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Row(
      children: [
        Icon(icon, size: 14, color: pal.accent),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text.toUpperCase(),
            style: EzoaTypography.badge(context).copyWith(
              color: pal.textDim,
              fontSize: 9,
            ),
          ),
        ),
      ],
    );
  }
}

/// Bottom sheet de paiement Flooz/TMoney : méthode + téléphone → instructions
/// USSD → confirmation. Renvoie `true` via `Navigator.pop` si l'accès est débloqué.
class PaymentSheet extends ConsumerStatefulWidget {
  const PaymentSheet({super.key, required this.epreuveId, required this.montant});

  final String epreuveId;
  final int montant;

  @override
  ConsumerState<PaymentSheet> createState() => _PaymentSheetState();
}

class _PaymentSheetState extends ConsumerState<PaymentSheet> {
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
      final init = await ref.read(apiClientProvider).initierPaiement(
            epreuveId: widget.epreuveId,
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
      final hasAccess = await ref.read(apiClientProvider).confirmerPaiement(reference);
      if (!mounted) return;
      if (hasAccess) {
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
                      ? 'Paiement mobile — ${widget.montant} FCFA'
                      : init.instructions?.titre ?? 'Instructions de paiement',
                  style: EzoaTypography.titleMedium(context),
                ),
                const SizedBox(height: 16),
                if (init == null) ...[
                  Row(
                    children: [
                      Expanded(
                        child: _MethodeChip(
                          label: 'Flooz (Moov)',
                          selected: _methode == 'flooz',
                          onTap: () => setState(() => _methode = 'flooz'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _MethodeChip(
                          label: 'T-Money (Togocom)',
                          selected: _methode == 'tmoney',
                          onTap: () => setState(() => _methode = 'tmoney'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
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
                    label: 'Recevoir les instructions',
                    icon: LucideIcons.arrowRight,
                    loading: _loading,
                    onPressed: _initier,
                  ),
                ] else ...[
                  ...?init.instructions?.etapes.asMap().entries.map(
                        (entry) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 22,
                                height: 22,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: EzoaColors.primary.withValues(alpha: 0.25),
                                  shape: BoxShape.circle,
                                ),
                                child: Text(
                                  '${entry.key + 1}',
                                  style: EzoaTypography.mono(context)
                                      .copyWith(fontSize: 11),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  entry.value,
                                  style: EzoaTypography.body(context)
                                      .copyWith(fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: EzoaColors.of(context).subtleFill,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: EzoaColors.of(context).border),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          LucideIcons.hash,
                          size: 14,
                          color: EzoaColors.of(context).accent,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Référence : ${init.reference ?? '—'}',
                            style: EzoaTypography.mono(context).copyWith(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (_error != null) ...[
                    Text(
                      _error!,
                      style: EzoaTypography.bodySmall(context)
                          .copyWith(color: EzoaColors.of(context).error),
                    ),
                    const SizedBox(height: 12),
                  ],
                  EzoaButton(
                    label: 'J\'ai payé — Confirmer',
                    icon: LucideIcons.checkCircle,
                    loading: _loading,
                    onPressed: _confirmer,
                  ),
                ],
                const SizedBox(height: 8),
                EzoaButton(
                  label: 'Annuler',
                  variant: EzoaButtonVariant.ghost,
                  onPressed: () => Navigator.of(context).pop(false),
                ),
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
