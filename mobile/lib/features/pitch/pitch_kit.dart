import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Design system « pitch » EZOA-TO.
///
/// Inspiration : DepMCu7Ml-j (app mobile fintech : chiffre central énorme,
/// actions rapides en cercles, cartes 24 px, tab bar flottante avec onglet
/// actif en pilule) adaptée à la marque émeraude #006A4E + or #FFCE00.
/// Animations : DZPqMZ2T1PA (fade + y 40→0, 0,5 s easeOut, cascade 80 ms,
/// cartes scale 0.95→1, badges 0.8→1, orbes floutés qui dérivent 15 s).
class PK {
  static const emerald = Color(0xFF006A4E);
  static const emeraldDeep = Color(0xFF004D38);
  static const mint = Color(0xFF02A671);
  static const lime = Color(0xFFFFCE00);
  static const gold = Color(0xFFFFCE00);
  static const red = Color(0xFFD21034);

  static const fontDisplay = 'SpaceGrotesk';
  static const fontBody = 'Inter';

  static bool dark(BuildContext c) => Theme.of(c).brightness == Brightness.dark;
  static Color bg(BuildContext c) => dark(c) ? const Color(0xFF081221) : const Color(0xFFFCFCFA);
  static Color surface(BuildContext c) => dark(c) ? const Color(0xFF101D2F) : Colors.white;
  static Color surface2(BuildContext c) => dark(c) ? const Color(0xFF1C2A3C) : const Color(0xFFECF4EF);
  static Color ink(BuildContext c) => dark(c) ? const Color(0xFFE0E5ED) : const Color(0xFF0B121A);
  static Color muted(BuildContext c) => dark(c) ? const Color(0xFF8F99A8) : const Color(0xFF5B646F);
  static Color line(BuildContext c) => dark(c) ? const Color(0x1AFFFFFF) : const Color(0x14000000);
  static Color accent(BuildContext c) => dark(c) ? mint : emerald;
  /// Bloc « héros » : noir profond en clair, émeraude très sombre en sombre.
  static Color hero(BuildContext c) => dark(c) ? const Color(0xFF004D38) : const Color(0xFF006A4E);

  static TextStyle display(BuildContext c, double size, {Color? color, FontWeight w = FontWeight.w700}) =>
      TextStyle(fontFamily: fontDisplay, fontSize: size, fontWeight: w, height: 1.05, letterSpacing: -0.5, color: color ?? ink(c));
  static TextStyle body(BuildContext c, double size, {Color? color, FontWeight w = FontWeight.w400, double h = 1.4}) =>
      TextStyle(fontFamily: fontBody, fontSize: size, fontWeight: w, height: h, color: color ?? ink(c));

  static const r = 24.0;
  static const pad = 20.0;
}

/// Reveal par défaut DZPqMZ2T1PA.
extension PKReveal on Widget {
  Widget reveal(int i, {bool card = false}) {
    final d = Duration(milliseconds: 80 * i);
    var a = animate(delay: d).fadeIn(duration: 500.ms, curve: Curves.easeOut).moveY(begin: 40, end: 0, duration: 500.ms, curve: Curves.easeOut);
    if (card) a = a.scaleXY(begin: 0.95, end: 1, duration: 500.ms, curve: Curves.easeOut);
    return a;
  }

  Widget badgePop([int i = 0]) => animate(delay: Duration(milliseconds: 80 * i)).scaleXY(begin: 0.8, end: 1, duration: 350.ms, curve: Curves.easeOutBack).fadeIn(duration: 250.ms);
}

/// Fond avec orbes floutés qui dérivent (15 s).
class PKBackground extends StatefulWidget {
  const PKBackground({super.key, required this.child});
  final Widget child;
  @override
  State<PKBackground> createState() => _PKBackgroundState();
}

