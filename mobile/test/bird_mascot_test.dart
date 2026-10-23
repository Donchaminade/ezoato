import 'package:ezoa_to/shared/widgets/bird_mascot.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('mascotte : cache les yeux, peek, joie, erreur', (t) async {
    final c = MascotController();
    await t.pumpWidget(MaterialApp(home: Scaffold(body: Center(child: BirdMascot(controller: c)))));
    expect(find.bySemanticsLabel('Mascotte EZOA-TO'), findsOneWidget);
    c.set(MascotMood.hide);
    await t.pump(const Duration(milliseconds: 500));
    expect(find.bySemanticsLabel('La mascotte se cache les yeux'), findsOneWidget);
    c.typing('chaminade@');
    expect(c.mood, MascotMood.watch);
    expect(c.lookX, greaterThan(-0.8));
    c.flash(MascotMood.error);
    await t.pump(const Duration(milliseconds: 1000));
    expect(c.mood, MascotMood.idle);
    c.flash(MascotMood.happy);
    expect(c.mood, MascotMood.happy);
    await t.pump(const Duration(seconds: 2));
  });
}
