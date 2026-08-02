import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';

/// Vérificateur de mot de passe hors ligne (salt + SHA-256).
///
/// Jamais de mot de passe en clair : seul salt/hash est persisté
/// (via [SecureStorageService]).
class OfflinePasswordVerifier {
  const OfflinePasswordVerifier({
    required this.saltHex,
    required this.hashHex,
  });

  final String saltHex;
  final String hashHex;

  Map<String, dynamic> toJson() => {
        'salt': saltHex,
        'hash': hashHex,
      };

  factory OfflinePasswordVerifier.fromJson(Map<String, dynamic> json) {
    return OfflinePasswordVerifier(
      saltHex: json['salt'] as String,
      hashHex: json['hash'] as String,
    );
  }

  static OfflinePasswordVerifier create(String password) {
    final salt = _randomBytes(16);
    final hash = _hash(salt, password);
    return OfflinePasswordVerifier(
      saltHex: _toHex(salt),
      hashHex: _toHex(hash),
    );
  }

  bool matches(String password) {
    final salt = _fromHex(saltHex);
    final expected = _fromHex(hashHex);
    final actual = _hash(salt, password);
    return _constantTimeEquals(expected, actual);
  }

  static List<int> _hash(List<int> salt, String password) {
    final bytes = <int>[...salt, ...utf8.encode(password)];
    return sha256.convert(bytes).bytes;
  }

  static List<int> _randomBytes(int length) {
    final rng = Random.secure();
    return List<int>.generate(length, (_) => rng.nextInt(256));
  }

  static String _toHex(List<int> bytes) =>
      bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();

  static Uint8List _fromHex(String hex) {
    final out = Uint8List(hex.length ~/ 2);
    for (var i = 0; i < out.length; i++) {
      out[i] = int.parse(hex.substring(i * 2, i * 2 + 2), radix: 16);
    }
    return out;
  }

  static bool _constantTimeEquals(List<int> a, List<int> b) {
    if (a.length != b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff == 0;
  }
}

/// Entrée locale liant un compte à son vérificateur (multi-identifiants).
class OfflineCredentialEntry {
  const OfflineCredentialEntry({
    required this.userId,
    required this.identifiers,
    required this.verifier,
  });

  final String userId;
  final List<String> identifiers;
  final OfflinePasswordVerifier verifier;

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'identifiers': identifiers,
        'verifier': verifier.toJson(),
      };

  factory OfflineCredentialEntry.fromJson(Map<String, dynamic> json) {
    return OfflineCredentialEntry(
      userId: json['userId'] as String,
      identifiers: (json['identifiers'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      verifier: OfflinePasswordVerifier.fromJson(
        json['verifier'] as Map<String, dynamic>,
      ),
    );
  }
}

/// Normalise email / téléphone pour la recherche locale.
String normalizeAuthIdentifier(String raw) {
  final trimmed = raw.trim();
  if (trimmed.contains('@')) {
    return trimmed.toLowerCase();
  }
  final digits = trimmed.replaceAll(RegExp(r'\D'), '');
  return digits.isNotEmpty ? digits : trimmed.toLowerCase();
}

List<String> collectAuthIdentifiers({
  required String email,
  String? telephone,
  String? loginIdentifier,
}) {
  final ids = <String>{};
  if (email.trim().isNotEmpty) {
    ids.add(normalizeAuthIdentifier(email));
  }
  final phone = telephone?.trim();
  if (phone != null && phone.isNotEmpty) {
    ids.add(normalizeAuthIdentifier(phone));
  }
  if (loginIdentifier != null && loginIdentifier.trim().isNotEmpty) {
    ids.add(normalizeAuthIdentifier(loginIdentifier));
  }
  return ids.toList();
}