class _PKBackgroundState extends State<PKBackground> with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(seconds: 15))..repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduce = MediaQuery.of(context).disableAnimations;
    final dark = PK.dark(context);
    return ColoredBox(
      color: PK.bg(context),
      child: Stack(children: [
        Positioned.fill(
          child: AnimatedBuilder(
            animation: _c,
            builder: (_, __) {
              final t = reduce ? 0.0 : _c.value * 2 * math.pi;
              return Stack(children: [
                _orb(-80 + 40 * math.sin(t), -60 + 30 * math.cos(t), 260, PK.mint.withValues(alpha: dark ? 0.10 : 0.12)),
                _orb(null, 220 + 40 * math.cos(t), 220, PK.gold.withValues(alpha: dark ? 0.06 : 0.10), right: -70 + 30 * math.sin(t)),
              ]);
            },
          ),
        ),
        Positioned.fill(child: BackdropFilter(filter: ImageFilter.blur(sigmaX: 60, sigmaY: 60), child: const SizedBox())),
        widget.child,
      ]),
    );
  }

  Widget _orb(double? left, double top, double size, Color color, {double? right}) => Positioned(
        left: left,
        right: right,
        top: top,
        child: Container(width: size, height: size, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
      );
}

/// Bouton avec retour tactile scale 0.96.
class PKTap extends StatefulWidget {
  const PKTap({super.key, required this.child, required this.onTap, this.semantics});
  final Widget child;
  final VoidCallback? onTap;
  final String? semantics;
  @override
  State<PKTap> createState() => _PKTapState();
}

class _PKTapState extends State<PKTap> {
  bool _down = false;
  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: widget.semantics,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) => setState(() => _down = true),
        onTapCancel: () => setState(() => _down = false),
        onTapUp: (_) => setState(() => _down = false),
        onTap: widget.onTap == null
            ? null
            : () {
                HapticFeedback.selectionClick();
                widget.onTap!();
              },
        child: AnimatedScale(scale: _down ? 0.96 : 1, duration: const Duration(milliseconds: 120), child: widget.child),
      ),
    );
  }
}

class PKButton extends StatelessWidget {
  const PKButton({super.key, required this.label, this.icon, this.onTap, this.style = PKButtonStyle.primary, this.expand = true});
  final String label;
  final IconData? icon;
  final VoidCallback? onTap;
  final PKButtonStyle style;
  final bool expand;
  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (style) {
      PKButtonStyle.primary => (PK.emerald, Colors.white),
      PKButtonStyle.gold => (PK.gold, const Color(0xFF0B121A)),
      PKButtonStyle.ghost => (PK.surface2(context), PK.ink(context)),
      PKButtonStyle.ink => (PK.ink(context), PK.bg(context)),
    };
    return PKTap(
      onTap: onTap,
      semantics: label,
      child: Container(
        height: 56,
        width: expand ? double.infinity : null,
        padding: const EdgeInsets.symmetric(horizontal: 22),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
        child: Row(mainAxisSize: MainAxisSize.min, mainAxisAlignment: MainAxisAlignment.center, children: [
          if (icon != null) ...[Icon(icon, color: fg, size: 20), const SizedBox(width: 10)],
          Flexible(child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: PK.body(context, 16, color: fg, w: FontWeight.w600))),
        ]),
      ),
    );
  }
}

enum PKButtonStyle { primary, gold, ghost, ink }

class PKCard extends StatelessWidget {
  const PKCard({super.key, required this.child, this.color, this.padding = const EdgeInsets.all(18), this.onTap});
  final Widget child;
  final Color? color;
  final EdgeInsets padding;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) {
    final box = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? PK.surface(context),
        borderRadius: BorderRadius.circular(PK.r),
        border: Border.all(color: PK.line(context)),
        boxShadow: [if (!PK.dark(context)) BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 24, offset: const Offset(0, 8))],
      ),
      child: child,
    );
    return onTap == null ? box : PKTap(onTap: onTap, child: box);
  }
}

