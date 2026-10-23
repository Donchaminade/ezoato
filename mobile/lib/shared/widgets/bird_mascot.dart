import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Mascotte « Zoé » (oiseau aux couleurs du drapeau) — version Flutter de
/// `BirdMascot.tsx`. Les yeux suivent la saisie, les ailes couvrent les yeux sur le
/// champ mot de passe, « peek » quand il est affiché, joie au succès, secousse à l'erreur.
enum MascotMood { idle, watch, hide, peek, happy, error }

class MascotController extends ChangeNotifier {
  MascotMood _mood = MascotMood.idle;
  double _lookX = 0;
  MascotMood get mood => _mood;
  double get lookX => _lookX;

  void set(MascotMood m) {
    if (m == _mood) return;
    _mood = m;
    notifyListeners();
  }

  /// Suit le texte tapé : la longueur déplace le regard de gauche à droite.
  void typing(String text) {
    _lookX = (-0.8 + (text.length / 24).clamp(0.0, 1.0) * 1.6);
    if (_mood != MascotMood.watch) _mood = MascotMood.watch;
    notifyListeners();
  }

  void flash(MascotMood m, {MascotMood after = MascotMood.idle}) {
    set(m);
    Future.delayed(
      Duration(milliseconds: m == MascotMood.happy ? 1600 : 900),
      () {
        if (_mood == m) set(after);
      },
    );
  }
}

class BirdMascot extends StatefulWidget {
  const BirdMascot({super.key, required this.controller, this.size = 120});
  final MascotController controller;
  final double size;
  @override
  State<BirdMascot> createState() => _BirdMascotState();
}

