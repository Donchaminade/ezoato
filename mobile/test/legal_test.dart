import 'package:ezoa_to/features/legal/legal_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('hub légal liste les 6 documents et ouvre la confidentialité', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: LegalHubScreen()));
    await tester.pumpAndSettle();
    for (final s in ['cgu', 'confidentialite', 'mentions-legales', 'conditions-de-vente', 'charte-contributeurs']) {
      expect(find.byKey(Key('legal-$s')), findsOneWidget);
    }
    await tester.tap(find.byKey(const Key('legal-confidentialite')));
    await tester.pumpAndSettle();
    expect(find.textContaining('2019-014'), findsWidgets);
    expect(find.textContaining('Dernière mise à jour : 23 octobre 2026'), findsOneWidget);
  });

  testWidgets('mentions légales : éditeur centralisé substitué', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: LegalDocScreen(slug: 'mentions-legales')));
    await tester.pumpAndSettle();
    expect(find.textContaining('Chaminade Dondah ADJOLOU'), findsWidgets);
    expect(find.textContaining('PAYFLEX'), findsOneWidget);
    expect(find.textContaining('{'), findsNothing);
  });
}
