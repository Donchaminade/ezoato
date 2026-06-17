import 'package:flutter/material.dart';

import '../../core/theme/ezoa_theme.dart';
import 'ezoa_wave_footer.dart';

/// Full-screen premium gradient with subtle grid overlay (adapts to theme).
class EzoaGradientBackground extends StatelessWidget {
  const EzoaGradientBackground({
    super.key,
    this.child,
    this.showGrid = true,
  });

  final Widget? child;
  final bool showGrid;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Stack(
      fit: StackFit.expand,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: pal.gradientStops,
              stops: const [0.0, 0.25, 0.5, 0.75, 1.0],
            ),
          ),
        ),
        if (showGrid)
          CustomPaint(
            painter: _GridPainter(pal),
            size: Size.infinite,
          ),
        if (child != null) child!,
      ],
    );
  }
}

class _GridPainter extends CustomPainter {
  _GridPainter(this.pal);

  final EzoaPalette pal;

  @override
  void paint(Canvas canvas, Size size) {
    final fullRect = Rect.fromLTWH(0, 0, size.width, size.height);

    // Motif de grille 40px à très basse opacité (équiv. opacity-[0.02]).
    const spacing = 40.0;
    final paint = Paint()
      ..color = pal.gridLine
      ..strokeWidth = 1;

    for (var x = 0.0; x <= size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (var y = 0.0; y <= size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    // Halo indigo ambiant en haut.
    final glowTop = Paint()
      ..shader = RadialGradient(
        center: const Alignment(0.4, -0.5),
        radius: 0.9,
        colors: [
          EzoaColors.accentBlue.withValues(alpha: pal.isDark ? 0.08 : 0.07),
          Colors.transparent,
        ],
      ).createShader(fullRect);
    canvas.drawRect(fullRect, glowTop);

    // Halo émeraude EZOA discret en bas à gauche.
    final glowBottom = Paint()
      ..shader = RadialGradient(
        center: const Alignment(-0.6, 0.9),
        radius: 0.8,
        colors: [
          EzoaColors.primary.withValues(alpha: pal.isDark ? 0.07 : 0.06),
          Colors.transparent,
        ],
      ).createShader(fullRect);
    canvas.drawRect(fullRect, glowBottom);

    // Courbes fluides décoratives à très basse opacité.
    final curvePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..color = pal.curveLine;

    final curve1 = Path()
      ..moveTo(-size.width * 0.1, size.height * 0.28)
      ..cubicTo(
        size.width * 0.3,
        size.height * 0.18,
        size.width * 0.6,
        size.height * 0.38,
        size.width * 1.1,
        size.height * 0.24,
      );
    canvas.drawPath(curve1, curvePaint);

    final curve2 = Path()
      ..moveTo(-size.width * 0.1, size.height * 0.62)
      ..cubicTo(
        size.width * 0.35,
        size.height * 0.74,
        size.width * 0.65,
        size.height * 0.52,
        size.width * 1.1,
        size.height * 0.66,
      );
    canvas.drawPath(
      curve2,
      curvePaint
        ..color = pal.accent.withValues(alpha: pal.isDark ? 0.035 : 0.08),
    );
  }

  @override
  bool shouldRepaint(covariant _GridPainter oldDelegate) =>
      oldDelegate.pal.brightness != pal.brightness;
}

/// Scaffolds content on gradient background.
class EzoaScaffold extends StatelessWidget {
  const EzoaScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.bottomNavigationBar,
    this.extendBody = true,
    this.showGrid = true,
    this.showWaveFooter = false,
    this.resizeToAvoidBottomInset,
  });

  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNavigationBar;
  final bool extendBody;
  final bool showGrid;
  final bool showWaveFooter;

  /// Si `false`, le Scaffold ne se redimensionne pas quand le clavier sort :
  /// le fond et les vagues restent collés au bas de l'écran physique. Le
  /// contenu doit alors gérer lui-même `MediaQuery.viewInsets.bottom`.
  final bool? resizeToAvoidBottomInset;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EzoaColors.of(context).background,
      resizeToAvoidBottomInset: resizeToAvoidBottomInset,
      extendBody: extendBody,
      extendBodyBehindAppBar: appBar != null,
      appBar: appBar,
      bottomNavigationBar: bottomNavigationBar,
      body: Stack(
        fit: StackFit.expand,
        children: [
          EzoaGradientBackground(showGrid: showGrid),
          body,
          if (showWaveFooter)
            const Align(
              alignment: Alignment.bottomCenter,
              child: EzoaWaveFooter(height: 120),
            ),
        ],
      ),
    );
  }
}
