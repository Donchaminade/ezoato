import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/security/secure_screen.dart';
import '../../core/theme/ezoa_theme.dart';

/// Ratio A4 (hauteur / largeur) utilisé pour la mise en page des pages.
const double kPageRatio = 1.4142;
const double _gap = 14;
const double _minZoom = 1;
const double _maxZoom = 4;

/// Liseuse type « Adobe Reader » : défilement continu des pages, zoom
/// pincement / double-tap / boutons, compteur, aller à la page, ajuster à la
/// largeur, mode nuit et filigrane nominatif. Capture d'écran bloquée.
class ExamReader extends StatefulWidget {
  const ExamReader({
    super.key,
    required this.title,
    required this.pageCount,
    required this.pageBuilder,
    this.watermark,
  });

  final String title;
  final int pageCount;

  /// Construit le contenu d'une page (image réseau authentifiée ou asset).
  final Widget Function(BuildContext context, int index) pageBuilder;

  /// Texte du filigrane (nom · e-mail). Null = pas de filigrane.
  final String? watermark;

  @override
  State<ExamReader> createState() => ExamReaderState();
}

class ExamReaderState extends State<ExamReader> {
  final _ctrl = TransformationController();
  final _pageField = TextEditingController(text: '1');
  final _pageFocus = FocusNode();
  int _page = 1;
  bool _night = false;
  Size _viewport = Size.zero;
  TapDownDetails? _doubleTapDetails;

  double get zoom => _ctrl.value.getMaxScaleOnAxis();
  int get page => _page;
  bool get night => _night;

  @override
  void initState() {
    super.initState();
    _ctrl.addListener(_onTransform);
  }

  @override
  void dispose() {
    _ctrl.removeListener(_onTransform);
    _ctrl.dispose();
    _pageField.dispose();
    _pageFocus.dispose();
    super.dispose();
  }

  double get _pageExtent => (_viewport.width - 2 * _gap) * kPageRatio + _gap;

  void _onTransform() {
    if (_viewport == Size.zero) return;
    final s = zoom;
    final ty = -_ctrl.value.getTranslation().y;
    final centerY = (ty + _viewport.height / 2) / s - _gap;
    final p =
        (centerY / _pageExtent).floor().clamp(0, widget.pageCount - 1) + 1;
    if (p != _page) {
      _page = p;
      if (!_pageFocus.hasFocus) _pageField.text = '$p';
    }
    setState(() {});
  }

  Matrix4 _matrix(double scale, double dx, double dy) {
    final contentW = _viewport.width * scale;
    final contentH = (_gap + widget.pageCount * _pageExtent) * scale;
    final minX = math.min(0.0, _viewport.width - contentW);
    final minY = math.min(0.0, _viewport.height - contentH);
    return Matrix4.identity()
      ..translateByDouble(dx.clamp(minX, 0.0), dy.clamp(minY, 0.0), 0, 1)
      ..scaleByDouble(scale, scale, 1, 1);
  }

  /// Zoom autour d'un point du viewport.
  void setZoom(double next, {Offset? focal}) {
    next = next.clamp(_minZoom, _maxZoom);
    final f = focal ?? Offset(_viewport.width / 2, _viewport.height / 2);
    final s = zoom;
    final t = _ctrl.value.getTranslation();
    final sceneX = (f.dx - t.x) / s;
    final sceneY = (f.dy - t.y) / s;
    _ctrl.value = _matrix(next, f.dx - sceneX * next, f.dy - sceneY * next);
  }

  void fitWidth() {
    final topScene = (-_ctrl.value.getTranslation().y) / zoom;
    _ctrl.value = _matrix(1, 0, -topScene);
  }

  void goToPage(int p) {
    p = p.clamp(1, widget.pageCount);
    final s = zoom;
    final t = _ctrl.value.getTranslation();
    _ctrl.value = _matrix(s, t.x, -((p - 1) * _pageExtent) * s);
    _page = p;
    _pageField.text = '$p';
    setState(() {});
  }

  void toggleNight() => setState(() => _night = !_night);

