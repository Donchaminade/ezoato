import 'package:flutter_test/flutter_test.dart';

import 'package:ezoa_to/core/storage/offline_credentials.dart';

void main() {
  group('OfflinePasswordVerifier', () {
    test('ne stocke pas le mot de passe en clair', () {
      const password = 'Secret-Togo-42!';
      final verifier = OfflinePasswordVerifier.create(password);
      expect(verifier.saltHex, isNot(contains(password)));
      expect(verifier.hashHex, isNot(contains(password)));
      expect(verifier.toJson().values, isNot(contains(password)));
    });

    test('accepte le bon mot de passe', () {
      const password = 'MonMotDePasse';
      final verifier = OfflinePasswordVerifier.create(password);
      expect(verifier.matches(password), isTrue);
      expect(verifier.matches('autre'), isFalse);
    });

    test('sel différent à chaque création', () {
      final a = OfflinePasswordVerifier.create('same');
      final b = OfflinePasswordVerifier.create('same');
      expect(a.saltHex, isNot(equals(b.saltHex)));
      expect(a.hashHex, isNot(equals(b.hashHex)));
    });

    test('round-trip JSON', () {
      final original = OfflinePasswordVerifier.create('abc');
      final restored = OfflinePasswordVerifier.fromJson(original.toJson());
      expect(restored.matches('abc'), isTrue);
      expect(restored.saltHex, original.saltHex);
      expect(restored.hashHex, original.hashHex);
    });
  });

  group('normalizeAuthIdentifier', () {
    test('normalise email en minuscules', () {
      expect(normalizeAuthIdentifier('  User@Example.COM '), 'user@example.com');
    });

    test('normalise téléphone en chiffres', () {
      expect(normalizeAuthIdentifier('+228 90 12 34 56'), '22890123456');
    });
  });
}
