import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Mode démo (pitch) : session locale, données embarquées, aucun appel réseau
/// ni aucun appel aux endpoints de paiement. Activé depuis l'écran de
/// connexion (« Mode démo ») ou par `--dart-define=DEMO=true`.
const bool kDemoBuild = bool.fromEnvironment('DEMO');

final demoModeProvider = StateProvider<bool>((ref) => kDemoBuild);
