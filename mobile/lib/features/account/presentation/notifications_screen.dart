import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';

final notificationsProvider = FutureProvider((ref) {
  return ref.watch(apiClientProvider).getNotificationConfig();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(notificationsProvider);
    final dateFmt = DateFormat('dd/MM/yyyy', 'fr_FR');

    return EzoaDetailScreen(
      title: 'Notifications',
      loading: notifAsync.isLoading,
      body: notifAsync.when(
        loading: () => const SizedBox.shrink(),
        error: (e, _) => EmptyState(title: 'Erreur', message: '$e', icon: LucideIcons.alertCircle),
        data: (config) {
          final pal = EzoaColors.of(context);
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(notificationsProvider),
            color: pal.accent,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                EzoaScrollReveal(
                  child: EzoaGlassCard(
                    margin: EdgeInsets.zero,
                    enableShine: false,
                    child: Column(
                      children: [
                        _PrefRow(
                          label: 'Soumissions',
                          value: config.preferences.soumissions,
                          onChanged: (v) => _toggle(ref, 'soumissions', v),
                        ),
                        Divider(color: pal.border, height: 1),
                        _PrefRow(
                          label: 'Paiements',
                          value: config.preferences.paiements,
                          onChanged: (v) => _toggle(ref, 'paiements', v),
                        ),
                        Divider(color: pal.border, height: 1),
                        _PrefRow(
                          label: 'Retraits',
                          value: config.preferences.retraits,
                          onChanged: (v) => _toggle(ref, 'retraits', v),
                        ),
                        Divider(color: pal.border, height: 1),
                        _PrefRow(
                          label: 'Marketing',
                          value: config.preferences.marketing,
                          onChanged: (v) => _toggle(ref, 'marketing', v),
                        ),
                        if (config.pushSupported) ...[
                          Divider(color: pal.border, height: 1),
                          _PrefRow(
                            label: 'Notifications push',
                            value: config.preferences.pushEnabled,
                            onChanged: (v) => _toggle(ref, 'pushEnabled', v),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Boîte de réception${config.unreadCount > 0 ? ' (${config.unreadCount})' : ''}',
                  style: EzoaTypography.titleSmall(context),
                ),
                const SizedBox(height: 8),
                if (config.inbox.isEmpty)
                  const EmptyState(title: 'Aucune notification', icon: LucideIcons.bellOff)
                else
                  ...config.inbox.asMap().entries.map(
                        (entry) => EzoaStaggerReveal(
                          index: entry.key,
                          child: EzoaGlassCard(
                            onTap: () async {
                              await ref.read(apiClientProvider).markNotificationsRead([entry.value.id]);
                              ref.invalidate(notificationsProvider);
                            },
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    if (!entry.value.lu)
                                      Container(
                                        width: 8,
                                        height: 8,
                                        margin: const EdgeInsets.only(right: 8),
                                        decoration: BoxDecoration(
                                          color: pal.accent,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                    Expanded(
                                      child: Text(
                                        entry.value.titre,
                                        style: EzoaTypography.titleSmall(context),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  entry.value.corps,
                                  maxLines: 3,
                                  overflow: TextOverflow.ellipsis,
                                  style: EzoaTypography.body(context).copyWith(fontSize: 13),
                                ),
                                if (DateTime.tryParse(entry.value.createdAt)
                                    case final DateTime created) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    dateFmt.format(created).toUpperCase(),
                                    style: EzoaTypography.badge(context).copyWith(fontSize: 9),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                const SizedBox(height: 20),
                Text(
                  config.pushSupported
                      ? 'Les notifications arrivent dans cette boîte de réception. '
                          'Le push natif (FCM/APNs) sera activé quand le backend le supportera.'
                      : 'Notifications push non configurées côté serveur — '
                          'la boîte de réception reste disponible.',
                  style: EzoaTypography.bodySmall(context),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _toggle(WidgetRef ref, String key, bool value) async {
    await ref.read(apiClientProvider).updateNotificationPreferences({key: value});
    ref.invalidate(notificationsProvider);
  }
}

class _PrefRow extends StatelessWidget {
  const _PrefRow({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      title: Text(label, style: EzoaTypography.titleSmall(context).copyWith(fontSize: 14)),
      value: value,
      onChanged: onChanged,
      contentPadding: EdgeInsets.zero,
    );
  }
}
