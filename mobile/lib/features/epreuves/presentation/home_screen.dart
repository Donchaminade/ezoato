import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/onboarding/onboarding_keys.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/connectivity_service.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../../../shared/widgets/subscription_pro_widgets.dart';
import '../../account/data/subscription_providers.dart';
import '../../account/data/wallet_providers.dart';
import '../../account/presentation/downloads_screen.dart'
    show mesDownloadsProvider;
import '../../account/presentation/soumissions_screen.dart'
    show mesSoumissionsProvider;
import '../../auth/data/auth_repository.dart';
import '../../offline/data/offline_repository.dart';

final metaProvider = FutureProvider<PublicMeta>((ref) async {
  if (!ref.watch(isOnlineProvider)) throw Exception('offline');
  return ref.watch(apiClientProvider).getMeta();
});

/// Statistiques personnelles de l'utilisateur connecté pour l'accueil
/// (réutilise les providers existants : soumissions et téléchargements).
final homeUserStatsProvider = FutureProvider<
    ({int validees, int enAttente, int telechargements})>(
  (ref) async {
    if (!ref.watch(isOnlineProvider)) throw Exception('offline');
    final soumissions = await ref.watch(mesSoumissionsProvider.future);
    final downloads = await ref.watch(mesDownloadsProvider.future);
    return (
      validees: soumissions.where((s) => s.statut == 'validee').length,
      enAttente: soumissions.where((s) => s.statut == 'en_attente').length,
      telechargements: downloads.length,
    );
  },
);

final recentEpreuvesProvider = FutureProvider<List<Epreuve>>((ref) async {
  if (!ref.watch(isOnlineProvider)) {
    final offline = await ref.watch(offlineListProvider.future);
    final repo = ref.watch(offlineRepositoryProvider);
    return offline
        .map(repo.parseMetadata)
        .whereType<Epreuve>()
        .toList();
  }
  final page = await ref.watch(apiClientProvider).listEpreuves(
        const ListEpreuvesParams(page: 1, perPage: 5),
      );
  return page.items;
});

