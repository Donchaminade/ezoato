import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/ezoa_theme.dart';
import 'epreuve_meta_labels.dart';

/// Badges opaques sur aperçu produit — lisibles même sur PDF blanc.
class EpreuveSolidBadge extends StatelessWidget {
  const EpreuveSolidBadge({
    super.key,
    required this.label,
    this.background = const Color(0xFF004D38),
    this.foreground = Colors.white,
    this.borderColor,
    this.maxWidth,
  });

  /// Matière : émeraude foncé + texte blanc.
  const EpreuveSolidBadge.matiere(String label, {Key? key, double? maxWidth})
      : this(
          key: key,
          label: label,
          background: const Color(0xFF004D38),
          foreground: Colors.white,
          maxWidth: maxWidth,
        );

  /// Gratuit : émeraude solide + texte blanc.
  const EpreuveSolidBadge.gratuit({Key? key})
      : this(
          key: key,
          label: 'GRATUIT',
          background: const Color(0xFF006A4E),
          foreground: Colors.white,
        );

  /// Payant : charcoal + accent or.
  const EpreuveSolidBadge.payant(String priceLabel, {Key? key})
      : this(
          key: key,
          label: priceLabel,
          background: const Color(0xFF1A2220),
          foreground: EzoaColors.gold,
          borderColor: const Color(0x66FFCE00),
        );

  final String label;
  final Color background;
  final Color foreground;
  final Color? borderColor;
  final double? maxWidth;

  @override
  Widget build(BuildContext context) {
    final child = Container(
      constraints: maxWidth != null ? BoxConstraints(maxWidth: maxWidth!) : null,
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(7),
        border: Border.all(
          color: borderColor ?? Colors.white.withValues(alpha: 0.12),
        ),
      ),
      child: Text(
        label.toUpperCase(),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: GoogleFonts.jetBrainsMono(
          fontSize: 7.5,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.45,
          color: foreground,
        ),
      ),
    );
    return child;
  }
}

/// Bandeau bas produit : type · période/examen (fond quasi opaque).
class EpreuveMetaOverlayBar extends StatelessWidget {
  const EpreuveMetaOverlayBar({
    super.key,
    required this.type,
    this.periode,
    this.examen,
    this.trailing,
  });

  final String type;
  final String? periode;
  final String? examen;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final line = epreuveOverlayMetaLine(
      type: type,
      periode: periode,
      examen: examen,
    );

    return DecoratedBox(
      decoration: BoxDecoration(
        // Quasi opaque pour rester lisible sur aperçus blancs.
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            const Color(0xE0121816),
            const Color(0xF5121816),
          ],
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 7, 8, 7),
        child: Row(
          children: [
            Expanded(
              child: Text(
                line,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.15,
                  color: Colors.white.withValues(alpha: 0.96),
                ),
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 6),
              trailing!,
            ],
          ],
        ),
      ),
    );
  }
}

/// Couche complète sur la zone aperçu : badges matière/prix + bandeau meta.
class EpreuvePreviewChrome extends StatelessWidget {
  const EpreuvePreviewChrome({
    super.key,
    required this.matiere,
    required this.type,
    this.periode,
    this.examen,
    this.priceLabel,
    this.isPaid = false,
    this.topTrailing,
    this.bottomLeading,
  });

  final String matiere;
  final String type;
  final String? periode;
  final String? examen;
  final String? priceLabel;
  final bool isPaid;
  final Widget? topTrailing;
  final Widget? bottomLeading;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Positioned(
          top: 7,
          left: 7,
          right: priceLabel != null || topTrailing != null ? 72 : 7,
          child: Align(
            alignment: Alignment.topLeft,
            child: EpreuveSolidBadge.matiere(matiere, maxWidth: 110),
          ),
        ),
        if (priceLabel != null)
          Positioned(
            top: 7,
            right: 7,
            child: isPaid
                ? EpreuveSolidBadge.payant(priceLabel!)
                : const EpreuveSolidBadge.gratuit(),
          )
        else if (topTrailing != null)
          Positioned(top: 7, right: 7, child: topTrailing!),
        if (topTrailing != null && priceLabel != null)
          Positioned(
            top: 30,
            right: 7,
            child: topTrailing!,
          ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: EpreuveMetaOverlayBar(
            type: type,
            periode: periode,
            examen: examen,
            trailing: bottomLeading,
          ),
        ),
      ],
    );
  }
}
