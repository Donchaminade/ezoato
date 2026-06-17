import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../shared/models/models.dart';

/// Portefeuille contributeur (`GET /wallet/portefeuille`) — partagé entre la
/// carte solde de l'accueil et l'écran Portefeuille du compte.
final walletProvider = FutureProvider<ContributorWallet>((ref) {
  return ref.watch(apiClientProvider).getWallet();
});
