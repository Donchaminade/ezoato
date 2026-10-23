import 'dart:io';
import 'dart:ui' as ui;

import 'package:ezoa_to/core/theme/ezoa_theme.dart';
import 'package:ezoa_to/features/auth/presentation/register_screen.dart';
import 'package:ezoa_to/features/epreuves/presentation/home_screen.dart'
    show metaProvider;
import 'package:ezoa_to/shared/models/models.dart';
import 'package:ezoa_to/shared/widgets/ezoa_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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

const _meta = PublicMeta(
  villes: ['Lomé', 'Kara', 'Sokodé'],
  matieres: [],
  stats: PublicStats(
    epreuvesValidees: 0,
    etablissements: 0,
    telechargements: 0,
    contributeurs: 0,
  ),
  classes: MetaClasses(
    college: ['6e', '5e', '4e', '3e'],
    lycee: ['2nde', '1ère', 'Tle'],
  ),
);

final _out = Platform.environment['STEPPER_SHOTS'];

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

  for (final dark in [false, true]) {
    testWidgets('inscription en 3 étapes (${dark ? 'sombre' : 'clair'})', (
      t,
    ) async {
      t.view.physicalSize = const Size(390, 900);
      t.view.devicePixelRatio = 1;
      addTearDown(t.view.reset);
      await t.pumpWidget(
        RepaintBoundary(
          key: const Key('shot'),
          child: ProviderScope(
            overrides: [metaProvider.overrideWith((ref) async => _meta)],
            child: MaterialApp(
              theme: dark ? EzoaTheme.dark : EzoaTheme.light,
              home: const RegisterScreen(),
            ),
          ),
        ),
      );
      await t.pump(const Duration(milliseconds: 600));
      await t.pump();
      final sfx = dark ? '-dark' : '';
      expect(find.text('Infos personnelles'), findsOneWidget);
      await _shot(t, 'flutter-step1$sfx');

      // Validation avant Suivant
      await t.ensureVisible(find.text('Suivant'));
      await t.tap(find.text('Suivant'));
      await t.pump(const Duration(milliseconds: 400));
      expect(find.text('Indique ton nom complet'), findsWidgets);
      await _shot(t, 'flutter-step1-errors$sfx');

      final fields = find.byType(TextField);
      await t.enterText(fields.at(0), 'Kossi Test');
      await t.enterText(fields.at(1), 'kossi@tea.test');
      await t.enterText(fields.at(2), '90112233');
      await t.ensureVisible(find.text('Suivant'));
      await t.tap(find.text('Suivant'));
      await t.pump(const Duration(milliseconds: 150));
      await _shot(t, 'flutter-transition$sfx');
      await t.pump(const Duration(milliseconds: 500));
      expect(find.text('Élève'), findsOneWidget);
      await _shot(t, 'flutter-step2$sfx');

      // Profil sans parcours → étape 3 directement
      await t.ensureVisible(find.text('Autre'));
      await t.tap(find.text('Autre'));
      await t.pump();
      await t.ensureVisible(find.text('Suivant'));
      await t.tap(find.text('Suivant'));
      await t.pump(const Duration(milliseconds: 600));
      await t.pump();
      await t.pump();
      expect(find.text('Mot de passe'), findsOneWidget);
      await t.enterText(
        find.widgetWithText(TextField, 'Mot de passe'),
        'Tea2026!secure',
      );
      await t.pump(const Duration(milliseconds: 400));
      expect(find.text('Force : Fort'), findsOneWidget);
      await _shot(t, 'flutter-step3$sfx');

      // Retour : données conservées
      await t.ensureVisible(find.text('Retour'));
      t
          .widget<EzoaButton>(find.widgetWithText(EzoaButton, 'Retour'))
          .onPressed!();
      await t.pump(const Duration(milliseconds: 600));
      await t.pump();
      await t.ensureVisible(find.text('Retour'));
      t
          .widget<EzoaButton>(find.widgetWithText(EzoaButton, 'Retour'))
          .onPressed!();
      await t.pump(const Duration(milliseconds: 600));
      await t.pump();
      await t.pump();
      expect(find.text('kossi@tea.test'), findsOneWidget);
      await _shot(t, 'flutter-back-keeps-data$sfx');
      await t.pump(const Duration(seconds: 3));
    });
  }
}