class PKChip extends StatelessWidget {
  const PKChip(this.label, {super.key, this.selected = false, this.onTap, this.icon, this.color});
  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final IconData? icon;
  final Color? color;
  @override
  Widget build(BuildContext context) {
    final fg = selected ? PK.bg(context) : (color ?? PK.ink(context));
    return PKTap(
      onTap: onTap,
      semantics: label,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? PK.ink(context) : PK.surface(context),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: selected ? Colors.transparent : PK.line(context)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          if (icon != null) ...[Icon(icon, size: 15, color: fg), const SizedBox(width: 6)],
          Text(label, style: PK.body(context, 13, color: fg, w: FontWeight.w600)),
        ]),
      ),
    );
  }
}

class PKBadge extends StatelessWidget {
  const PKBadge(this.label, {super.key, this.bg = PK.gold, this.fg = const Color(0xFF0B121A), this.icon});
  final String label;
  final Color bg;
  final Color fg;
  final IconData? icon;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          if (icon != null) ...[Icon(icon, size: 12, color: fg), const SizedBox(width: 4)],
          Text(label, style: TextStyle(fontFamily: PK.fontBody, fontSize: 11, fontWeight: FontWeight.w700, color: fg, letterSpacing: 0.3)),
        ]),
      );
}

class PKRoundIcon extends StatelessWidget {
  const PKRoundIcon(this.icon, {super.key, this.onTap, this.label, this.dot = false});
  final IconData icon;
  final VoidCallback? onTap;
  final String? label;
  final bool dot;
  @override
  Widget build(BuildContext context) => PKTap(
        onTap: onTap,
        semantics: label,
        child: Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(color: PK.surface(context), shape: BoxShape.circle, border: Border.all(color: PK.line(context))),
          child: Stack(alignment: Alignment.center, children: [
            Icon(icon, size: 20, color: PK.ink(context)),
            if (dot) Positioned(top: 11, right: 12, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: PK.red, shape: BoxShape.circle))),
          ]),
        ),
      );
}

/// En-tête d'écran secondaire : retour rond + titre.
class PKTopBar extends StatelessWidget {
  const PKTopBar({super.key, required this.title, this.trailing});
  final String title;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(PK.pad, 8, PK.pad, 8),
        child: Row(children: [
          PKRoundIcon(Icons.arrow_back_rounded, label: 'Retour', onTap: () => Navigator.of(context).maybePop()),
          const SizedBox(width: 14),
          Expanded(child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: PK.display(context, 20))),
          if (trailing != null) trailing!,
        ]),
      );
}

class PKSectionTitle extends StatelessWidget {
  const PKSectionTitle(this.title, {super.key, this.action, this.onAction});
  final String title;
  final String? action;
  final VoidCallback? onAction;
  @override
  Widget build(BuildContext context) => Row(children: [
        Expanded(child: Text(title, style: PK.display(context, 19))),
        if (action != null)
          PKTap(onTap: onAction, semantics: action, child: Text(action!, style: PK.body(context, 13, color: PK.accent(context), w: FontWeight.w600))),
      ]);
}

Route<T> pkRoute<T>(Widget page) => PageRouteBuilder<T>(
      transitionDuration: const Duration(milliseconds: 380),
      reverseTransitionDuration: const Duration(milliseconds: 280),
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, a, __, child) {
        final c = CurvedAnimation(parent: a, curve: Curves.easeOutCubic);
        return FadeTransition(opacity: c, child: SlideTransition(position: Tween(begin: const Offset(0, 0.04), end: Offset.zero).animate(c), child: child));
      },
    );

String fcfa(int v) {
  final s = v.toString();
  final b = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write('\u202F');
    b.write(s[i]);
  }
  return '$b FCFA';
}


/// Petit badge discret « Démo », visible sur tous les écrans du mode démo.
class DemoBadge extends StatelessWidget {
  const DemoBadge({super.key});
  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return Positioned(
      top: top + 4,
      right: 10,
      child: IgnorePointer(
        child: Semantics(
          label: 'Mode démo actif',
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: PK.gold.withValues(alpha: 0.92), borderRadius: BorderRadius.circular(999)),
            child: const Text('Démo', style: TextStyle(fontFamily: PK.fontBody, fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF0B121A), decoration: TextDecoration.none)),
          ),
        ),
      ),
    );
  }
}
