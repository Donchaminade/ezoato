import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/ezoa_theme.dart';

const _green = Color(0xFF006A4E);
const _green2 = Color(0xFF02A671);
const _gold = Color(0xFFFFCE00);
const _red = Color(0xFFD21034);

/// (progression 0..1, libellé, couleur)
(double, String, Color) passwordStrength(String pwd) {
  if (pwd.isEmpty) return (0, '', Colors.transparent);
  var score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (RegExp('[A-Z]').hasMatch(pwd) && RegExp('[a-z]').hasMatch(pwd)) score++;
  if (RegExp(r'\d').hasMatch(pwd)) score++;
  if (RegExp(r'[^A-Za-z0-9]').hasMatch(pwd)) score++;
  if (score <= 2) return (0.33, 'Faible', _red);
  if (score <= 3) return (0.66, 'Moyen', _gold);
  return (1, 'Fort', _green2);
}

/// Cercles numérotés + ligne qui se remplit.
class RegisterStepper extends StatelessWidget {
  const RegisterStepper({super.key, required this.labels, required this.index});
  final List<String> labels;
  final int index;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final reduce = MediaQuery.of(context).disableAnimations;
    final dur = Duration(milliseconds: reduce ? 0 : 450);
    final n = labels.length;
    return LayoutBuilder(
      builder: (context, c) {
        final slot = c.maxWidth / n;
        final track = c.maxWidth - slot;
        return SizedBox(
          height: 72,
          child: Stack(
            children: [
              Positioned(
                left: slot / 2,
                width: track,
                top: 16,
                height: 4,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: pal.subtleFill,
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              Positioned(
                left: slot / 2,
                top: 16,
                height: 4,
                child: AnimatedContainer(
                  duration: dur,
                  curve: Curves.easeOutCubic,
                  width: track * index / (n - 1),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [_green, _green2]),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              Row(
                children: [
                  for (var i = 0; i < n; i++)
                    SizedBox(
                      width: slot,
                      child: Column(
                        children: [
                          AnimatedScale(
                            scale: i == index ? 1.12 : 1,
                            duration: dur,
                            child: AnimatedContainer(
                              key: Key('step-dot-$i'),
                              duration: dur,
                              width: 36,
                              height: 36,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: i < index
                                    ? _green
                                    : Theme.of(context).cardColor,
                                border: Border.all(
                                  width: 2,
                                  color: i <= index ? _green : pal.border,
                                ),
                                boxShadow: i == index
                                    ? [
                                        BoxShadow(
                                          color: _gold.withValues(alpha: .45),
                                          spreadRadius: 4,
                                        ),
                                      ]
                                    : null,
                              ),
                              child: i < index
                                  ? const Icon(
                                      LucideIcons.check,
                                      size: 16,
                                      color: Colors.white,
                                    )
                                  : Text(
                                      '${i + 1}',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        color: i == index
                                            ? (Theme.of(context).brightness ==
                                                      Brightness.dark
                                                  ? _green2
                                                  : _green)
                                            : pal.textMuted,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            labels[i],
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 11,
                              height: 1.15,
                              fontWeight: i == index
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: i == index ? pal.text : pal.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

enum SubmitStatus { idle, loading, success, error }

/// Bouton de soumission : remplissage liquide → coche, ou secousse en cas d'erreur.
class StatusSubmitButton extends StatefulWidget {
  const StatusSubmitButton({
    super.key,
    required this.label,
    required this.status,
    required this.onPressed,
  });
  final String label;
  final SubmitStatus status;
  final VoidCallback onPressed;

  @override
  State<StatusSubmitButton> createState() => _StatusSubmitButtonState();
}

class _StatusSubmitButtonState extends State<StatusSubmitButton>
    with TickerProviderStateMixin {
  late final _wave = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  );
  late final _shake = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 450),
  );

  @override
  void didUpdateWidget(covariant StatusSubmitButton old) {
    super.didUpdateWidget(old);
    if (widget.status == SubmitStatus.loading) {
      _wave.repeat();
    } else {
      _wave.stop();
    }
    if (widget.status == SubmitStatus.error &&
        old.status != SubmitStatus.error) {
      _shake.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _wave.dispose();
    _shake.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final st = widget.status;
    final busy = st == SubmitStatus.loading || st == SubmitStatus.success;
    return AnimatedBuilder(
      animation: Listenable.merge([_wave, _shake]),
      builder: (context, _) {
        final dx =
            math.sin(_shake.value * math.pi * 6) * 8 * (1 - _shake.value);
        return Transform.translate(
          offset: Offset(dx, 0),
          child: Semantics(
            button: true,
            label: widget.label,
            child: GestureDetector(
              key: const Key('register-submit'),
              onTap: busy ? null : widget.onPressed,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                height: 52,
                decoration: BoxDecoration(
                  color: st == SubmitStatus.error
                      ? _red
                      : st == SubmitStatus.success
                      ? _green2
                      : _green,
                  borderRadius: BorderRadius.circular(14),
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (st == SubmitStatus.loading)
                      Positioned.fill(
                        child: CustomPaint(painter: _WavePainter(_wave.value)),
                      ),
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 220),
                      child: switch (st) {
                        SubmitStatus.success => const Icon(
                          LucideIcons.check,
                          key: ValueKey('ok'),
                          color: Colors.white,
                          size: 26,
                        ),
                        SubmitStatus.loading => const Text(
                          'Création…',
                          key: ValueKey('ld'),
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        _ => Row(
                          key: const ValueKey('idle'),
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              LucideIcons.userPlus,
                              color: Colors.white,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                widget.label,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                          ],
                        ),
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _WavePainter extends CustomPainter {
  _WavePainter(this.t);
  final double t;
  @override
  void paint(Canvas canvas, Size s) {
    final level = s.height * (1 - (t * 0.9 + 0.1));
    final path = Path()..moveTo(0, s.height);
    for (double x = 0; x <= s.width; x += 4) {
      path.lineTo(x, level + math.sin((x / s.width * 4 + t * 2) * math.pi) * 4);
    }
    path
      ..lineTo(s.width, s.height)
      ..close();
    canvas.drawPath(path, Paint()..color = _green2.withValues(alpha: .75));
  }

  @override
  bool shouldRepaint(_WavePainter o) => o.t != t;
}
