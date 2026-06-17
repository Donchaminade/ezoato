import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/auth_repository.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);
    Future<void>.delayed(const Duration(milliseconds: 1200), _route);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _route() {
    if (!mounted) return;
    final auth = ref.read(authProvider);
    if (auth.isLoading) {
      Future<void>.delayed(const Duration(milliseconds: 300), _route);
      return;
    }
    if (auth.isAuthenticated) {
      context.go('/home');
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authProvider, (_, __) => _route());

    return EzoaScaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedBuilder(
              animation: _pulseController,
              builder: (context, child) {
                return Transform.scale(
                  scale: 1.0 + _pulseController.value * 0.03,
                  child: child,
                );
              },
              child: const EzoaLogo(height: 140),
            ),
            const SizedBox(height: 28),
            Text(
              'ARCHIVES SCOLAIRES DU TOGO',
              style: EzoaTypography.badge(context).copyWith(
                fontSize: 11,
                letterSpacing: 2,
                color: EzoaColors.of(context).accent,
              ),
            ),
            const SizedBox(height: 48),
            const EzoaGlassLoader(),
          ],
        ),
      ),
    );
  }
}
