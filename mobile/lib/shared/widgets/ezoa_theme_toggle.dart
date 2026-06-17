import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/ezoa_theme.dart';
import '../../core/theme/theme_mode_provider.dart';
import 'ezoa_glass_card.dart';

/// IconButton soleil/lune pour basculer sombre ↔ clair (header glass).
class EzoaThemeToggleButton extends ConsumerWidget {
  const EzoaThemeToggleButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    final isDark = mode == ThemeMode.dark;
    final pal = EzoaColors.of(context);

    return IconButton(
      tooltip: isDark ? 'Passer en mode clair' : 'Passer en mode sombre',
      onPressed: () => ref.read(themeModeProvider.notifier).toggle(),
      icon: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        transitionBuilder: (child, animation) => RotationTransition(
          turns: Tween(begin: 0.75, end: 1.0).animate(animation),
          child: FadeTransition(opacity: animation, child: child),
        ),
        child: Icon(
          isDark ? LucideIcons.sun : LucideIcons.moon,
          key: ValueKey(isDark),
          size: 20,
          color: pal.accent,
        ),
      ),
    );
  }
}

/// Tuile « Apparence » avec switch sombre/clair pour le menu Compte.
class EzoaThemeTile extends ConsumerWidget {
  const EzoaThemeTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeModeProvider);
    final isDark = mode == ThemeMode.dark;
    final pal = EzoaColors.of(context);

    return EzoaGlassCard(
      onTap: () => ref.read(themeModeProvider.notifier).toggle(),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: EzoaColors.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: pal.border),
            ),
            child: Icon(
              isDark ? LucideIcons.moon : LucideIcons.sun,
              size: 20,
              color: pal.accent,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Apparence', style: EzoaTypography.titleSmall(context)),
                const SizedBox(height: 2),
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
    );
  }
}
