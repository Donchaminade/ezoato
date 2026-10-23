import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router/app_router.dart';
import 'core/theme/ezoa_theme.dart';
import 'core/theme/theme_mode_provider.dart';
import 'features/pitch/pitch_app.dart';
import 'features/pitch/pitch_kit.dart';

const bool kDemoMode = bool.fromEnvironment('DEMO');

class EzoaApp extends ConsumerWidget {
  const EzoaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    // Build de démonstration (pitch) : `--dart-define=DEMO=true`.
    // Expérience entièrement hors ligne, sans backend.
    if (kDemoMode) {
      return MaterialApp(
        title: 'EZOA-TO',
        debugShowCheckedModeBanner: false,
        theme: EzoaTheme.light.copyWith(scaffoldBackgroundColor: const Color(0xFFF3F2EC)),
        darkTheme: EzoaTheme.dark.copyWith(scaffoldBackgroundColor: const Color(0xFF0D1311)),
        themeMode: themeMode,
        home: const PitchOnboarding(),
        builder: (context, child) => DefaultTextStyle.merge(style: const TextStyle(fontFamily: PK.fontBody), child: child!),
      );
    }

    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'EZOA-TO',
      debugShowCheckedModeBanner: false,
      theme: EzoaTheme.light,
      darkTheme: EzoaTheme.dark,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
