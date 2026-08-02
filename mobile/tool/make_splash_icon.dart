// Génère l'image du splash natif (flutter_native_splash) à partir de
// assets/images/icon-ezoa.png (livre vert EZOA).
//
// Produit assets/images/icon-ezoa-splash.png : canvas carré 1024×1024
// transparent, icône brand (couleurs d'origine) centrée à ~62 %,
// pour affichage sur le fond blanc/off-white du splash natif.
//
// Usage : dart run tool/make_splash_icon.dart
// Puis : dart run flutter_native_splash:create

import 'dart:io';

import 'package:image/image.dart' as img;

const _outSize = 1024;
const _iconFraction = 0.62;

void main() {
  final source = img.decodePng(
    File('assets/images/icon-ezoa.png').readAsBytesSync(),
  );
  if (source == null) {
    stderr.writeln('Impossible de lire assets/images/icon-ezoa.png');
    exit(1);
  }

  final target = (_outSize * _iconFraction).round();
  final scaled = img.copyResize(
    source,
    width: target,
    height: target,
    interpolation: img.Interpolation.cubic,
  );

  final canvas = img.Image(width: _outSize, height: _outSize, numChannels: 4);
  img.compositeImage(
    canvas,
    scaled,
    dstX: (_outSize - target) ~/ 2,
    dstY: (_outSize - target) ~/ 2,
  );

  const out = 'assets/images/icon-ezoa-splash.png';
  File(out).writeAsBytesSync(img.encodePng(canvas));
  stdout.writeln('  → $out');
  stdout.writeln('Lancez : dart run flutter_native_splash:create');
}
