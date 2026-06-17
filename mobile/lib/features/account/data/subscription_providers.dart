import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../shared/models/models.dart';

final subscriptionStatusProvider = FutureProvider<SubscriptionStatus>((ref) async {
  return ref.watch(apiClientProvider).getSubscriptionStatus();
});
