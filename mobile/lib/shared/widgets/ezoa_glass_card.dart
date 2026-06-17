import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/ezoa_theme.dart';

/// Dark glassmorphism card with blur, border, shadow and optional press shine.
class EzoaGlassCard extends StatefulWidget {
  const EzoaGlassCard({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPress,
    this.padding = const EdgeInsets.all(16),
    this.margin = const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
    this.borderRadius = 16,
    this.enableShine = true,
    this.blurSigma = 16,
    this.expand = false,
  });

  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final double borderRadius;
  final bool enableShine;
  final double blurSigma;

  /// Remplit les contraintes du parent (tuiles carrées, grilles…).
  final bool expand;

  @override
  State<EzoaGlassCard> createState() => _EzoaGlassCardState();
}

class _EzoaGlassCardState extends State<EzoaGlassCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _shineController;
  bool _pressed = false;

  @override
  void initState() {
    super.initState();
    // Sweep « glossy shine » : calque dégradé qui traverse la carte
    // (équivalent -translate-x-full → translate-x-full, duration-1000).
    _shineController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
  }

  @override
  void dispose() {
    _shineController.dispose();
    super.dispose();
  }

  void _triggerShine() {
    if (!widget.enableShine || _shineController.isAnimating) return;
    _shineController.forward(from: 0);
  }

  void _setPressed(bool value) {
    if (_pressed != value) setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final radius = BorderRadius.circular(widget.borderRadius);

    Widget card = Container(
      margin: widget.margin,
      width: widget.expand ? double.infinity : null,
      height: widget.expand ? double.infinity : null,
      decoration: BoxDecoration(
        borderRadius: radius,
        boxShadow: [
          BoxShadow(
            color: pal.shadow,
            blurRadius: 24,
            spreadRadius: 0,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: Stack(
          children: [
            BackdropFilter(
              filter: ImageFilter.blur(
                sigmaX: widget.blurSigma,
                sigmaY: widget.blurSigma,
              ),
              child: Container(
                padding: widget.padding,
                decoration: BoxDecoration(
                  color: pal.glassFill,
                  borderRadius: radius,
                  border: Border.all(color: pal.borderStrong),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      pal.glassSheenTop,
                      pal.glassSheenBottom,
                    ],
                  ),
                ),
                child: widget.child,
              ),
            ),
            if (widget.enableShine)
              Positioned.fill(
                child: IgnorePointer(
                  child: AnimatedBuilder(
                    animation: _shineController,
                    builder: (context, _) {
                      final t = _shineController.value;
                      if (t == 0 || _shineController.isCompleted) {
                        return const SizedBox.shrink();
                      }
                      final eased = Curves.easeInOut.transform(t);
                      // Diagonale satinée from-transparent via-white/10 to-transparent.
                      return DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment(-2.0 + 4 * eased, -1.0),
                            end: Alignment(-0.5 + 4 * eased, 1.0),
                            colors: [
                              Colors.transparent,
                              pal.shineStrong,
                              pal.shineSoft,
                              Colors.transparent,
                            ],
                            stops: const [0.0, 0.45, 0.55, 1.0],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
          ],
        ),
      ),
    );

    if (widget.onTap != null || widget.onLongPress != null) {
      card = MouseRegion(
        onEnter: (_) => _triggerShine(),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: widget.onTap,
            onLongPress: widget.onLongPress,
            onTapDown: (_) {
              _setPressed(true);
              _triggerShine();
            },
            onTapUp: (_) => _setPressed(false),
            onTapCancel: () => _setPressed(false),
            borderRadius: radius,
            splashColor: pal.accent.withValues(alpha: 0.08),
            highlightColor: pal.subtleFill,
            child: AnimatedScale(
              scale: _pressed ? 0.98 : 1.0,
              duration: const Duration(milliseconds: 150),
              curve: Curves.easeOut,
              child: card,
            ),
          ),
        ),
      );
    }

    return card;
  }
}

/// Compact glass stat tile for dashboard metrics.
///
/// Ne retourne PAS d'`Expanded` : c'est au parent de décider du flex
/// (`Expanded(child: EzoaGlassStat(...))` dans un Row), sinon un usage hors
/// Row/Column lèverait « Incorrect use of ParentDataWidget ».
class EzoaGlassStat extends StatelessWidget {
  const EzoaGlassStat({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.onTap,
    this.square = false,
  });

  final String label;
  final int value;
  final IconData? icon;
  final VoidCallback? onTap;

  /// Tuile carrée : remplit le parent et centre le contenu verticalement.
  final bool square;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return EzoaGlassCard(
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      enableShine: false,
      expand: square,
      onTap: onTap,
      child: Column(
        mainAxisSize: square ? MainAxisSize.max : MainAxisSize.min,
        mainAxisAlignment:
            square ? MainAxisAlignment.center : MainAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 18, color: pal.accent),
            const SizedBox(height: 6),
          ],
          Text(
            value.toString(),
            style: GoogleFonts.spaceGrotesk(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: pal.emerald,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label.toUpperCase(),
            style: EzoaTypography.badge(context),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
