import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router/app_router.dart';
import 'core/theme/ezoa_theme.dart';
import 'core/theme/theme_mode_provider.dart';

class EzoaApp extends ConsumerWidget {
  const EzoaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);

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
