import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/config/env.dart';
import '../../core/storage/secure_storage.dart';
import '../../core/theme/ezoa_theme.dart';
import '../models/models.dart';

/// URL d'aperçu page N — toujours via [Env.apiUrl] (hôte LAN joignable).
String epreuvePreviewPageUrl(String epreuveId, int page) {
  return '${Env.apiUrl}/epreuves/$epreuveId/preview?page=$page';
}

/// URL miniature pour une carte : [thumbnailUrl] réécrit, sinon endpoint preview.
String? epreuveCardPreviewUrl(Epreuve epreuve) {
  final fromApi = Env.resolveMediaUrl(epreuve.thumbnailUrl);
  if (fromApi != null && fromApi.isNotEmpty) return fromApi;
  return epreuvePreviewPageUrl(epreuve.id, 1);
}

/// Miniature réseau avec Bearer (épreuves payantes) et placeholder gracieux.
class EpreuveThumbnail extends ConsumerStatefulWidget {
  const EpreuveThumbnail({
    super.key,
    required this.epreuve,
    this.fit = BoxFit.cover,
    this.alignment = Alignment.topCenter,
    this.placeholderIconSize = 28,
    this.showLockWhenPaid = true,
  });

  final Epreuve epreuve;
  final BoxFit fit;
  final Alignment alignment;
  final double placeholderIconSize;

  /// Si true, les épreuves payantes affichent un cadenas sans requête réseau
  /// (évite 401/402 en liste). Les écrans détail débloqués passent false.
  final bool showLockWhenPaid;

  @override
  ConsumerState<EpreuveThumbnail> createState() => _EpreuveThumbnailState();
}

class _EpreuveThumbnailState extends ConsumerState<EpreuveThumbnail> {
  Map<String, String>? _headers;
  bool _headersReady = false;

  bool get _isPaidLocked =>
      widget.showLockWhenPaid && widget.epreuve.requiresPayment == true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadHeaders());
  }

  Future<void> _loadHeaders() async {
    if (_isPaidLocked) {
      if (mounted) setState(() => _headersReady = true);
      return;
    }
    final token = await ref.read(secureStorageProvider).getToken();
    if (!mounted) return;
    setState(() {
      _headers = (token != null && token.isNotEmpty)
          ? {'Authorization': 'Bearer $token'}
          : const {};
      _headersReady = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    if (_isPaidLocked) {
      return _Placeholder(
        icon: LucideIcons.lock,
        iconSize: widget.placeholderIconSize,
        color: pal.gold,
      );
    }

    if (!_headersReady) {
      return Center(
        child: SizedBox(
          width: 22,
          height: 22,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: pal.accent,
          ),
        ),
      );
    }

    final url = epreuveCardPreviewUrl(widget.epreuve);
    if (url == null || url.isEmpty) {
      return _Placeholder(
        icon: LucideIcons.fileText,
        iconSize: widget.placeholderIconSize,
        color: Colors.white.withValues(alpha: 0.85),
      );
    }

    return CachedNetworkImage(
      imageUrl: url,
      httpHeaders: _headers,
      fit: widget.fit,
      alignment: widget.alignment,
      fadeInDuration: const Duration(milliseconds: 180),
      placeholder: (_, __) => Center(
        child: SizedBox(
          width: 22,
          height: 22,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: pal.accent,
          ),
        ),
      ),
      errorWidget: (_, __, ___) => _Placeholder(
        icon: LucideIcons.fileText,
        iconSize: widget.placeholderIconSize,
        color: Colors.white.withValues(alpha: 0.85),
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  const _Placeholder({
    required this.icon,
    required this.iconSize,
    required this.color,
  });

  final IconData icon;
  final double iconSize;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Center(child: Icon(icon, size: iconSize, color: color));
  }
}
