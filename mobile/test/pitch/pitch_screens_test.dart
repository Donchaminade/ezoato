// Tests des écrans de démo (pitch) + captures PNG (CAPTURE_DIR).
import 'dart:io';
import 'dart:ui' as ui;

import 'package:ezoa_to/features/pitch/pitch_app.dart';
import 'package:ezoa_to/features/pitch/pitch_data.dart';
import 'package:ezoa_to/features/pitch/pitch_money.dart';
import 'package:ezoa_to/features/pitch/pitch_study.dart';
import 'package:ezoa_to/features/pitch/pitch_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

final _out = Platform.environment['CAPTURE_DIR'];

Future<void> _loadFonts() async {
  Future<void> load(String family, String path) async {
    final f = File(path);
    if (!f.existsSync()) return;
    final l = FontLoader(family)..addFont(Future.value(ByteData.view(f.readAsBytesSync().buffer)));
    await l.load();
  }

  await load('Inter', 'assets/fonts/Inter.ttf');
  await load('SpaceGrotesk', 'assets/fonts/SpaceGrotesk.ttf');
  final root = Platform.environment['FLUTTER_ROOT'] ?? '';
  await load('MaterialIcons', '$root/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf');
}

final _key = GlobalKey();

Widget _wrap(Widget child, Brightness b) => ProviderScope(
      child: RepaintBoundary(
        key: _key,
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: ThemeData(brightness: b, fontFamily: PK.fontBody, useMaterial3: true),
          home: child,
        ),
      ),
    );

Future<void> _shot(WidgetTester t, String name) async {
  if (_out == null) return;
  await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 300)));
  await t.pump(const Duration(milliseconds: 50));
  await t.pump(const Duration(milliseconds: 50));
  await t.runAsync(() async {
    final ro = _key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
    final img = await ro.toImage(pixelRatio: 2);
    final bytes = await img.toByteData(format: ui.ImageByteFormat.png);
    File('$_out/$name.png').writeAsBytesSync(bytes!.buffer.asUint8List());
  });
}

void main() {
  setUpAll(_loadFonts);

  final screens = <String, Widget Function()>{
    '01-onboarding': () => const PitchOnboarding(),
    '02-accueil': () => const PitchShell(),
    '03-recherche-bepc': () => const SearchScreen(initialExam: 'BEPC'),
    '04-epreuve-hors-ligne': () => SubjectScreen(subject: subjects.first),
    '05-hors-ligne': () => const OfflineScreen(),
    '06-tuteur-ia': () => TutorScreen(subject: subjects.first),
    '07-contribuer': () => const Scaffold(body: PKBackground(child: ContributeScreen())),
    '08-pro-paywall': () => const PaywallScreen(),
    '09-paiement': () => const CheckoutScreen(title: 'Abonnement Pro', item: 'EZOA-TO Pro · Mensuel', amount: 1000),
    '10-retrait-mobile-money': () => const PayoutScreen(),
    '11-profil': () => const Scaffold(body: PKBackground(child: PitchProfile())),
  };

  for (final b in Brightness.values) {
    final mode = b == Brightness.dark ? 'sombre' : 'clair';
    for (final e in screens.entries) {
      testWidgets('${e.key} ($mode) s\'affiche sans débordement', (t) async {
        for (final w in [360.0, 390.0]) {
          t.view.physicalSize = Size(w * 2, 844 * 2);
          t.view.devicePixelRatio = 2;
          await t.pumpWidget(_wrap(e.value(), b));
          await t.pump(const Duration(seconds: 3));
          expect(t.takeException(), isNull);
          if (w == 390) await _shot(t, '${e.key}-$mode');
        }
        addTearDown(t.view.reset);
        await t.pumpWidget(const SizedBox());
    await t.pump(const Duration(seconds: 5));
      });
    }
  }

  testWidgets('Tuteur : guide sans donner la réponse', (t) async {
    t.view.physicalSize = const Size(780, 1688);
    t.view.devicePixelRatio = 2;
    await t.pumpWidget(_wrap(TutorScreen(subject: subjects.first), Brightness.light));
    await t.pump(const Duration(seconds: 1));
    await t.tap(find.byIcon(Icons.arrow_upward_rounded));
    await t.pump(const Duration(seconds: 2));
    expect(find.textContaining('facteur commun', findRichText: true), findsNothing);
    expect(find.textContaining('ensemble', findRichText: true), findsOneWidget);
    await t.tap(find.byIcon(Icons.arrow_upward_rounded));
    await t.pump(const Duration(seconds: 2));
    expect(find.textContaining('facteur commun', findRichText: true), findsOneWidget);
    await t.pump(const Duration(milliseconds: 700));
    await _shot(t, '06b-tuteur-conversation-clair');
    await t.pumpWidget(const SizedBox());
    await t.pump(const Duration(seconds: 5));
  });

  testWidgets('Paiement : formulaire → anneaux → succès', (t) async {
    t.view.physicalSize = const Size(780, 1688);
    t.view.devicePixelRatio = 2;
    await t.pumpWidget(_wrap(const CheckoutScreen(title: 'Abonnement Pro', item: 'EZOA-TO Pro · Mensuel', amount: 1000), Brightness.dark));
    await t.pump(const Duration(seconds: 1));
    await t.tap(find.textContaining('Payer 1'));
    await t.pump(const Duration(milliseconds: 1200));
    expect(find.textContaining('%'), findsOneWidget);
    await t.pump(const Duration(milliseconds: 700));
    await _shot(t, '09b-paiement-anneaux');
    await t.pump(const Duration(seconds: 3));
    expect(find.text('Paiement réussi'), findsOneWidget);
    await t.pump(const Duration(milliseconds: 700));
    await _shot(t, '09c-paiement-reussi');
    await t.pumpWidget(const SizedBox());
    await t.pump(const Duration(seconds: 5));
  });

  testWidgets('Recherche : filtres par examen et niveau', (t) async {
    t.view.physicalSize = const Size(780, 1688);
    t.view.devicePixelRatio = 2;
    await t.pumpWidget(_wrap(const SearchScreen(), Brightness.light));
    await t.pump(const Duration(seconds: 1));
    expect(find.text('${subjects.length} épreuves trouvées'), findsOneWidget);
    debugPrint('LYCEE ${t.getCenter(find.text('Lycée'))} ${t.getSize(find.text('Lycée'))}');
    await t.ensureVisible(find.text('Lycée'));
    await t.pump(const Duration(seconds: 1));
    await t.tap(find.text('Lycée'));
    await t.pump(const Duration(seconds: 1));
    debugPrint(find.textContaining('trouvée').evaluate().map((e) => (e.widget as Text).data).join('|'));
    await t.pump(const Duration(seconds: 1));
    expect(find.text('2 épreuves trouvées'), findsOneWidget);
    await t.pumpWidget(const SizedBox());
    await t.pump(const Duration(seconds: 5));
  });
}
