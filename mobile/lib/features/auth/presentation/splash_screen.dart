import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/onboarding/onboarding_provider.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../data/auth_repository.dart';

/// Écran de lancement animé (fond clair, logo + nom) avant login/home.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  static const _bg = Color(0xFFFAFAFA);
  static const _holdDuration = Duration(milliseconds: 1600);

  late final AnimationController _controller;
  late final Animation<double> _logoFade;
  late final Animation<double> _logoScale;
  late final Animation<double> _titleFade;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
        systemNavigationBarColor: _bg,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
    );

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    );

    _logoFade = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.55, curve: Curves.easeOut),
    );
    _logoScale = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.7, curve: Curves.easeOutCubic),
      ),
    );
    _titleFade = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.35, 0.9, curve: Curves.easeOut),
    );

    _controller.forward();
    Future<void>.delayed(_holdDuration, _route);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _route() {
    if (!mounted) return;
    final auth = ref.read(authProvider);
    final onboarding = ref.read(onboardingProvider);
    if (auth.isLoading || !onboarding.loaded) {
      Future<void>.delayed(const Duration(milliseconds: 300), _route);
      return;
    }
    if (!onboarding.completed) {
      context.go('/onboarding');
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
    ref.listen(onboardingProvider, (_, __) => _route());

    final bottomPad = MediaQuery.sizeOf(context).height * 0.18;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
        systemNavigationBarColor: _bg,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: _bg,
        body: Stack(
          fit: StackFit.expand,
          children: [
            Center(
              child: FadeTransition(
                opacity: _logoFade,
                child: ScaleTransition(
                  scale: _logoScale,
                  child: Image.asset(
                    'assets/images/logo-ezoa.png',
                    height: 148,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            ),
            Positioned(
              left: 24,
              right: 24,
              bottom: bottomPad,
              child: FadeTransition(
                opacity: _titleFade,
                child: Text(
                  'EZOA-TO',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 4,
                    color: EzoaColors.primary,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
