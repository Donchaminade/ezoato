import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Connectivité réseau (true = au moins un lien non-`none`).
/// Émet d'abord un check ponctuel pour éviter le défaut « en ligne »
/// pendant le chargement du stream (important au cold start hors ligne).
final connectivityProvider = StreamProvider<bool>((ref) async* {
  final connectivity = Connectivity();
  final initial = await connectivity.checkConnectivity();
  yield initial.any((r) => r != ConnectivityResult.none);

  await for (final results in connectivity.onConnectivityChanged) {
    yield results.any((r) => r != ConnectivityResult.none);
  }
});

final isOnlineProvider = Provider<bool>((ref) {
  return ref.watch(connectivityProvider).maybeWhen(
        data: (v) => v,
        // Pendant le premier check : pessimiste (évite d'appeler l'API
        // avant de connaître l'état réel du réseau).
        orElse: () => false,
      );
});