String _homeGreeting(User? user) {
  final nom = user?.nom.trim();
  if (nom != null && nom.isNotEmpty) {
    final prenom = nom.split(RegExp(r'\s+')).first;
    if (prenom.isNotEmpty) return 'Bonjour, $prenom';
  }
  return 'Bonjour';
}

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(isOnlineProvider);
    final epreuvesAsync = ref.watch(recentEpreuvesProvider);
    final greeting = _homeGreeting(ref.watch(authProvider).user);

    return EzoaScreen(
      title: greeting,
      subtitle: 'Archives scolaires du Togo',
      headerKey: OnboardingKeys.homeHeader,
      isOnline: isOnline,
      headerTrailing: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _TopBarNotificationsButton(),
          EzoaThemeToggleButton(),
        ],
      ),
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(metaProvider);
          ref.invalidate(recentEpreuvesProvider);
          ref.invalidate(offlineListProvider);
          if (isOnline) {
            ref.invalidate(walletProvider);
            ref.invalidate(homeUserStatsProvider);
            ref.invalidate(subscriptionStatusProvider);
          }
        },
        color: EzoaColors.of(context).accent,
        child: ListView(
          padding: const EdgeInsets.only(top: 14, bottom: 110),
          children: [
            // Carte portefeuille : en ligne uniquement (l'API exige le
            // réseau ; hors ligne la carte est masquée, pas de crash).
            if (isOnline)
              EzoaScrollReveal(
                offset: 35,
                child: KeyedSubtree(
                  key: OnboardingKeys.wallet,
                  child: const HomeWalletCard(),
                ),
              ),
            if (isOnline)
              ref.watch(subscriptionStatusProvider).maybeWhen(
                    data: (s) => !s.actif
                        ? EzoaScrollReveal(
                            child: SubscriptionProUpgradeBanner(
                              status: s,
                              compact: true,
                            ),
                          )
                        : s.isExpiringSoon
                            ? EzoaScrollReveal(
                                child: SubscriptionProStatusBadge(status: s),
                              )
                            : const SizedBox.shrink(),
                    orElse: () => const SizedBox.shrink(),
                  ),
            KeyedSubtree(
              key: OnboardingKeys.quickActions,
              child: const _QuickActionsRow(),
            ),
            if (isOnline) const _UserStatsSection(),
            Padding(
              key: OnboardingKeys.recentEpreuves,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      isOnline
                          ? 'Dernières épreuves'
                          : 'Ma bibliothèque hors ligne',
                      style: EzoaTypography.titleSmall(context),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => isOnline
                        ? context.go('/archives')
                        : context.push('/account/offline'),
                    behavior: HitTestBehavior.opaque,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Voir tout',
                          style: EzoaTypography.bodySmall(context).copyWith(
                            color: EzoaColors.of(context).accent,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Icon(
                          LucideIcons.chevronRight,
                          size: 16,
                          color: EzoaColors.of(context).accent,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            epreuvesAsync.when(
              data: (items) {
                if (items.isEmpty) {
                  return EmptyState(
                    title: isOnline ? 'Aucune épreuve' : 'Rien en hors ligne',
                    message: isOnline
                        ? 'Les épreuves apparaîtront ici'
                        : 'Téléchargez des épreuves depuis Archives',
                    icon: LucideIcons.bookOpen,
                  );
                }
                if (!isOnline) {
                  return _OfflineLibraryHomeGrid(items: items);
                }
                return SizedBox(
                  height: _RecentEpreuveHorizontalCard.height,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    physics: const BouncingScrollPhysics(),
                    primary: false,
                    itemCount: items.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(width: _RecentEpreuveHorizontalCard.spacing),
                    itemBuilder: (context, index) {
                      final epreuve = items[index];
                      return EzoaStaggerReveal(
                        index: index,
                        child: _RecentEpreuveHorizontalCard(
                          epreuve: epreuve,
                          isOffline: false,
                          onTap: () =>
                              context.push('/epreuve/${epreuve.id}'),
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const _RecentEpreuvesLoadingRow(),
              error: (e, _) => EmptyState(
                title: 'Erreur de chargement',
                message: e.toString(),
                icon: LucideIcons.alertCircle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Cloche de notifications du topbar (même style que le toggle thème).
class _TopBarNotificationsButton extends StatelessWidget {
  const _TopBarNotificationsButton();

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Notifications',
      onPressed: () => context.push('/account/notifications'),
      icon: Icon(
        LucideIcons.bell,
        size: 20,
        color: EzoaColors.of(context).accent,
      ),
    );
  }
}

/// Statistiques de l'utilisateur connecté : soumissions validées / en
/// attente, téléchargements. En cas d'erreur (ex. session expirée),
/// repli sur les statistiques publiques de la plateforme.
class _UserStatsSection extends ConsumerWidget {
  const _UserStatsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(homeUserStatsProvider);

    return statsAsync.when(
      loading: () => const _StatsSkeleton(),
      error: (_, __) => const _PublicStatsFallback(),
      data: (stats) {
        final allZero = stats.validees == 0 &&
            stats.enAttente == 0 &&
            stats.telechargements == 0;

        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Mon activité', style: EzoaTypography.titleSmall(context)),
              const SizedBox(height: 10),
              if (allZero)
                _StatsEmptyEncouragement(onSubmit: () => context.go('/submit'))
              else
                Row(
                  children: [
                    Expanded(
                      child: StatChip(
                        label: 'Validées',
                        value: stats.validees,
                        icon: LucideIcons.checkCircle2,
                        onTap: () => context.push('/account/soumissions'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: StatChip(
                        label: 'En attente',
                        value: stats.enAttente,
                        icon: LucideIcons.clock,
                        onTap: () => context.push('/account/soumissions'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: StatChip(
                        label: 'Téléchargés',
                        value: stats.telechargements,
                        icon: LucideIcons.download,
                        onTap: () => context.push('/account/downloads'),
                      ),
                    ),
                  ],
                ),
            ],
          ),
        );
      },
    );
  }
}

class _StatsEmptyEncouragement extends StatelessWidget {
  const _StatsEmptyEncouragement({required this.onSubmit});

  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return EzoaGlassCard(
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
      enableShine: false,
      borderRadius: 14,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Partagez une épreuve pour commencer votre activité.',
            style: EzoaTypography.bodySmall(context).copyWith(
              color: pal.textMuted,
            ),
          ),
          const SizedBox(height: 10),
          GestureDetector(
            onTap: onSubmit,
            behavior: HitTestBehavior.opaque,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Soumettre une épreuve',
                  style: EzoaTypography.bodySmall(context).copyWith(
                    color: pal.accent,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Icon(LucideIcons.chevronRight, size: 16, color: pal.accent),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsSkeleton extends StatelessWidget {
  const _StatsSkeleton();

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    Widget chipSkeleton() => Container(
          height: 108,
          decoration: BoxDecoration(
            color: pal.subtleFill,
            borderRadius: BorderRadius.circular(16),
          ),
        );

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Mon activité', style: EzoaTypography.titleSmall(context)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: chipSkeleton()),
              const SizedBox(width: 10),
              Expanded(child: chipSkeleton()),
              const SizedBox(width: 10),
              Expanded(child: chipSkeleton()),
            ],
          ),
        ],
      ),
    );
  }
}

/// Repli : statistiques publiques de la plateforme (anciennes stats accueil).
class _PublicStatsFallback extends ConsumerWidget {
  const _PublicStatsFallback();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metaAsync = ref.watch(metaProvider);

    return metaAsync.when(
      loading: () => const _StatsSkeleton(),
      error: (_, __) => const SizedBox.shrink(),
      data: (meta) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: Row(
          children: [
            Expanded(
              child: StatChip(
                label: 'Épreuves',
                value: meta.stats.epreuvesValidees,
                icon: LucideIcons.fileText,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: StatChip(
                label: 'Téléchargements',
                value: meta.stats.telechargements,
                icon: LucideIcons.download,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: StatChip(
                label: 'Contributeurs',
                value: meta.stats.contributeurs,
                icon: LucideIcons.users,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Carte portefeuille de l'accueil : solde, gains et progression vers la
/// prochaine récompense (mêmes données que l'écran Portefeuille via le
/// [walletProvider] partagé). Tap → `/account/portefeuille`.
///
/// Chargement : placeholder discret ; erreur : carte masquée (pas de crash).
class HomeWalletCard extends ConsumerWidget {
  const HomeWalletCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final walletAsync = ref.watch(walletProvider);

    return walletAsync.when(
      loading: () => const _WalletPlaceholder(),
      error: (_, __) => const SizedBox.shrink(),
      data: (wallet) => _WalletCardBody(wallet: wallet),
    );
  }
}

class _WalletPlaceholder extends StatelessWidget {
  const _WalletPlaceholder();

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    Widget bar(double width) => Container(
          width: width,
          height: 12,
          decoration: BoxDecoration(
            color: pal.subtleFill,
            borderRadius: BorderRadius.circular(6),
          ),
        );

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 18),
      child: EzoaGlassCard(
        margin: EdgeInsets.zero,
        enableShine: false,
        borderRadius: 20,
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            bar(96),
            const SizedBox(height: 14),
            bar(160),
            const SizedBox(height: 14),
            bar(double.infinity),
          ],
        ),
      ),
    );
  }
}

class _WalletCardBody extends ConsumerWidget {
  const _WalletCardBody({required this.wallet});

  final ContributorWallet wallet;

  String _activitySummary(({int validees, int enAttente, int telechargements}) stats) {
    final parts = <String>[];
    if (stats.enAttente > 0) {
      parts.add('${stats.enAttente} en attente');
    }
    if (stats.telechargements > 0) {
      parts.add('${stats.telechargements} téléchargé${stats.telechargements > 1 ? 's' : ''}');
    }
    return parts.join(' · ');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pal = EzoaColors.of(context);
    final fmt = NumberFormat.decimalPattern('fr_FR');
    final progression = wallet.epreuvesParRecompense > 0
        ? wallet.progressionPalier / wallet.epreuvesParRecompense
        : 0.0;
    final statsAsync = ref.watch(homeUserStatsProvider);

    return Padding(
      // Marge basse généreuse : laisse l'ombre marquée respirer.
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 18),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            // Ombre noire douce et marquée sous la carte.
            BoxShadow(
              color: Colors.black.withValues(alpha: pal.isDark ? 0.50 : 0.22),
              blurRadius: 28,
              offset: const Offset(0, 14),
            ),
            // Lueur emerald/primary très subtile (effet premium).
            BoxShadow(
              color: EzoaColors.primary.withValues(alpha: 0.16),
              blurRadius: 32,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: EzoaGlassCard(
          margin: EdgeInsets.zero,
          borderRadius: 20,
          padding: const EdgeInsets.all(20),
          onTap: () => context.push('/account/portefeuille'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(9),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [EzoaColors.primary, EzoaColors.primaryDark],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: EzoaColors.emerald.withValues(alpha: 0.35),
                      ),
                    ),
                    child: const Icon(
                      LucideIcons.wallet,
                      size: 18,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Portefeuille',
                          style: EzoaTypography.titleSmall(context),
                        ),
                        Text(
                          'Solde disponible',
                          style: EzoaTypography.bodySmall(context)
                              .copyWith(fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Icon(LucideIcons.chevronRight, size: 18, color: pal.textFaint),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                '${fmt.format(wallet.solde)} FCFA',
                style: GoogleFonts.spaceGrotesk(
                  fontSize: 30,
                  fontWeight: FontWeight.w800,
                  color: pal.emerald,
                ),
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: progression,
                  minHeight: 6,
                  backgroundColor: pal.progressTrack,
                  color: pal.emerald,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${wallet.progressionPalier}/${wallet.epreuvesParRecompense} '
                      'vers la prochaine récompense',
                      style: EzoaTypography.mono(context).copyWith(fontSize: 10),
                    ),
                  ),
                  Text(
                    '+${fmt.format(wallet.montantRecompense)} FCFA',
                    style: EzoaTypography.mono(context)
                        .copyWith(fontSize: 10, color: pal.emerald),
                  ),
                ],
              ),
              statsAsync.when(
                data: (stats) {
                  final summary = _activitySummary(stats);
                  if (summary.isEmpty) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      summary,
                      style: EzoaTypography.bodySmall(context).copyWith(
                        fontSize: 11,
                        color: pal.textMuted,
                      ),
                    ),
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Raccourcis hors barre de navigation : Bibliothèque et Hors ligne.
class _QuickActionsRow extends ConsumerWidget {
  const _QuickActionsRow();

  static const _spacing = 8.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(isOnlineProvider);
    final actions = <(IconData, String, VoidCallback)>[
      if (isOnline)
        (
          LucideIcons.library,
          'Bibliothèque',
          () => context.push('/account/bibliotheque'),
        ),
      (
        LucideIcons.hardDrive,
        'Hors ligne',
        () => context.push('/account/offline'),
      ),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Raccourcis', style: EzoaTypography.titleSmall(context)),
          const SizedBox(height: 8),
          Row(
            children: [
              for (final (index, action) in actions.indexed) ...[
                if (index > 0) const SizedBox(width: _spacing),
                Expanded(
                  child: _QuickActionTile(
                    icon: action.$1,
                    label: action.$2,
                    onTap: action.$3,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

/// Grille 2 colonnes « Ma bibliothèque hors ligne » sur l'accueil.
class _OfflineLibraryHomeGrid extends ConsumerWidget {
  const _OfflineLibraryHomeGrid({required this.items});

  final List<Epreuve> items;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entriesAsync = ref.watch(offlineLibraryEntriesProvider);
    final previewById = {
      for (final e in entriesAsync.valueOrNull ?? const <OfflineLibraryEntry>[])
        if (e.previewPath != null) e.item.id: e.previewPath!,
    };

    final rows = (items.length / 2).ceil();
    final height = rows * 204.0 + (rows > 1 ? (rows - 1) * 12.0 : 0);

    return SizedBox(
      height: height,
      child: GridView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          mainAxisExtent: 204,
        ),
        itemCount: items.length,
        itemBuilder: (context, i) {
          final e = items[i];
          final previewPath = previewById[e.id];
          return EpreuveGridCard(
            titre: e.titre,
            matiere: e.matiere,
            classe: e.classe,
            annee: e.annee,
            ville: e.ville,
            telechargements: e.telechargements,
            type: e.type,
            isOffline: true,
            revealIndex: i,
            previewImage:
                previewPath != null ? FileImage(File(previewPath)) : null,
            onTap: () => context.push('/epreuve/${e.id}'),
          );
        },
      ),
    );
  }
}

/// Carte compacte pour le carrousel horizontal « Dernières épreuves ».
class _RecentEpreuveHorizontalCard extends StatelessWidget {
  const _RecentEpreuveHorizontalCard({
    required this.epreuve,
    required this.isOffline,
    required this.onTap,
  });

  static const width = 280.0;
  static const height = 188.0;
  static const spacing = 12.0;

  final Epreuve epreuve;
  final bool isOffline;
  final VoidCallback onTap;

  static const _gradients = [
    [Color(0xFF006A4E), Color(0xFF004D38)],
    [Color(0xFF4338CA), Color(0xFF312E81)],
    [Color(0xFF0E7490), Color(0xFF155E75)],
    [Color(0xFF7C3AED), Color(0xFF5B21B6)],
    [Color(0xFFB45309), Color(0xFF92400E)],
  ];

  IconData get _typeIcon {
    switch (epreuve.type) {
      case 'examen':
        return LucideIcons.graduationCap;
      case 'composition':
        return LucideIcons.clipboardList;
      case 'corrige':
        return LucideIcons.checkCircle2;
      default:
        return LucideIcons.fileText;
    }
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final gradient =
        _gradients[epreuve.matiere.hashCode.abs() % _gradients.length];

    return SizedBox(
      width: width,
      height: height,
      child: EzoaGlassCard(
        margin: EdgeInsets.zero,
        padding: EdgeInsets.zero,
        borderRadius: 14,
        enableShine: false,
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: 78,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: gradient,
                  ),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(14),
                  ),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      top: -12,
                      right: -12,
                      child: Icon(
                        LucideIcons.sparkles,
                        size: 52,
                        color: Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                    Center(
                      child: Icon(
                        _typeIcon,
                        size: 28,
                        color: Colors.white.withValues(alpha: 0.88),
                      ),
                    ),
                    Positioned(
                      top: 7,
                      left: 7,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.32),
                          borderRadius: BorderRadius.circular(7),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.22),
                          ),
                        ),
                        child: Text(
                          epreuve.matiere.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: 7.5,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                            color: Colors.white.withValues(alpha: 0.95),
                          ),
                        ),
                      ),
                    ),
                    if (isOffline)
                      Positioned(
                        top: 7,
                        right: 7,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.35),
                            borderRadius: BorderRadius.circular(7),
                            border: Border.all(
                              color: pal.emerald.withValues(alpha: 0.5),
                            ),
                          ),
                          child: Icon(
                            LucideIcons.hardDrive,
                            size: 12,
                            color: pal.emerald,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 9, 10, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      epreuve.titre,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: pal.text,
                        height: 1.25,
                      ),
                    ),
                    const Spacer(),
                    Wrap(
                      spacing: 4,
                      runSpacing: 4,
                      children: [
                        _RecentEpreuveMiniBadge(label: epreuve.classe),
                        _RecentEpreuveMiniBadge(label: '${epreuve.annee}'),
                        if (epreuve.telechargements > 0)
                          _RecentEpreuveMiniBadge(
                            label: formatCompteurCompact(
                              epreuve.telechargements,
                            ),
                            icon: LucideIcons.download,
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      epreuve.ville.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: EzoaTypography.badge(context).copyWith(
                        color: pal.textFaint,
                        fontSize: 7.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecentEpreuveMiniBadge extends StatelessWidget {
  const _RecentEpreuveMiniBadge({required this.label, this.icon});

  final String label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: pal.subtleFill,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: pal.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 9, color: pal.textDim),
            const SizedBox(width: 3),
          ],
          Text(
            label,
            style: EzoaTypography.badge(context).copyWith(
              color: pal.textDim,
              fontSize: 8,
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentEpreuvesLoadingRow extends StatelessWidget {
  const _RecentEpreuvesLoadingRow();

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    Widget skeletonCard() => Container(
          width: _RecentEpreuveHorizontalCard.width,
          height: _RecentEpreuveHorizontalCard.height,
          decoration: BoxDecoration(
            color: pal.subtleFill,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: pal.border),
          ),
        );

    return SizedBox(
      height: _RecentEpreuveHorizontalCard.height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        physics: const NeverScrollableScrollPhysics(),
        primary: false,
        itemCount: 3,
        separatorBuilder: (_, __) =>
            const SizedBox(width: _RecentEpreuveHorizontalCard.spacing),
        itemBuilder: (_, __) => skeletonCard(),
      ),
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return EzoaGlassCard(
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      borderRadius: 12,
      enableShine: false,
      onTap: onTap,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: pal.accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: pal.accent),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: pal.text,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
