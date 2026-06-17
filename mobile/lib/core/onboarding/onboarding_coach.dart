import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:tutorial_coach_mark/tutorial_coach_mark.dart';

import '../theme/ezoa_theme.dart';
import '../../shared/widgets/ezoa_glass_card.dart';
import 'onboarding_keys.dart';

typedef OnboardingCompleteCallback = Future<void> Function();

class _OnboardingStep {
  const _OnboardingStep({
    required this.id,
    required this.key,
    required this.title,
    required this.description,
    required this.align,
    this.shape = ShapeLightFocus.RRect,
    this.radius = 16,
    this.paddingFocus = 8,
  });

  final String id;
  final GlobalKey key;
  final String title;
  final String description;
  final ContentAlign align;
  final ShapeLightFocus shape;
  final double radius;
  final double paddingFocus;
}

/// Affiche le parcours guidé si les cibles sont montées dans l'arbre.
Future<void> showOnboardingCoachMark({
  required BuildContext context,
  required OnboardingCompleteCallback onComplete,
}) async {
  final steps = _buildSteps(context);
  if (steps.isEmpty) return;

  final pal = EzoaColors.of(context);
  var completed = false;

  Future<void> finish() async {
    if (completed) return;
    completed = true;
    await onComplete();
  }

  final targets = <TargetFocus>[];
  for (var i = 0; i < steps.length; i++) {
    final step = steps[i];
    final stepIndex = i;
    final total = steps.length;

    targets.add(
      TargetFocus(
        identify: step.id,
        keyTarget: step.key,
        alignSkip: Alignment.topRight,
        shape: step.shape,
        radius: step.radius,
        paddingFocus: step.paddingFocus,
        enableTargetTab: false,
        borderSide: BorderSide(
          color: pal.emerald.withValues(alpha: 0.85),
          width: 2,
        ),
        contents: [
          TargetContent(
            align: step.align,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            builder: (ctx, controller) => _OnboardingStepCard(
              title: step.title,
              description: step.description,
              stepIndex: stepIndex,
              totalSteps: total,
              onSkip: () async {
                await finish();
                controller.skip();
              },
              onNext: () async {
                if (stepIndex >= total - 1) {
                  await finish();
                  controller.skip();
                } else {
                  controller.next();
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  if (!context.mounted) return;

  TutorialCoachMark(
    targets: targets,
    colorShadow: Colors.black,
    opacityShadow: 0.78,
    hideSkip: true,
    pulseEnable: true,
    paddingFocus: 10,
    imageFilter: ImageFilter.blur(sigmaX: 2, sigmaY: 2),
    onFinish: finish,
    onSkip: () {
      finish();
      return true;
    },
  ).show(context: context);
}

List<_OnboardingStep> _buildSteps(BuildContext context) {
  final all = <_OnboardingStep>[
    _OnboardingStep(
      id: 'welcome',
      key: OnboardingKeys.homeHeader,
      title: 'Bienvenue sur EZOA-TO',
      description:
          'Retrouvez ici les archives scolaires du Togo : épreuves, '
          'corrigés et ressources pour réviser efficacement.',
      align: ContentAlign.bottom,
      radius: 0,
      paddingFocus: 0,
    ),
    _OnboardingStep(
      id: 'navigation',
      key: OnboardingKeys.navBar,
      title: 'Navigation principale',
      description:
          'Accueil pour votre tableau de bord, Archives pour explorer '
          'les épreuves, Soumettre pour partager, Favoris pour vos '
          'sauvegardes et Compte pour vos paramètres.',
      align: ContentAlign.top,
      radius: 32,
      paddingFocus: 4,
    ),
    _OnboardingStep(
      id: 'wallet',
      key: OnboardingKeys.wallet,
      title: 'Portefeuille',
      description:
          'Consultez votre solde, vos gains et votre progression vers '
          'la prochaine récompense de contributeur.',
      align: ContentAlign.bottom,
    ),
    _OnboardingStep(
      id: 'shortcuts',
      key: OnboardingKeys.quickActions,
      title: 'Raccourcis',
      description:
          'Accédez rapidement à votre bibliothèque d\'achats et à vos '
          'PDF disponibles hors ligne.',
      align: ContentAlign.bottom,
    ),
    _OnboardingStep(
      id: 'recent',
      key: OnboardingKeys.recentEpreuves,
      title: 'Dernières épreuves',
      description:
          'Parcourez les épreuves récentes en glissant horizontalement. '
          'Touchez une carte pour ouvrir le détail.',
      align: ContentAlign.top,
    ),
    _OnboardingStep(
      id: 'submit',
      key: OnboardingKeys.navSubmit,
      title: 'Soumettre une épreuve',
      description:
          'Partagez une épreuve ou un corrigé avec la communauté et '
          'contribuez à enrichir les archives.',
      align: ContentAlign.top,
      shape: ShapeLightFocus.Circle,
      paddingFocus: 6,
    ),
  ];

  return all.where((step) => step.key.currentContext != null).toList();
}

class _OnboardingStepCard extends StatelessWidget {
  const _OnboardingStepCard({
    required this.title,
    required this.description,
    required this.stepIndex,
    required this.totalSteps,
    required this.onSkip,
    required this.onNext,
  });

  final String title;
  final String description;
  final int stepIndex;
  final int totalSteps;
  final VoidCallback onSkip;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final isLast = stepIndex >= totalSteps - 1;

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 340),
      child: EzoaGlassCard(
        margin: EdgeInsets.zero,
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 14),
        borderRadius: 18,
        enableShine: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${stepIndex + 1} / $totalSteps',
              style: EzoaTypography.mono(context).copyWith(
                fontSize: 10,
                color: pal.emerald,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 6),
            Text(title, style: EzoaTypography.titleMedium(context)),
            const SizedBox(height: 8),
            Text(
              description,
              style: EzoaTypography.bodySmall(context).copyWith(
                color: pal.textMuted,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                TextButton(
                  onPressed: onSkip,
                  child: Text(
                    'Passer',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      color: pal.textDim,
                    ),
                  ),
                ),
                const Spacer(),
                FilledButton(
                  onPressed: onNext,
                  style: FilledButton.styleFrom(
                    backgroundColor: EzoaColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 10,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    isLast ? 'Terminer' : 'Suivant',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
