import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/onboarding/onboarding_keys.dart';
import '../../../core/onboarding/onboarding_provider.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../../account/data/subscription_providers.dart';

class MainShellScreen extends ConsumerStatefulWidget {
  const MainShellScreen({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  ConsumerState<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends ConsumerState<MainShellScreen> {
  bool _autoStartScheduled = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _scheduleAutoStartIfNeeded();
  }

  void _scheduleAutoStartIfNeeded() {
    if (_autoStartScheduled) return;
    if (!ref.read(onboardingProvider).shouldAutoShow) return;
    if (widget.navigationShell.currentIndex != 0) return;

    _autoStartScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      await Future<void>.delayed(const Duration(milliseconds: 450));
      if (!mounted) return;
      if (widget.navigationShell.currentIndex != 0) return;
      await ref.read(onboardingProvider.notifier).startTour(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<OnboardingState>(onboardingProvider, (previous, next) {
      if (next.shouldAutoShow &&
          widget.navigationShell.currentIndex == 0 &&
          !_autoStartScheduled) {
        _scheduleAutoStartIfNeeded();
      }
    });

    final subscriptionAsync = ref.watch(subscriptionStatusProvider);
    final showExpiredBadge = subscriptionAsync.maybeWhen(
      data: (s) => s.expire && !s.actif,
      orElse: () => false,
    );

    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBody: true,
      body: widget.navigationShell,
      bottomNavigationBar: EzoaGlassNavBar(
        barKey: OnboardingKeys.navBar,
        centerButtonKey: OnboardingKeys.navSubmit,
        selectedIndex: widget.navigationShell.currentIndex,
        onDestinationSelected: widget.navigationShell.goBranch,
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
