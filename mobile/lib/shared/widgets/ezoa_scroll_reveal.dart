import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:visibility_detector/visibility_detector.dart';

/// Scroll-in reveal: opacity 0→1, y 50→0 (35 pour petits composants),
/// 700ms easeOut, rejoue à chaque entrée dans le viewport (deux sens).
class EzoaScrollReveal extends StatefulWidget {
  const EzoaScrollReveal({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.visibilityFraction = 0.1,
    this.offset = 50,
  });

  final Widget child;
  final Duration delay;
  final double visibilityFraction;

  /// Décalage vertical initial en pixels (50 par défaut, 35 conseillé
  /// pour les petits composants).
  final double offset;

  @override
  State<EzoaScrollReveal> createState() => _EzoaScrollRevealState();
}

class _EzoaScrollRevealState extends State<EzoaScrollReveal> {
  // Clé STABLE sur toute la vie du State. Si elle dérivait du widget
  // (recréé à chaque rebuild du parent), le VisibilityDetector serait
  // démonté/remonté en boucle : il signalerait « caché » puis « visible »
  // sans fin et rejouerait le fade-in depuis opacity 0 → écran qui clignote.
  final Key _detectorKey = UniqueKey();

  bool _visible = false;
  int _playCount = 0;

  void _onVisibility(VisibilityInfo info) {
    if (!mounted) return;
    final fraction = info.visibleFraction;
    if (!_visible && fraction >= widget.visibilityFraction) {
      setState(() {
        _visible = true;
        _playCount++;
      });
    } else if (_visible && fraction <= 0) {
      // Hystérésis : on ne réarme l'animation que lorsque l'élément est
      // totalement sorti du viewport. Un élément qui flotte autour du seuil
      // d'apparition ne rejoue donc jamais l'animation en boucle.
      setState(() => _visible = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return VisibilityDetector(
      key: _detectorKey,
      onVisibilityChanged: _onVisibility,
      child: _visible
          ? widget.child
              .animate(key: ValueKey(_playCount))
              .fadeIn(
                duration: 700.ms,
                curve: Curves.easeOut,
                delay: widget.delay,
              )
              .move(
                begin: Offset(0, widget.offset),
                end: Offset.zero,
                duration: 700.ms,
                curve: Curves.easeOut,
                delay: widget.delay,
              )
          : Opacity(
              opacity: 0,
              child: Transform.translate(
                offset: Offset(0, widget.offset),
                child: widget.child,
              ),
            ),
    );
  }
}

/// Staggered reveal for list items (offset 35 — petits composants).
class EzoaStaggerReveal extends StatelessWidget {
  const EzoaStaggerReveal({
    super.key,
    required this.index,
    required this.child,
    this.baseDelay = 50,
  });

  final int index;
  final Widget child;
  final int baseDelay;

  @override
  Widget build(BuildContext context) {
    return EzoaScrollReveal(
      delay: Duration(milliseconds: index * baseDelay),
      offset: 35,
      child: child,
    );
  }
}
