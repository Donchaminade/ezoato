import 'package:flutter/material.dart';

/// Clés globales des cibles du guide de première ouverture.
class OnboardingKeys {
  OnboardingKeys._();

  static final homeHeader = GlobalKey(debugLabel: 'onboarding_home_header');
  static final navBar = GlobalKey(debugLabel: 'onboarding_nav_bar');
  static final navSubmit = GlobalKey(debugLabel: 'onboarding_nav_submit');
  static final wallet = GlobalKey(debugLabel: 'onboarding_wallet');
  static final quickActions = GlobalKey(debugLabel: 'onboarding_quick_actions');
  static final recentEpreuves =
      GlobalKey(debugLabel: 'onboarding_recent_epreuves');
}