  void _onDoubleTap() {
    final pos = _doubleTapDetails?.localPosition;
    setZoom(zoom > 1.05 ? 1 : 2.5, focal: pos);
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final bg = _night ? const Color(0xFF0B1210) : pal.subtleFill;
    return SecureScreenScope(
      child: Scaffold(
        backgroundColor: bg,
        appBar: AppBar(
          backgroundColor: EzoaColors.primaryDark,
          foregroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            tooltip: 'Fermer',
            icon: const Icon(LucideIcons.x, size: 20),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          title: Text(
            widget.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: EzoaTypography.titleMedium(
              context,
            ).copyWith(fontSize: 15, color: Colors.white),
          ),
        ),
        body: Column(
          children: [
            _toolbar(context),
            Expanded(
              child: LayoutBuilder(
                builder: (context, c) {
                  final size = Size(c.maxWidth, c.maxHeight);
                  if (size != _viewport) {
                    _viewport = size;
                  }
                  final w = size.width;
                  final pageW = w - 2 * _gap;
                  final content = SizedBox(
                    width: w,
                    height: _gap + widget.pageCount * _pageExtent,
                    child: Column(
                      children: [
                        const SizedBox(height: _gap),
                        for (var i = 0; i < widget.pageCount; i++)
                          Padding(
                            padding: const EdgeInsets.only(bottom: _gap),
                            child: _Page(
                              width: pageW,
                              night: _night,
                              index: i,
                              child: widget.pageBuilder(context, i),
                            ),
                          ),
                      ],
                    ),
                  );
                  return Stack(
                    children: [
                      GestureDetector(
                        onDoubleTapDown: (d) => _doubleTapDetails = d,
                        onDoubleTap: _onDoubleTap,
                        child: InteractiveViewer(
                          transformationController: _ctrl,
                          constrained: false,
                          minScale: _minZoom,
                          maxScale: _maxZoom,
                          boundaryMargin: EdgeInsets.zero,
                          child: content,
                        ),
                      ),
                      if (widget.watermark != null)
                        Positioned.fill(
                          child: IgnorePointer(
                            child: CustomPaint(
                              painter: _WatermarkPainter(
                                widget.watermark!,
                                night: _night,
                              ),
                            ),
                          ),
                        ),
                      Positioned(
                        left: 0,
                        right: 0,
                        bottom: 14,
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.62),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              'Page $_page / ${widget.pageCount} · ${(zoom * 100).round()} %',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _toolbar(BuildContext context) {
    return Container(
      color: EzoaColors.primaryDark,
      padding: const EdgeInsets.fromLTRB(6, 0, 6, 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _ToolBtn(
              icon: LucideIcons.chevronUp,
              label: 'Page précédente',
              onTap: _page > 1 ? () => goToPage(_page - 1) : null,
            ),
            Container(
              width: 44,
              height: 34,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              child: TextField(
                key: const Key('reader-page-field'),
                controller: _pageField,
                focusNode: _pageFocus,
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
                decoration: InputDecoration(
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 8),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: EzoaColors.gold),
                  ),
                ),
                onSubmitted: (v) => goToPage(int.tryParse(v) ?? _page),
              ),
            ),
            Text(
              '/ ${widget.pageCount}',
              style: const TextStyle(color: Colors.white70, fontSize: 13),
            ),
            _ToolBtn(
              icon: LucideIcons.chevronDown,
              label: 'Page suivante',
              onTap: _page < widget.pageCount
                  ? () => goToPage(_page + 1)
                  : null,
            ),
            const SizedBox(width: 6),
            _ToolBtn(
              icon: LucideIcons.zoomOut,
              label: 'Zoom arrière',
              onTap: zoom > _minZoom + 0.01 ? () => setZoom(zoom - 0.5) : null,
            ),
            SizedBox(
              width: 44,
              child: Text(
                '${(zoom * 100).round()} %',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            _ToolBtn(
              icon: LucideIcons.zoomIn,
              label: 'Zoom avant',
              onTap: zoom < _maxZoom - 0.01 ? () => setZoom(zoom + 0.5) : null,
            ),
            _ToolBtn(
              icon: LucideIcons.moveHorizontal,
              label: 'Ajuster à la largeur',
              active: zoom <= 1.01,
              onTap: fitWidth,
            ),
            _ToolBtn(
              icon: _night ? LucideIcons.sun : LucideIcons.moon,
              label: _night ? 'Mode jour' : 'Mode nuit',
              active: _night,
              onTap: toggleNight,
            ),
          ],
        ),
      ),
    );
  }
}

class _Page extends StatelessWidget {
  const _Page({
    required this.width,
    required this.night,
    required this.index,
    required this.child,
  });
  final double width;
  final bool night;
  final int index;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    Widget page = Container(
      width: width,
      height: width * kPageRatio,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Semantics(label: 'Page ${index + 1}', child: child),
    );
    if (night) {
      page = ColorFiltered(
        colorFilter: const ColorFilter.matrix(<double>[
          -0.9,
          0,
          0,
          0,
          235,
          0,
          -0.9,
          0,
          0,
          240,
          0,
          0,
          -0.9,
          0,
          238,
          0,
          0,
          0,
          1,
          0,
        ]),
        child: page,
      );
    }
    return page;
  }
}

class _ToolBtn extends StatelessWidget {
  const _ToolBtn({
    required this.icon,
    required this.label,
    this.onTap,
    this.active = false,
  });
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Tooltip(
      message: label,
      child: Semantics(
        button: true,
        label: label,
        child: InkResponse(
          onTap: onTap,
          radius: 22,
          child: Container(
            width: 38,
            height: 38,
            margin: const EdgeInsets.symmetric(horizontal: 1),
            decoration: BoxDecoration(
              color: active
                  ? EzoaColors.gold.withValues(alpha: 0.22)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              size: 18,
              color: enabled
                  ? (active ? EzoaColors.gold : Colors.white)
                  : Colors.white38,
            ),
          ),
        ),
      ),
    );
  }
}

class _WatermarkPainter extends CustomPainter {
  _WatermarkPainter(this.text, {required this.night});
  final String text;
  final bool night;

  @override
  void paint(Canvas canvas, Size size) {
    final tp = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          fontFamily: 'Inter',
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: (night ? Colors.white : EzoaColors.primary).withValues(
            alpha: 0.11,
          ),
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    canvas.save();
    canvas.rotate(-math.pi / 7);
    final stepX = tp.width + 60;
    const stepY = 110.0;
    for (double y = -size.height; y < size.height * 1.6; y += stepY) {
      final shift = ((y / stepY).round().isEven) ? 0.0 : stepX / 2;
      for (double x = -size.width - shift; x < size.width * 1.6; x += stepX) {
        tp.paint(canvas, Offset(x, y));
      }
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(_WatermarkPainter old) =>
      old.text != text || old.night != night;
}
