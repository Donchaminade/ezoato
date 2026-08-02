import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/security/secure_screen.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/epreuve_thumbnail.dart';
import '../../../shared/widgets/ezoa_widgets.dart';

export '../../../shared/widgets/epreuve_thumbnail.dart' show epreuvePreviewPageUrl;

/// Ouvre la visionneuse d'aperçu plein écran (pages feuilletables + zoom).
void showEpreuvePreview(
  BuildContext context,
  Epreuve epreuve, {
  required bool locked,
  VoidCallback? onUnlock,
}) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => EpreuvePreviewViewer(
        epreuve: epreuve,
        locked: locked,
        onUnlock: onUnlock,
      ),
    ),
  );
}

/// Carte « Aperçu » : miniature ou paywall si épreuve payante non débloquée.
class EpreuvePreviewCard extends ConsumerWidget {
  const EpreuvePreviewCard({
    super.key,
    required this.epreuve,
    this.locked = false,
    this.montant,
    this.onUnlock,
  });

  final Epreuve epreuve;
  final bool locked;
  final int? montant;
  final VoidCallback? onUnlock;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (locked) {
      return EpreuvePreviewPaywall(
        pages: epreuve.pages,
        montant: montant ?? epreuve.prixFcfa ?? 0,
        onUnlock: onUnlock,
      );
    }

    final pal = EzoaColors.of(context);
    final pages = epreuve.pages < 1 ? 1 : epreuve.pages;

    return EzoaGlassCard(
      margin: EdgeInsets.zero,
      padding: EdgeInsets.zero,
      onTap: () => showEpreuvePreview(context, epreuve, locked: false),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: SizedBox(
              height: 190,
              child: ColoredBox(
                color: pal.subtleFill,
                child: EpreuveThumbnail(
                  epreuve: epreuve,
                  showLockWhenPaid: false,
                  placeholderIconSize: 36,
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(LucideIcons.eye, size: 16, color: pal.accent),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    pages == 1 ? 'Aperçu — 1 page' : 'Aperçu — $pages pages',
                    style: EzoaTypography.titleSmall(context).copyWith(fontSize: 13),
                  ),
                ),
                Icon(LucideIcons.chevronRight, size: 16, color: pal.textDim),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Paywall affiché à la place de l'aperçu pour une épreuve payante non débloquée.
class EpreuvePreviewPaywall extends StatelessWidget {
  const EpreuvePreviewPaywall({
    super.key,
    required this.pages,
    required this.montant,
    this.onUnlock,
  });

  final int pages;
  final int montant;
  final VoidCallback? onUnlock;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return EzoaGlassCard(
      margin: EdgeInsets.zero,
      enableShine: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 140,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: pal.subtleFill,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: pal.border),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.lock, size: 36, color: pal.gold),
                const SizedBox(height: 10),
                Text(
                  'Aperçu verrouillé',
                  style: EzoaTypography.titleSmall(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text(
            pages > 1
                ? 'Cette épreuve compte $pages pages. Payez $montant FCFA pour débloquer l\'aperçu, les captures d\'écran et le téléchargement.'
                : 'Payez $montant FCFA pour débloquer l\'aperçu et le téléchargement.',
            style: EzoaTypography.bodySmall(context),
          ),
          if (onUnlock != null) ...[
            const SizedBox(height: 16),
            EzoaButton(
              label: 'Débloquer — $montant FCFA',
              icon: LucideIcons.creditCard,
              onPressed: onUnlock,
            ),
          ],
        ],
      ),
    );
  }
}

/// Visionneuse plein écran : une page par écran (balayage horizontal),
/// zoom pincement via [InteractiveViewer], indicateur « Page X / N ».
class EpreuvePreviewViewer extends StatefulWidget {
  const EpreuvePreviewViewer({
    super.key,
    required this.epreuve,
    this.locked = false,
    this.onUnlock,
  });

  final Epreuve epreuve;
  final bool locked;
  final VoidCallback? onUnlock;

  @override
  State<EpreuvePreviewViewer> createState() => _EpreuvePreviewViewerState();
}

class _EpreuvePreviewViewerState extends State<EpreuvePreviewViewer> {
  int _page = 1;

  @override
  Widget build(BuildContext context) {
    if (widget.locked) {
      return SecureScreenScope(
        child: Scaffold(
          backgroundColor: EzoaColors.of(context).background,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: Icon(LucideIcons.x, size: 20, color: EzoaColors.of(context).text),
              onPressed: () => Navigator.of(context).pop(),
            ),
            title: Text('Aperçu', style: EzoaTypography.titleMedium(context)),
          ),
          body: Padding(
            padding: const EdgeInsets.all(20),
            child: EpreuvePreviewPaywall(
              pages: widget.epreuve.pages,
              montant: widget.epreuve.prixFcfa ?? 0,
              onUnlock: widget.onUnlock,
            ),
          ),
        ),
      );
    }

    final pal = EzoaColors.of(context);
    final pageCount = widget.epreuve.pages < 1 ? 1 : widget.epreuve.pages;

    return SecureScreenScope(
      child: Scaffold(
        backgroundColor: pal.background,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            tooltip: 'Fermer',
            icon: Icon(LucideIcons.x, size: 20, color: pal.text),
            onPressed: () => Navigator.of(context).pop(),
          ),
          title: Text(
            'Aperçu',
            style: EzoaTypography.titleMedium(context).copyWith(fontSize: 16),
          ),
          centerTitle: true,
        ),
        body: Column(
          children: [
            Expanded(
              child: PageView.builder(
                itemCount: pageCount,
                onPageChanged: (i) => setState(() => _page = i + 1),
                itemBuilder: (context, index) => _PreviewPage(
                  url: epreuvePreviewPageUrl(widget.epreuve.id, index + 1),
                ),
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                  decoration: BoxDecoration(
                    color: pal.subtleFill,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: pal.border),
                  ),
                  child: Text(
                    pageCount > 1
                        ? 'Page $_page / $pageCount · balayez pour tourner'
                        : 'Page 1 / 1',
                    style: EzoaTypography.mono(context).copyWith(fontSize: 11),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PreviewPage extends ConsumerStatefulWidget {
  const _PreviewPage({required this.url});

  final String url;

  @override
  ConsumerState<_PreviewPage> createState() => _PreviewPageState();
}

class _PreviewPageState extends ConsumerState<_PreviewPage> {
  Map<String, String> _headers = const {};
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadHeaders());
  }

  Future<void> _loadHeaders() async {
    final token = await ref.read(secureStorageProvider).getToken();
    if (!mounted) return;
    setState(() {
      _headers = (token != null && token.isNotEmpty)
          ? {'Authorization': 'Bearer $token'}
          : const {};
      _ready = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    if (!_ready) {
      return const Center(
        child: SizedBox(
          width: 32,
          height: 32,
          child: CircularProgressIndicator(strokeWidth: 2.5),
        ),
      );
    }

    return InteractiveViewer(
      maxScale: 5,
      child: Center(
        child: CachedNetworkImage(
          imageUrl: widget.url,
          httpHeaders: _headers,
          fit: BoxFit.contain,
          progressIndicatorBuilder: (context, _, progress) => SizedBox(
            width: 32,
            height: 32,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              value: progress.progress,
            ),
          ),
          errorWidget: (context, _, _) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.imageOff, size: 36, color: pal.textDim),
              const SizedBox(height: 10),
              Text(
                'Impossible de charger cette page',
                style: EzoaTypography.bodySmall(context),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