class _BirdMascotState extends State<BirdMascot> with TickerProviderStateMixin {
  late final AnimationController _shake = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 520),
  );
  late final AnimationController _bob = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 3200),
  );
  late final AnimationController _hop = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 800),
  );
  MascotMood _last = MascotMood.idle;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onChange);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (reduce) {
      _bob.stop();
    } else if (!_bob.isAnimating) {
      _bob.repeat(reverse: true);
    }
  }

  void _onChange() {
    final m = widget.controller.mood;
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (m != _last && !reduce) {
      if (m == MascotMood.error) _shake.forward(from: 0);
      if (m == MascotMood.happy) _hop.forward(from: 0);
    }
    _last = m;
    setState(() {});
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onChange);
    _shake.dispose();
    _bob.dispose();
    _hop.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.controller;
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final dur = reduce ? Duration.zero : const Duration(milliseconds: 380);
    final cover = switch (c.mood) {
      MascotMood.hide => 1.0,
      MascotMood.peek => 0.6,
      _ => 0.0,
    };
    final look = c.mood == MascotMood.watch
        ? Offset(c.lookX, 0.7)
        : (cover > 0 ? const Offset(0.2, 0.5) : Offset.zero);
    return Semantics(
      label: c.mood == MascotMood.hide
          ? 'La mascotte se cache les yeux'
          : 'Mascotte EZOA-TO',
      child: AnimatedBuilder(
        animation: Listenable.merge([_shake, _bob, _hop]),
        builder: (context, child) {
          final dx =
              math.sin(_shake.value * math.pi * 6) * 10 * (1 - _shake.value);
          final dy =
              -math.sin(_hop.value * math.pi * 2).abs() *
                  12 *
                  (1 - _hop.value) -
              _bob.value * 3;
          return Transform.translate(offset: Offset(dx, dy), child: child);
        },
        child: TweenAnimationBuilder<double>(
          tween: Tween(end: cover),
          duration: dur,
          curve: Curves.easeOutBack,
          builder: (context, cv, _) => TweenAnimationBuilder<Offset>(
            tween: Tween(end: look),
            duration: dur,
            curve: Curves.easeOut,
            builder: (context, lk, _) => CustomPaint(
              size: Size(widget.size * 160 / 150, widget.size),
              painter: _BirdPainter(
                cover: cv,
                look: lk,
                happy: c.mood == MascotMood.happy,
                sad: c.mood == MascotMood.error,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BirdPainter extends CustomPainter {
  _BirdPainter({
    required this.cover,
    required this.look,
    required this.happy,
    required this.sad,
  });
  final double cover;
  final Offset look;
  final bool happy;
  final bool sad;

  static const green = Color(0xFF006A4E);
  static const deep = Color(0xFF004D38);
  static const mint = Color(0xFF02A671);
  static const gold = Color(0xFFFFCE00);
  static const red = Color(0xFFD21034);
  static const ink = Color(0xFF0B121A);

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 160, size.height / 150);
    final p = Paint()..isAntiAlias = true;
    canvas.drawOval(
      Rect.fromCenter(center: const Offset(80, 142), width: 80, height: 12),
      p..color = Colors.black12,
    );
    final leg = Paint()
      ..color = gold
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(const Offset(66, 128), const Offset(66, 138), leg);
    canvas.drawLine(const Offset(94, 128), const Offset(94, 138), leg);
    canvas.drawPath(
      Path()
        ..moveTo(128, 92)
        ..quadraticBezierTo(150, 86, 154, 68)
        ..quadraticBezierTo(140, 74, 126, 76)
        ..close(),
      p..color = deep,
    );
    canvas.drawOval(
      Rect.fromCenter(center: const Offset(80, 82), width: 108, height: 104),
      p..color = green,
    );
    canvas.drawOval(
      Rect.fromCenter(center: const Offset(80, 98), width: 68, height: 60),
      p..color = mint.withValues(alpha: 0.9),
    );
    canvas.drawPath(
      Path()
        ..moveTo(74, 32)
        ..quadraticBezierTo(78, 16, 88, 14)
        ..quadraticBezierTo(84, 22, 86, 32)
        ..close(),
      p..color = red,
    );
    for (final cx in [56.0, 104.0]) {
      canvas.drawOval(
        Rect.fromCenter(
          center: Offset(cx, 70),
          width: 30,
          height: happy ? 8 : 32,
        ),
        p..color = Colors.white,
      );
      if (happy) {
        canvas.drawPath(
          Path()
            ..moveTo(cx - 10, 72)
            ..quadraticBezierTo(cx, 60, cx + 10, 72),
          Paint()
            ..color = ink
            ..style = PaintingStyle.stroke
            ..strokeWidth = 4
            ..strokeCap = StrokeCap.round,
        );
      } else {
        final c = Offset(cx + look.dx * 5, 71 + look.dy * 4);
        canvas.drawCircle(c, 7.5, p..color = ink);
        canvas.drawCircle(
          c + const Offset(2.5, -3),
          2.4,
          p..color = Colors.white,
        );
      }
    }
    final cheek = red.withValues(alpha: happy ? 0.45 : 0.22);
    canvas.drawCircle(const Offset(42, 92), 6, p..color = cheek);
    canvas.drawCircle(const Offset(118, 92), 6, p..color = cheek);
    final beak = Path()
      ..moveTo(70, sad ? 90 : 86)
      ..lineTo(80, 98)
      ..lineTo(90, sad ? 90 : 86)
      ..close();
    canvas.drawPath(beak, p..color = gold);
    // Ailes : interpolation repos → devant les yeux.
    _wing(canvas, const Offset(36, 96), 1, cover);
    _wing(canvas, const Offset(124, 96), -1, (cover / 0.6).clamp(0.0, 1.0));
    canvas.restore();
  }

  void _wing(Canvas canvas, Offset base, double side, double t) {
    t = t.clamp(0.0, 1.0);
    final restRot = 12 * side;
    final rot = (restRot + (58 * side - restRot) * t) * math.pi / 180;
    final dx = 20 * side * t;
    final dy = -28 * t;
    canvas.save();
    final pivot = Offset(base.dx, 110);
    canvas.translate(dx, dy);
    canvas.translate(pivot.dx, pivot.dy);
    canvas.rotate(rot);
    canvas.translate(-pivot.dx, -pivot.dy);
    canvas.drawOval(
      Rect.fromCenter(center: base, width: 32, height: 52),
      Paint()..color = deep,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(_BirdPainter old) =>
      old.cover != cover ||
      old.look != look ||
      old.happy != happy ||
      old.sad != sad;
}
