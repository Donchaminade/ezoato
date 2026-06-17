import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/onboarding/onboarding_provider.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../core/theme/theme_mode_provider.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../../auth/data/auth_repository.dart';

typedef _MenuEntry = (String title, String subtitle, String route, IconData icon);

class AccountMenuScreen extends ConsumerWidget {
  const AccountMenuScreen({super.key});

  static const _accountSection = <_MenuEntry>[
    ('Profil', 'Informations & sécurité', '/account/profile', LucideIcons.user),
    ('Mes soumissions', 'Suivi de vos épreuves soumises', '/account/soumissions', LucideIcons.clipboardList),
    ('Portefeuille & gains', 'Solde, récompenses et retraits', '/account/portefeuille', LucideIcons.wallet),
  ];

  static const _contentSection = <_MenuEntry>[
    ('Abonnement', 'Accès illimité 6 mois — 1000 FCFA', '/account/abonnement', LucideIcons.crown),
    ('Bibliothèque', 'Achats et téléchargements', '/account/bibliotheque', LucideIcons.library),
    ('Favoris', 'Épreuves enregistrées', '/account/favoris', LucideIcons.heart),
    ('Hors ligne', 'PDF téléchargés localement', '/account/offline', LucideIcons.hardDrive),
  ];

  static const _historySection = <_MenuEntry>[
    ('Paiements', 'Historique de vos achats', '/account/paiements', LucideIcons.creditCard),
    ('Téléchargements', 'Historique de vos téléchargements', '/account/downloads', LucideIcons.download),
  ];

  static const _preferencesSection = <_MenuEntry>[
    ('Notifications', 'Alertes et messages', '/account/notifications', LucideIcons.bell),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    return EzoaScreen(
      title: 'Compte',
      subtitle: 'Paramètres et préférences',
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
        children: [
          EzoaScrollReveal(
            child: _AccountProfileCard(
              name: user?.nom ?? 'Utilisateur',
              email: user?.email ?? '',
              role: user?.role,
              onTap: () => context.push('/account/profile'),
            ),
          ),
          const SizedBox(height: 20),
          EzoaStaggerReveal(
            index: 0,
            child: _AccountMenuSection(
              title: 'Mon compte',
              items: _accountSection,
              onItemTap: (route) => context.push(route),
            ),
          ),
          EzoaStaggerReveal(
            index: 1,
            child: _AccountMenuSection(
              title: 'Bibliothèque & contenu',
              items: _contentSection,
              onItemTap: (route) => context.push(route),
            ),
          ),
          EzoaStaggerReveal(
            index: 2,
            child: _AccountMenuSection(
              title: 'Historique',
              items: _historySection,
              onItemTap: (route) => context.push(route),
            ),
          ),
          EzoaStaggerReveal(
            index: 3,
            child: _AccountMenuSection(
              title: 'Préférences',
              items: _preferencesSection,
              onItemTap: (route) => context.push(route),
              trailing: Column(
                children: [
                  const _AccountOnboardingRow(),
                  Divider(
                    height: 1,
                    thickness: 1,
                    indent: 56,
                    color: EzoaColors.of(context).border.withValues(alpha: 0.6),
                  ),
                  const _AccountThemeRow(),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          EzoaScrollReveal(
            child: EzoaButton(
              label: 'Se déconnecter',
              variant: EzoaButtonVariant.outline,
              icon: LucideIcons.logOut,
              onPressed: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go('/login');
              },
            ),
          ),
        ],
      ),
    );
  }
}

String _roleLabel(String? role) {
  return switch (role) {
    'utilisateur' => 'Utilisateur',
    'gestionnaire' => 'Gestionnaire',
    'admin' => 'Administrateur',
    null || '' => '',
    _ => role[0].toUpperCase() + role.substring(1),
  };
}

class _AccountProfileCard extends StatelessWidget {
  const _AccountProfileCard({
    required this.name,
    required this.email,
    required this.role,
    required this.onTap,
  });

  final String name;
  final String email;
  final String? role;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final roleText = _roleLabel(role);
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

    return EzoaGlassCard(
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      enableShine: false,
      borderRadius: 16,
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              gradient: const LinearGradient(
                colors: [EzoaColors.primary, EzoaColors.primaryDark],
              ),
              border: Border.all(color: EzoaColors.emerald.withValues(alpha: 0.4)),
              boxShadow: [
                BoxShadow(
                  color: EzoaColors.primary.withValues(alpha: 0.25),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: Text(
              initial,
              style: GoogleFonts.spaceGrotesk(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: EzoaTypography.titleMedium(context),
                ),
                if (email.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    email,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: EzoaTypography.bodySmall(context),
                  ),
                ],
                if (roleText.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: EzoaColors.primary.withValues(alpha: pal.isDark ? 0.2 : 0.1),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: EzoaColors.primary.withValues(alpha: 0.35),
                      ),
                    ),
                    child: Text(
                      roleText,
                      style: EzoaTypography.badge(context).copyWith(
                        color: pal.emerald,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          Icon(LucideIcons.chevronRight, size: 18, color: pal.textFaint),
        ],
      ),
    );
  }
}

class _AccountMenuSection extends StatelessWidget {
  const _AccountMenuSection({
    required this.title,
    required this.items,
    required this.onItemTap,
    this.trailing,
  });

  final String title;
  final List<_MenuEntry> items;
  final ValueChanged<String> onItemTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              title,
              style: EzoaTypography.titleSmall(context).copyWith(
                color: pal.textDim,
                fontSize: 13,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
            ),
          ),
          EzoaGlassCard(
            margin: EdgeInsets.zero,
            padding: EdgeInsets.zero,
            enableShine: false,
            borderRadius: 16,
            child: Column(
              children: [
                for (final (index, item) in items.indexed) ...[
                  if (index > 0)
                    Divider(
                      height: 1,
                      thickness: 1,
                      indent: 56,
                      color: pal.border.withValues(alpha: 0.6),
                    ),
                  _AccountMenuRow(
                    title: item.$1,
                    subtitle: item.$2,
                    icon: item.$4,
                    onTap: () => onItemTap(item.$3),
                  ),
                ],
                if (trailing != null) ...[
                  if (items.isNotEmpty)
                    Divider(
                      height: 1,
                      thickness: 1,
                      indent: 56,
                      color: pal.border.withValues(alpha: 0.6),
                    ),
                  trailing!,
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AccountMenuRow extends StatelessWidget {
  const _AccountMenuRow({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: EzoaColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: pal.border),
                ),
                child: Icon(icon, size: 18, color: pal.accent),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: EzoaTypography.titleSmall(context)),
                    const SizedBox(height: 1),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: EzoaTypography.bodySmall(context),
                    ),
                  ],
                ),
              ),
              Icon(LucideIcons.chevronRight, size: 16, color: pal.textFaint),
            ],
          ),
        ),
      ),
    );
  }
}

