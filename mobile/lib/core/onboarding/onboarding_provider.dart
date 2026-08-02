import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/secure_storage.dart';
import 'onboarding_coach.dart';

/// État de persistance du guide de première ouverture.
final onboardingProvider =
    NotifierProvider<OnboardingNotifier, OnboardingState>(
  OnboardingNotifier.new,
);

class OnboardingState {
  const OnboardingState({
    required this.loaded,
    required this.completed,
  });

  final bool loaded;
  final bool completed;

  bool get shouldAutoShow => loaded && !completed;
}

class OnboardingNotifier extends Notifier<OnboardingState> {
  bool _isShowing = false;

  @override
  OnboardingState build() {
    _restore();
    return const OnboardingState(loaded: false, completed: false);
  }

  Future<void> _restore() async {
    final completed =
        await ref.read(secureStorageProvider).isOnboardingCompleted();
    state = OnboardingState(loaded: true, completed: completed);
  }

  Future<void> markCompleted() async {
    await ref.read(secureStorageProvider).setOnboardingCompleted(true);
    state = const OnboardingState(loaded: true, completed: true);
  }

  /// Remet le flag pour réafficher le carousel (Compte > Revoir la visite).
  Future<void> reset() async {
    await ref.read(secureStorageProvider).setOnboardingCompleted(false);
    state = const OnboardingState(loaded: true, completed: false);
  }

  /// Alias conservé pour les appels existants / tests.
  Future<void> resetForTesting() => reset();

  /// Coach marks optionnels (non lancés automatiquement).
  Future<void> startTour(BuildContext context) async {
    if (_isShowing || !context.mounted) return;
    _isShowing = true;
    try {
      await showOnboardingCoachMark(
        context: context,
        onComplete: markCompleted,
      );
    } finally {
      _isShowing = false;
    }
  }
}
