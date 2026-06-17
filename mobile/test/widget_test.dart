import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
// ignore: implementation_imports
import 'package:google_fonts/src/google_fonts_base.dart' as google_fonts_base;
import 'package:visibility_detector/visibility_detector.dart';

import 'package:ezoa_to/core/config/env.dart';
import 'package:ezoa_to/core/theme/ezoa_theme.dart';
import 'package:ezoa_to/features/account/data/wallet_providers.dart';
import 'package:ezoa_to/features/account/presentation/bibliotheque_screen.dart';
import 'package:ezoa_to/features/epreuves/presentation/home_screen.dart';
import 'package:ezoa_to/shared/models/models.dart';
import 'package:ezoa_to/shared/widgets/ezoa_widgets.dart';

/// Client HTTP qui ne répond jamais : google_fonts reste en attente au lieu
/// d'échouer (erreur async non interceptable qui ferait échouer les tests) ;
/// le rendu utilise alors la police de repli.
class _NeverCompletingHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) =>
      Completer<http.StreamedResponse>().future;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() {
    google_fonts_base.httpClient = _NeverCompletingHttpClient();
    // Évite les timers en attente du VisibilityDetector en fin de test.
    VisibilityDetectorController.instance.updateInterval = Duration.zero;
  });

  test('EZOA brand constants', () {
    expect(Env.brandName, 'EZOA-TO');
    expect(Env.slogan, 'Archive. Révise. Excelle.');
  });

  test('EZOA theme uses primary green', () {
    final theme = EzoaTheme.light;
    expect(theme.colorScheme.primary, const Color(0xFF006A4E));
  });

  testWidgets('EzoaTopBar affiche titre, sous-titre et trailing',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EzoaTheme.dark,
        home: const Scaffold(
          body: Column(
            children: [
              EzoaTopBar(
                title: 'Accueil',
                subtitle: 'Archives scolaires du Togo',
                trailing: Icon(Icons.sunny),
              ),
            ],
          ),
        ),
      ),
    );

    expect(find.text('Accueil'), findsOneWidget);
    expect(find.text('Archives scolaires du Togo'), findsOneWidget);
    expect(find.byIcon(Icons.sunny), findsOneWidget);
  });

  testWidgets(
      'StatChip s\'utilise hors Row sans erreur ParentDataWidget '
      '(EzoaGlassStat ne retourne plus d\'Expanded)', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: EzoaTheme.dark,
        home: const Scaffold(
          body: Center(
            child: SizedBox(
              width: 140,
              child: StatChip(label: 'Épreuves', value: 42),
            ),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('42'), findsOneWidget);
  });

  testWidgets('HomeWalletCard affiche solde et progression', (tester) async {
    const wallet = ContributorWallet(
      solde: 1500,
      epreuvesValidees: 12,
      paliersVerses: 2,
      prochainPalier: 15,
      progressionPalier: 2,
      epreuvesParRecompense: 5,
      montantRecompense: 500,
      minRetrait: 1000,
      peutRetirer: true,
      transactions: [],
      retraits: [],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          walletProvider.overrideWith((ref) => Future.value(wallet)),
        ],
        child: MaterialApp(
          theme: EzoaTheme.dark,
          home: const Scaffold(
            body: SingleChildScrollView(child: HomeWalletCard()),
          ),
        ),
      ),
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
    expect(find.text('Portefeuille'), findsOneWidget);
    expect(find.textContaining('FCFA'), findsWidgets);
    expect(find.textContaining('2/5'), findsOneWidget);
  });

  testWidgets('HomeWalletCard se masque en cas d\'erreur', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          walletProvider.overrideWith(
            (ref) => Future<ContributorWallet>.error(Exception('offline')),
          ),
        ],
        child: MaterialApp(
          theme: EzoaTheme.dark,
          home: const Scaffold(body: HomeWalletCard()),
        ),
      ),
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
    expect(find.text('Portefeuille'), findsNothing);
  });

  testWidgets('Bibliothèque : catalogue en grille avec sections',
      (tester) async {
    const item = LibraryItem(
      id: 'e1',
      titre: 'Mathématiques — Composition T1',
      matiere: 'Maths',
      classe: '3e',
      annee: 2024,
      type: 'composition',
      ville: 'Lomé',
      pages: 4,
      tailleKo: 240,
      source: 'achat',
    );
    const free = LibraryItem(
      id: 'e2',
      titre: 'SVT — Devoir surveillé',
      matiere: 'SVT',
      classe: 'Tle',
      annee: 2023,
      type: 'devoir',
      ville: 'Kara',
      pages: 2,
      tailleKo: 120,
      source: 'gratuit',
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          bibliothequeProvider.overrideWith(
            (ref) => Future.value(
              const UserLibrary(paid: [item], free: [free]),
            ),
          ),
        ],
        child: MaterialApp(
          theme: EzoaTheme.dark,
          home: const BibliothequeScreen(),
        ),
      ),
    );
    await tester.pump();
    // Deux cycles : un Animate (scroll reveal) créé sur la dernière frame du
    // premier settle garde un timer de délai en attente ; le pump suivant le
    // fait tirer, puis le second settle termine l'animation.
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('Achats'), findsOneWidget);
    expect(find.text('Gratuits'), findsOneWidget);
    expect(find.byType(SliverGrid), findsNWidgets(2));
    expect(find.text('Mathématiques — Composition T1'), findsOneWidget);
    expect(find.text('PAYÉ'), findsOneWidget);
    expect(find.text('GRATUIT'), findsOneWidget);
  });
}
