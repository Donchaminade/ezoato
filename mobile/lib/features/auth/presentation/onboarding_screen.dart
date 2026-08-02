import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/onboarding/onboarding_provider.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/auth_repository.dart';

class _OnboardingPage {
  const _OnboardingPage({
    required this.asset,
    required this.title,
    required this.body,
  });

  final String asset;
  final String title;
  final String body;
}

const _pages = <_OnboardingPage>[
  _OnboardingPage(
    asset: 'assets/images/onboarding/01-archives-search.png',
    title: 'Archives à portée de main',
    body:
        'Cherchez et consultez les sujets du collège, du lycée et des concours, organisés pour réviser efficacement.',
  ),
  _OnboardingPage(
    asset: 'assets/images/onboarding/02-submit-contribute.png',
    title: 'Partagez vos sujets',
    body:
        'Soumettez une épreuve en quelques étapes et enrichissez l’archive pour toute la communauté.',
  ),
  _OnboardingPage(
    asset: 'assets/images/onboarding/03-pro-mobile-money.png',
    title: 'Passez Pro, payez en Mobile Money',
    body:
        'Débloquez plus de téléchargements et d’avantages. Abonnement simple, paiement local.',
  ),
  _OnboardingPage(
    asset: 'assets/images/onboarding/04-offline-levels.png',
    title: 'Favoris et révision hors ligne',
    body:
        'Enregistrez vos épreuves préférées et révisez sans connexion, à votre rythme.',
  ),
];

/// Carousel plein écran affiché une seule fois au premier lancement.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  static const _bg = Color(0xFFFAFAFA);

  bool get _isLast => _index >= _pages.length - 1;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await ref.read(onboardingProvider.notifier).markCompleted();
    if (!mounted) return;
    final auth = ref.read(authProvider);
    context.go(auth.isAuthenticated ? '/home' : '/login');
  }

  void _next() {
    if (_isLast) {
      _finish();
      return;
    }
    _controller.nextPage(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final bottomInset = MediaQuery.paddingOf(context).bottom;

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
        body: SafeArea(
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: _finish,
                  child: Text(
                    'Passer',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: pal.textMuted,
                    ),
                  ),
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _pages.length,
                  onPageChanged: (i) => setState(() => _index = i),
                  itemBuilder: (context, i) {
                    final page = _pages[i];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 28),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const Spacer(flex: 1),
                          Expanded(
                            flex: 7,
                            child: Center(
                              child: Image.asset(
                                page.asset,
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                          const SizedBox(height: 28),
                          Text(
                            page.title,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 26,
                              fontWeight: FontWeight.w700,
                              height: 1.2,
                              color: EzoaColors.primary,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            page.body,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.inter(
                              fontSize: 15.5,
                              height: 1.45,
                              color: pal.textMuted,
                            ),
                          ),
                          const Spacer(flex: 2),
                        ],
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: EdgeInsets.fromLTRB(28, 8, 28, 16 + bottomInset),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(_pages.length, (i) {
                        final active = i == _index;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          height: 8,
                          width: active ? 22 : 8,
                          decoration: BoxDecoration(
                            color: active
                                ? EzoaColors.primary
                                : EzoaColors.primary.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(99),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 22),
                    SizedBox(
                      width: double.infinity,
                      child: EzoaButton(
                        label: _isLast ? 'Commencer' : 'Suivant',
                        onPressed: _next,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
