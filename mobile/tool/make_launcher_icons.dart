// Compose les icônes de lancement à partir de
// assets/images/icon-ezoa.png (livre vert EZOA).
//
// Génère (supersampling 4x pour des bords nets) :
//   - assets/images/icon-ezoa-launcher.png : fond blanc + fin anneau vert
//     + icône verte centrée (iOS, Android legacy, web).
//   - assets/images/icon-ezoa-adaptive.png : canvas transparent + icône verte
//     centrée dans la zone sûre (foreground adaptive Android, fond blanc
//     via pubspec).
//
// Usage : dart run tool/make_launcher_icons.dart
// Puis : dart run flutter_launcher_icons

import 'dart:io';

import 'package:image/image.dart' as img;

const _outSize = 1024;
const _ss = 4; // facteur de supersampling
const _canvas = _outSize * _ss;

final _white = img.ColorRgba8(0xFF, 0xFF, 0xFF, 0xFF);
final _ezoaGreen = img.ColorRgba8(0x00, 0x6A, 0x4E, 0xFF);

void main() {
  final source = img.decodePng(
    File('assets/images/icon-ezoa.png').readAsBytesSync(),
  );
  if (source == null) {
    stderr.writeln('Impossible de lire assets/images/icon-ezoa.png');
    exit(1);
  }

  _write('assets/images/icon-ezoa-launcher.png', _composeLauncher(source));
  _write('assets/images/icon-ezoa-adaptive.png', _composeAdaptive(source));
  stdout.writeln('Icônes générées. Lancez : dart run flutter_launcher_icons');
}

/// Icône carrée pleine : fond blanc, fin anneau vert décoratif, icône 64 %.
img.Image _composeLauncher(img.Image source) {
  final canvas = img.Image(width: _canvas, height: _canvas, numChannels: 4);
  img.fill(canvas, color: _white);

  const center = _canvas ~/ 2;
  final ringRadius = (_canvas * 0.42).round();
  final ringWidth = (_canvas * 0.010).round();

  // Fin anneau vert EZOA autour de l'icône (cercle vert évidé en blanc).
  img.fillCircle(
    canvas,
    x: center,
    y: center,
    radius: ringRadius + ringWidth,
    color: _ezoaGreen,
    antialias: true,
  );
  img.fillCircle(
    canvas,
    x: center,
    y: center,
    radius: ringRadius,
    color: _white,
    antialias: true,
  );

  // 64 % du canevas : le contenu opaque du PNG source (~91 % de sa largeur)
  // reste à l'intérieur de l'anneau (rayon 0.42) avec une petite respiration.
  _drawIconCentered(canvas, source, fraction: 0.64);
  return img.copyResize(
    canvas,
    width: _outSize,
    height: _outSize,
    interpolation: img.Interpolation.cubic,
  );
}

/// Foreground adaptive Android : canvas transparent, icône verte centrée 44 %
/// dans la zone sûre (le fond blanc vient de adaptive_icon_background).
img.Image _composeAdaptive(img.Image source) {
  final canvas = img.Image(width: _canvas, height: _canvas, numChannels: 4);

  // Zone sûre Android ≈ cercle de 66 % du canevas (rayon 0.33) ; à 44 %,
  // le coin le plus éloigné du contenu atteint ~0.28 du canevas : OK.
  _drawIconCentered(canvas, source, fraction: 0.44);
  return img.copyResize(
    canvas,
    width: _outSize,
    height: _outSize,
    interpolation: img.Interpolation.cubic,
  );
}

void _drawIconCentered(img.Image canvas, img.Image source, {required double fraction}) {
  final target = (_canvas * fraction).round();
  final scaled = img.copyResize(
    source,
    width: target,
    height: target,
    interpolation: img.Interpolation.cubic,
  );
  img.compositeImage(
    canvas,
    scaled,
    dstX: (_canvas - target) ~/ 2,
    dstY: (_canvas - target) ~/ 2,
  );
}

void _write(String path, img.Image image) {
  File(path).writeAsBytesSync(img.encodePng(image));
  stdout.writeln('  → $path');
}
