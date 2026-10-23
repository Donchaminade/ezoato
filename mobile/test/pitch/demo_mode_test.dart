// Mode démo : entrée depuis la connexion, badge, sortie depuis le profil.
import 'package:ezoa_to/core/demo/demo_mode.dart';
import 'package:ezoa_to/features/pitch/pitch_app.dart';
import 'package:ezoa_to/features/pitch/pitch_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('le mode démo est désactivé par défaut (backend réel)', () {
    final c = ProviderContainer();
    expect(c.read(demoModeProvider), isFalse);
  });

  testWidgets('Quitter le mode démo depuis le profil', (tester) async {
    tester.view.physicalSize = const Size(390 * 3, 1400 * 3);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    final c = ProviderContainer(overrides: [demoModeProvider.overrideWith((ref) => true)]);
    await tester.pumpWidget(UncontrolledProviderScope(
      container: c,
      child: const MaterialApp(home: Scaffold(body: Stack(children: [PitchProfile(), DemoBadge()]))),
    ));
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('Démo'), findsOneWidget);
    final exit = find.text('Quitter le mode démo');
    await tester.ensureVisible(exit);
    await tester.pump(const Duration(milliseconds: 500));
    await tester.tap(exit);
    await tester.pump();
    expect(c.read(demoModeProvider), isFalse);
  });
}
