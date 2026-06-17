import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../shared/models/models.dart';

/// Épreuves favorites complètes (`GET /account/favoris/list`).
/// L'API ne pagine pas : rendu paresseux via [EpreuvesGrid] (GridView.builder).
final favorisProvider = FutureProvider<List<Epreuve>>((ref) {
  return ref.watch(apiClientProvider).getFavorisEpreuves();
});

/// IDs des épreuves favorites (`GET /account/favoris`).
final favorisIdsProvider = FutureProvider<Set<String>>((ref) async {
  final ids = await ref.watch(apiClientProvider).getFavorisIds();
  return ids.toSet();
});

/// Ajoute ou retire un favori puis rafraîchit les providers favoris.
Future<bool> toggleFavori(WidgetRef ref, String epreuveId, bool isFavorite) async {
  final api = ref.read(apiClientProvider);
  if (isFavorite) {
    await api.removeFavori(epreuveId);
  } else {
    await api.addFavori(epreuveId);
  }
  ref.invalidate(favorisIdsProvider);
  ref.invalidate(favorisProvider);
  return !isFavorite;
}
