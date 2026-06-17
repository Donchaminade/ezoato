import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_widgets.dart';

final notificationsProvider = FutureProvider((ref) {
  return ref.watch(apiClientProvider).getNotificationConfig();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(notificationsProvider);

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
                Text(
                  'Boîte de réception${config.unreadCount > 0 ? ' (${config.unreadCount})' : ''}',
                  style: EzoaTypography.titleSmall(context),
                ),
                const SizedBox(height: 8),
                if (config.inbox.isEmpty)
                  const EmptyState(title: 'Aucune notification', icon: LucideIcons.bellOff)
                else ...[
                  ...config.inbox.asMap().entries.map(
                        (entry) => EzoaStaggerReveal(
                          index: entry.key,
                          child: _NotificationTile(
                            notification: entry.value,
                            onTap: () => _openDetail(context, ref, entry.value),
                            onDelete: () => _deleteNotification(context, ref, entry.value.id),
                          ),
                        ),
                      ),
                  const SizedBox(height: 12),
                  Text(
                    'Appuyez pour lire · Glissez pour supprimer',
                    style: EzoaTypography.bodySmall(context),
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.onTap,
    required this.onDelete,
  });

  final InboxNotification notification;
  final VoidCallback onTap;
  final Future<void> Function() onDelete;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final dateFmt = DateFormat('dd/MM/yyyy', 'fr_FR');
    final created = DateTime.tryParse(notification.createdAt);

    return Dismissible(
      key: ValueKey(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        margin: const EdgeInsets.symmetric(vertical: 4),
        decoration: BoxDecoration(
          color: pal.error.withValues(alpha: 0.85),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(LucideIcons.trash2, color: Colors.white),
      ),
      onDismissed: (_) => onDelete(),
      child: EzoaGlassCard(
        onTap: onTap,
        onLongPress: () => _confirmDelete(context, onDelete),
        margin: const EdgeInsets.symmetric(vertical: 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (!notification.lu)
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
                    notification.titre,
                    style: EzoaTypography.titleSmall(context),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              notification.corps,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: EzoaTypography.body(context).copyWith(fontSize: 13),
            ),
            if (created != null) ...[
              const SizedBox(height: 6),
              Text(
                dateFmt.format(created).toUpperCase(),
                style: EzoaTypography.badge(context).copyWith(fontSize: 9),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _NotificationDetailSheet extends ConsumerStatefulWidget {
  const _NotificationDetailSheet({required this.notification});

  final InboxNotification notification;

  @override
  ConsumerState<_NotificationDetailSheet> createState() => _NotificationDetailSheetState();
}

class _NotificationDetailSheetState extends ConsumerState<_NotificationDetailSheet> {
  bool _deleting = false;

  Future<void> _delete() async {
    setState(() => _deleting = true);
    final ok = await _deleteNotification(context, ref, widget.notification.id, popOnSuccess: true);
    if (!ok && mounted) setState(() => _deleting = false);
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final dateFmt = DateFormat('dd/MM/yyyy à HH:mm', 'fr_FR');
    final created = DateTime.tryParse(widget.notification.createdAt);

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: EzoaGlassCard(
            margin: EdgeInsets.zero,
            enableShine: false,
            blurSigma: 30,
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.notification.titre,
                        style: EzoaTypography.titleMedium(context),
                      ),
                    ),
                    if (!widget.notification.lu)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: pal.accent.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'NON LU',
                          style: EzoaTypography.badge(context).copyWith(
                            color: pal.accent,
                            fontSize: 9,
                          ),
                        ),
                      ),
                  ],
                ),
                if (created != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    dateFmt.format(created),
                    style: EzoaTypography.bodySmall(context),
                  ),
                ],
                const SizedBox(height: 16),
                Text(
                  widget.notification.corps,
                  style: EzoaTypography.body(context),
                ),
                const SizedBox(height: 24),
                EzoaButton(
                  label: 'Supprimer',
                  icon: LucideIcons.trash2,
                  variant: EzoaButtonVariant.outline,
                  loading: _deleting,
                  onPressed: _deleting ? null : _delete,
                ),
                const SizedBox(height: 8),
                EzoaButton(
                  label: 'Fermer',
                  variant: EzoaButtonVariant.ghost,
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

Future<void> _openDetail(
  BuildContext context,
  WidgetRef ref,
  InboxNotification notification,
) async {
  if (!notification.lu) {
    await ref.read(apiClientProvider).markNotificationsRead([notification.id]);
    ref.invalidate(notificationsProvider);
  }
  if (!context.mounted) return;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _NotificationDetailSheet(notification: notification),
  );
}

Future<bool> _deleteNotification(
  BuildContext context,
  WidgetRef ref,
  String id, {
  bool popOnSuccess = false,
}) async {
  try {
    await ref.read(apiClientProvider).deleteNotification(id);
    ref.invalidate(notificationsProvider);
    if (popOnSuccess && context.mounted) Navigator.of(context).pop();
    return true;
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Impossible de supprimer : $e')),
      );
    }
    return false;
  }
}

Future<void> _confirmDelete(
  BuildContext context,
  Future<void> Function() onDelete,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (ctx) {
      final pal = EzoaColors.of(ctx);
      return AlertDialog(
        backgroundColor: pal.dialogBg,
        title: Text('Supprimer ?', style: EzoaTypography.titleSmall(ctx)),
        content: Text(
          'Cette notification sera définitivement supprimée.',
          style: EzoaTypography.body(ctx),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text('Supprimer', style: TextStyle(color: pal.error)),
          ),
        ],
      );
    },
  );
  if (confirmed == true) await onDelete();
}
