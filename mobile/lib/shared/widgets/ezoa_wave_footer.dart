import 'package:flutter/material.dart';

import '../../core/theme/ezoa_theme.dart';

/// Decorative wave shapes at page footer.
class EzoaWaveFooter extends StatelessWidget {
  const EzoaWaveFooter({super.key, this.height = 120});

  final double height;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: SizedBox(
        height: height,
        width: double.infinity,
        child: CustomPaint(
          painter: _WavePainter(EzoaColors.of(context)),
          size: Size.infinite,
        ),
      ),
    );
  }
}

class _WavePainter extends CustomPainter {
  _WavePainter(this.pal);

  final EzoaPalette pal;

  @override
  void paint(Canvas canvas, Size size) {
    final path1 = Path()
      ..moveTo(0, size.height * 0.55)
      ..quadraticBezierTo(
        size.width * 0.25,
        size.height * 0.35,
        size.width * 0.5,
        size.height * 0.55,
      )
      ..quadraticBezierTo(
        size.width * 0.75,
        size.height * 0.75,
        size.width,
        size.height * 0.5,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(
      path1,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            EzoaColors.accentBlue.withValues(alpha: 0.12),
            EzoaColors.primary.withValues(alpha: 0.06),
          ],
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height)),
    );

    final path2 = Path()
      ..moveTo(0, size.height * 0.7)
      ..cubicTo(
        size.width * 0.3,
        size.height * 0.5,
        size.width * 0.6,
        size.height * 0.85,
        size.width,
        size.height * 0.65,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(
      path2,
      Paint()..color = pal.curveLine.withValues(alpha: 0.02),
    );

    // Crête indigo fine sur la première vague, pour un relief satiné.
    final crest = Path()
      ..moveTo(0, size.height * 0.55)
      ..quadraticBezierTo(
        size.width * 0.25,
        size.height * 0.35,
        size.width * 0.5,
        size.height * 0.55,
      )
      ..quadraticBezierTo(
        size.width * 0.75,
        size.height * 0.75,
        size.width,
        size.height * 0.5,
      );
    canvas.drawPath(
      crest,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2
        ..color = pal.accent.withValues(alpha: 0.18),
    );

    // Troisième vague profonde, ancrée au bas de page.
    final path3 = Path()
      ..moveTo(0, size.height * 0.85)
      ..cubicTo(
        size.width * 0.25,
        size.height * 0.95,
        size.width * 0.7,
        size.height * 0.7,
        size.width,
        size.height * 0.88,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(
      path3,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            EzoaColors.primary.withValues(alpha: 0.10),
            EzoaColors.accentBlue.withValues(alpha: 0.05),
          ],
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height)),
    );
  }

  @override
  bool shouldRepaint(covariant _WavePainter oldDelegate) =>
      oldDelegate.pal.brightness != pal.brightness;
}
