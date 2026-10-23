import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router/app_router.dart';
import 'core/theme/ezoa_theme.dart';
import 'core/theme/theme_mode_provider.dart';
import 'features/pitch/pitch_app.dart';
import 'features/pitch/pitch_kit.dart';
import 'core/demo/demo_mode.dart';


class EzoaApp extends ConsumerWidget {
  const EzoaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    // Mode démo (pitch) : données locales, aucun appel au backend.
    if (ref.watch(demoModeProvider)) {
      return MaterialApp(
        title: 'EZOA-TO',
        debugShowCheckedModeBanner: false,
        theme: EzoaTheme.light.copyWith(scaffoldBackgroundColor: const Color(0xFFFCFCFA)),
        darkTheme: EzoaTheme.dark.copyWith(scaffoldBackgroundColor: const Color(0xFF081221)),
        themeMode: themeMode,
        home: const PitchShell(),
        builder: (context, child) => DefaultTextStyle.merge(
          style: const TextStyle(fontFamily: PK.fontBody),
          child: Stack(children: [child!, const DemoBadge()]),
        ),
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