class _AccountOnboardingRow extends ConsumerWidget {
  const _AccountOnboardingRow();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pal = EzoaColors.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () async {
          context.go('/home');
          await Future<void>.delayed(const Duration(milliseconds: 350));
          if (!context.mounted) return;
          await ref.read(onboardingProvider.notifier).startTour(context);
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: EzoaColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: pal.border),
                ),
                child: Icon(LucideIcons.compass, size: 18, color: pal.accent),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Guide de l\'application',
                      style: EzoaTypography.titleSmall(context),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      'Revoir la visite guidée',
                      style: EzoaTypography.bodySmall(context),
                    ),
                  ],
                ),
              ),
              Icon(LucideIcons.chevronRight, size: 16, color: pal.textFaint),
            ],
          ),
        ),
      ),
    );
  }
}

class _AccountThemeRow extends ConsumerWidget {
  const _AccountThemeRow();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    final isDark = mode == ThemeMode.dark;
    final pal = EzoaColors.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => ref.read(themeModeProvider.notifier).toggle(),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: EzoaColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: pal.border),
                ),
                child: Icon(
                  isDark ? LucideIcons.moon : LucideIcons.sun,
                  size: 18,
                  color: pal.accent,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Apparence', style: EzoaTypography.titleSmall(context)),
                    const SizedBox(height: 1),
                    Text(
                      isDark ? 'Mode sombre' : 'Mode clair',
                      style: EzoaTypography.bodySmall(context),
                    ),
                  ],
                ),
              ),
              Switch(
                value: !isDark,
                onChanged: (light) => ref
                    .read(themeModeProvider.notifier)
                    .setMode(light ? ThemeMode.light : ThemeMode.dark),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
