import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/onboarding/onboarding_keys.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../../account/data/subscription_providers.dart';

class MainShellScreen extends ConsumerWidget {
  const MainShellScreen({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subscriptionAsync = ref.watch(subscriptionStatusProvider);
    final showExpiredBadge = subscriptionAsync.maybeWhen(
      data: (s) => s.expire && !s.actif,
      orElse: () => false,
    );

    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBody: true,
      body: navigationShell,
      bottomNavigationBar: EzoaGlassNavBar(
        barKey: OnboardingKeys.navBar,
        centerButtonKey: OnboardingKeys.navSubmit,
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: navigationShell.goBranch,
        // L'ordre suit les branches du StatefulShellRoute :
        // 0 Accueil, 1 Archives, 2 Soumettre (bouton central), 3 Favoris,
        // 4 Compte.
        centerIndex: 2,
        items: [
          const EzoaNavBarItem(icon: LucideIcons.home, label: 'Accueil'),
          const EzoaNavBarItem(icon: LucideIcons.archive, label: 'Archives'),
          const EzoaNavBarItem(icon: LucideIcons.upload, label: 'Soumettre'),
          const EzoaNavBarItem(icon: LucideIcons.heart, label: 'Favoris'),
          EzoaNavBarItem(
            icon: LucideIcons.user,
            label: 'Compte',
            showBadge: showExpiredBadge,
          ),
        ],
      ),
    );
  }
}
