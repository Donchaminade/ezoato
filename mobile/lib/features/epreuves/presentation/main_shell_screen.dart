import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../shared/widgets/ezoa_widgets.dart';

class MainShellScreen extends StatelessWidget {
  const MainShellScreen({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBody: true,
      body: navigationShell,
      bottomNavigationBar: EzoaGlassNavBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: navigationShell.goBranch,
        // L'ordre suit les branches du StatefulShellRoute :
        // 0 Accueil, 1 Archives, 2 Soumettre (bouton central), 3 Favoris,
        // 4 Compte.
        centerIndex: 2,
        items: const [
          EzoaNavBarItem(icon: LucideIcons.home, label: 'Accueil'),
          EzoaNavBarItem(icon: LucideIcons.archive, label: 'Archives'),
          EzoaNavBarItem(icon: LucideIcons.upload, label: 'Soumettre'),
          EzoaNavBarItem(icon: LucideIcons.heart, label: 'Favoris'),
          EzoaNavBarItem(icon: LucideIcons.user, label: 'Compte'),
        ],
      ),
    );
  }
}
