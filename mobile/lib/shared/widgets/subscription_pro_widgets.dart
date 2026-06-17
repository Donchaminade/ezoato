import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/config/subscription_constants.dart';
import '../../core/theme/ezoa_theme.dart';
import '../../shared/models/models.dart';
import 'ezoa_widgets.dart';

extension SubscriptionStatusX on SubscriptionStatus {
  bool get isExpiringSoon =>
      actif && joursRestants > 0 && joursRestants <= kSubscriptionExpiringSoonDays;

  String get priceLabel => '$montant FCFA / $dureeMois mois';
}

String formatSubscriptionDate(String iso) {
  try {
    return DateFormat('dd/MM/yyyy').format(DateTime.parse(iso).toLocal());
  } catch (_) {
    return iso;
  }
}

/// Bannière premium « Passer en abonnement Pro » (glass + emerald).
class SubscriptionProUpgradeBanner extends StatelessWidget {
  const SubscriptionProUpgradeBanner({
    super.key,
    required this.status,
    this.compact = false,
    this.onTap,
  });

  final SubscriptionStatus status;
  final bool compact;
  final VoidCallback? onTap;

  void _navigate(BuildContext context) {
    if (onTap != null) {
      onTap!();
    } else {
      context.push('/account/abonnement');
    }
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final padding = compact
        ? const EdgeInsets.fromLTRB(16, 0, 16, 12)
        : const EdgeInsets.fromLTRB(16, 0, 16, 16);

    return Padding(
      padding: padding,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(compact ? 16 : 20),
          boxShadow: [
            BoxShadow(
              color: EzoaColors.primary.withValues(alpha: 0.18),
              blurRadius: compact ? 16 : 24,
              offset: Offset(0, compact ? 6 : 10),
            ),
          ],
        ),
        child: EzoaGlassCard(
          margin: EdgeInsets.zero,
          enableShine: false,
          borderRadius: compact ? 16 : 20,
          padding: EdgeInsets.all(compact ? 14 : 18),
          onTap: () => _navigate(context),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _ProIconBadge(compact: compact),
              SizedBox(width: compact ? 12 : 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _ProBadge(compact: compact),
                        if (status.expire) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: EzoaColors.error.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: EzoaColors.error.withValues(alpha: 0.35),
                              ),
                            ),
                            child: Text(
                              'Expiré',
                              style: EzoaTypography.badge(context).copyWith(
                                color: EzoaColors.error,
                                fontSize: 9,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    SizedBox(height: compact ? 4 : 6),
                    Text(
                      status.expire
                          ? 'Renouvelez votre accès illimité'
                          : 'Passer en abonnement Pro',
                      style: (compact
                              ? EzoaTypography.titleSmall(context)
                              : EzoaTypography.titleMedium(context))
                          .copyWith(fontWeight: FontWeight.w700),
                    ),
                    SizedBox(height: compact ? 2 : 4),
                    Text(
                      'Abonnement Pro — ${status.priceLabel}',
                      style: EzoaTypography.bodySmall(context).copyWith(
                        color: pal.textDim,
                      ),
                    ),
                    if (!compact) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Toutes les épreuves payantes, sans payer à chaque fois.',
                        style: EzoaTypography.bodySmall(context).copyWith(
                          color: pal.textFaint,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Icon(LucideIcons.chevronRight, size: compact ? 16 : 18, color: pal.emerald),
            ],
          ),
        ),
      ),
    );
  }
}

/// Badge statut Pro actif avec lien renouveler si expiration proche.
class SubscriptionProStatusBadge extends StatelessWidget {
  const SubscriptionProStatusBadge({
    super.key,
    required this.status,
    this.onRenewTap,
  });

  final SubscriptionStatus status;
  final VoidCallback? onRenewTap;

  @override
  Widget build(BuildContext context) {
    if (!status.actif || status.dateFin == null) return const SizedBox.shrink();

    final pal = EzoaColors.of(context);
    final dateLabel = formatSubscriptionDate(status.dateFin!);
    final expiringSoon = status.isExpiringSoon;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: EzoaGlassCard(
        margin: EdgeInsets.zero,
        enableShine: false,
        borderRadius: 16,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        onTap: expiringSoon
            ? (onRenewTap ?? () => context.push('/account/abonnement'))
            : () => context.push('/account/abonnement'),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: EzoaColors.emerald.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: EzoaColors.emerald.withValues(alpha: 0.35)),
              ),
              child: Icon(
                LucideIcons.badgeCheck,
                size: 18,
                color: pal.emerald,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      _ProBadge(compact: true),
                      const SizedBox(width: 8),
                      Text(
                        'Pro actif · expire le $dateLabel',
                        style: EzoaTypography.bodySmall(context).copyWith(
                          fontWeight: FontWeight.w600,
                          color: pal.emerald,
                        ),
                      ),
                    ],
                  ),
                  if (expiringSoon) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Expire dans ${status.joursRestants} jour${status.joursRestants > 1 ? 's' : ''} — renouvelez maintenant',
                      style: EzoaTypography.bodySmall(context).copyWith(
                        color: EzoaColors.of(context).gold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (expiringSoon)
              Text(
                'Renouveler',
                style: EzoaTypography.badge(context).copyWith(
                  color: pal.emerald,
                  fontWeight: FontWeight.w700,
                ),
              )
            else
              Icon(LucideIcons.chevronRight, size: 16, color: pal.textFaint),
          ],
        ),
      ),
    );
  }
}

/// CTA principal paywall épreuve : abonnement Pro en premier.
class SubscriptionProPaywallActions extends StatelessWidget {
  const SubscriptionProPaywallActions({
    super.key,
    required this.montant,
    required this.onSubscribe,
    required this.onPayExam,
  });

  final int montant;
  final VoidCallback onSubscribe;
  final VoidCallback onPayExam;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        EzoaButton(
          label: 'Passer en abonnement Pro — $kSubscriptionPriceFcfa FCFA / $kSubscriptionDurationMonths mois',
          icon: LucideIcons.crown,
          onPressed: onSubscribe,
        ),
        const SizedBox(height: 10),
        EzoaButton(
          label: 'Payer cette épreuve — $montant FCFA',
          variant: EzoaButtonVariant.outline,
          icon: LucideIcons.smartphone,
          onPressed: onPayExam,
        ),
      ],
    );
  }
}

class _ProIconBadge extends StatelessWidget {
  const _ProIconBadge({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final size = compact ? 40.0 : 48.0;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(compact ? 12 : 14),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            EzoaColors.primary.withValues(alpha: 0.9),
            EzoaColors.emerald.withValues(alpha: 0.85),
          ],
        ),
        border: Border.all(color: EzoaColors.emerald.withValues(alpha: 0.45)),
        boxShadow: [
          BoxShadow(
            color: EzoaColors.primary.withValues(alpha: 0.25),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Icon(
        LucideIcons.crown,
        size: compact ? 20 : 24,
        color: Colors.white,
      ),
    );
  }
}

class _ProBadge extends StatelessWidget {
  const _ProBadge({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 6 : 8,
        vertical: compact ? 2 : 3,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            EzoaColors.primary.withValues(alpha: 0.18),
            EzoaColors.emerald.withValues(alpha: 0.14),
          ],
        ),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: EzoaColors.emerald.withValues(alpha: 0.4)),
      ),
      child: Text(
        'PRO',
        style: GoogleFonts.spaceGrotesk(
          fontSize: compact ? 9 : 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.8,
          color: EzoaColors.of(context).emerald,
        ),
      ),
    );
  }
}
