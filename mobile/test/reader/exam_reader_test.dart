import 'dart:io';
import 'dart:ui' as ui;

import 'package:ezoa_to/core/theme/ezoa_theme.dart';
import 'package:ezoa_to/shared/widgets/exam_reader.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'dart:async';
import 'package:http/http.dart' as http;
// ignore: implementation_imports
import 'package:google_fonts/src/google_fonts_base.dart' as gfb;

class _NoHttp extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest r) =>
      Completer<http.StreamedResponse>().future;
}

final _out = Platform.environment['READER_SHOTS'];

Future<void> _font(String family, String path) async {
  final l = FontLoader(family)
    ..addFont(File(path).readAsBytes().then((b) => ByteData.view(b.buffer)));
  await l.load();
}

Future<void> _shot(WidgetTester t, String name) async {
  if (_out == null) return;
  await t.runAsync(() async {
    final ro = t.renderObject<RenderRepaintBoundary>(
      find.byKey(const Key('shot')),
    );
    final img = await ro.toImage(pixelRatio: 1);
    final bytes = await img.toByteData(format: ui.ImageByteFormat.png);
    File('$_out/$name.png').writeAsBytesSync(bytes!.buffer.asUint8List());
  });
}

void main() {
  setUpAll(() async {
    await _font('Inter', 'assets/fonts/Inter.ttf');
    await _font('SpaceGrotesk', 'assets/fonts/SpaceGrotesk.ttf');
    gfb.httpClient = _NoHttp();
    for (final w in ['regular', '500', '600', '700']) {
      await _font('SpaceGrotesk_$w', 'assets/fonts/SpaceGrotesk.ttf');
      await _font('Inter_$w', 'assets/fonts/Inter.ttf');
    }
    await _font(
      'packages/lucide_icons/Lucide',
      '${Platform.environment['HOME']}/.pub-cache/hosted/pub.dev/lucide_icons-0.257.0/assets/lucide.ttf',
    );
    await _font(
      'MaterialIcons',
      '${Platform.environment['FLUTTER_ROOT']}/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf',
    );
  });

  const assets = [
    'assets/demo_subjects/ec42934-1.jpg',
    'assets/demo_subjects/ec42934-2.jpg',
  ];

  for (final dark in [false, true]) {
    final sfx = dark ? '-dark' : '';
    testWidgets('liseuse : zoom, pages, nuit, filigrane${dark ? ' (sombre)' : ''}', (t) async {
      t.view.physicalSize = const Size(390, 844);
      t.view.devicePixelRatio = 1;
      addTearDown(t.view.reset);
      final key = GlobalKey<ExamReaderState>();
      await t.pumpWidget(MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: EzoaTheme.light,
        darkTheme: EzoaTheme.dark,
        themeMode: dark ? ThemeMode.dark : ThemeMode.light,
        home: RepaintBoundary(
          key: const Key('shot'),
          child: ExamReader(
            key: key,
            title: 'BEPC 2026 — Mathématiques',
            pageCount: assets.length,
            watermark: 'Afi Kouami · afi@tea.test · EZOA-TO',
            pageBuilder: (_, i) => Image.asset(assets[i], fit: BoxFit.contain),
          ),
        ),
      ));
      await t.runAsync(() async {
        for (final a in assets) {
          await precacheImage(AssetImage(a), t.element(find.byType(ExamReader)));
        }
      });
      await t.pumpAndSettle();
      final s = key.currentState!;
      expect(find.text('Page 1 / 2 · 100 %'), findsOneWidget);
      expect(find.byTooltip('Zoom avant'), findsOneWidget);
      await _shot(t, 'flutter-reader-page1$sfx');

      await t.tap(find.byTooltip('Zoom avant'));
      await t.pump();
      expect(s.zoom, closeTo(1.5, 0.01));
      await t.tap(find.byTooltip('Zoom avant'));
      await t.pump();
      expect(s.zoom, closeTo(2.0, 0.01));
      await _shot(t, 'flutter-reader-zoom$sfx');

      await t.tap(find.byTooltip('Ajuster à la largeur'));
      await t.pump();
      expect(s.zoom, closeTo(1, 0.01));

      // double-tap : 1 → 2,5 → 1
      final center = t.getCenter(find.byType(InteractiveViewer));
      await t.tapAt(center);
      await t.pump(const Duration(milliseconds: 50));
      await t.tapAt(center);
      await t.pumpAndSettle();
      expect(s.zoom, closeTo(2.5, 0.01));
      s.fitWidth();
      await t.pump();

      // aller à la page
      await t.enterText(find.byKey(const Key('reader-page-field')), '2');
      await t.testTextInput.receiveAction(TextInputAction.done);
      await t.pumpAndSettle();
      expect(s.page, 2);
      expect(find.text('Page 2 / 2 · 100 %'), findsOneWidget);
      await _shot(t, 'flutter-reader-page2$sfx');

      await t.tap(find.byTooltip('Mode nuit'));
      await t.pump();
      expect(s.night, isTrue);
      expect(find.byType(ColorFiltered), findsWidgets);
      await _shot(t, 'flutter-reader-night$sfx');

      // pincement (2 doigts)
      s.fitWidth();
      await t.pump();
      final g1 = await t.startGesture(center - const Offset(30, 0));
      final g2 = await t.startGesture(center + const Offset(30, 0));
      await t.pump();
      await g1.moveBy(const Offset(-60, 0));
      await g2.moveBy(const Offset(60, 0));
      await t.pump();
      await g1.up();
      await g2.up();
      await t.pumpAndSettle();
      expect(s.zoom, greaterThan(1.2));
    });
  }
}
