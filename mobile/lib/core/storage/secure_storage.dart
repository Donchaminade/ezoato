import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../shared/models/models.dart';
import 'offline_credentials.dart';

const _tokenKey = 'ezoa_jwt_token';
const _themeModeKey = 'ezoa_theme_mode';
const _onboardingCompletedKey = 'ezoa_onboarding_completed';
const _cachedUserKey = 'ezoa_cached_user';
const _offlineSessionKey = 'ezoa_offline_session_active';
const _credVerifiersKey = 'ezoa_offline_cred_verifiers';

class SecureStorageService {
  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  Future<String?> getToken() => _storage.read(key: _tokenKey);

  Future<void> setToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  Future<void> clearToken() => _storage.delete(key: _tokenKey);

  /// Préférence d'apparence : `'dark'` ou `'light'`.
  Future<String?> getThemeMode() => _storage.read(key: _themeModeKey);

  Future<void> setThemeMode(String mode) =>
      _storage.write(key: _themeModeKey, value: mode);

  Future<bool> isOnboardingCompleted() async {
    final value = await _storage.read(key: _onboardingCompletedKey);
    return value == 'true';
  }

  Future<void> setOnboardingCompleted(bool completed) => _storage.write(
        key: _onboardingCompletedKey,
        value: completed ? 'true' : 'false',
      );

  // ── Cache profil + session hors ligne ─────────────────────────────

  Future<User?> getCachedUser() async {
    final raw = await _storage.read(key: _cachedUserKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      return User.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> setCachedUser(User user) => _storage.write(
        key: _cachedUserKey,
        value: jsonEncode(user.toJson()),
      );

  Future<void> clearCachedUser() => _storage.delete(key: _cachedUserKey);

  /// Session locale active (après login hors ligne, sans JWT API).
  Future<bool> isOfflineSessionActive() async {
    final value = await _storage.read(key: _offlineSessionKey);
    return value == 'true';
  }

  Future<void> setOfflineSessionActive(bool active) => _storage.write(
        key: _offlineSessionKey,
        value: active ? 'true' : 'false',
      );

  Future<void> clearOfflineSession() => _storage.delete(key: _offlineSessionKey);

  // ── Vérificateurs de credentials (jamais le mot de passe) ─────────

  Future<List<OfflineCredentialEntry>> _readCredentialEntries() async {
    final raw = await _storage.read(key: _credVerifiersKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final list = map['entries'] as List<dynamic>? ?? [];
      return list
          .map(
            (e) => OfflineCredentialEntry.fromJson(e as Map<String, dynamic>),
          )
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _writeCredentialEntries(List<OfflineCredentialEntry> entries) {
    return _storage.write(
      key: _credVerifiersKey,
      value: jsonEncode({
        'entries': entries.map((e) => e.toJson()).toList(),
      }),
    );
  }

  /// Enregistre / met à jour le vérificateur pour un compte (multi-identifiants).
  Future<void> saveOfflineCredential({
    required String userId,
    required List<String> identifiers,
    required String password,
  }) async {
    final normalized = identifiers
        .map(normalizeAuthIdentifier)
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList();
    if (normalized.isEmpty) return;

    final verifier = OfflinePasswordVerifier.create(password);
    final entries = await _readCredentialEntries();
    entries.removeWhere(
      (e) =>
          e.userId == userId ||
          e.identifiers.any((id) => normalized.contains(id)),
    );
    entries.add(
      OfflineCredentialEntry(
        userId: userId,
        identifiers: normalized,
        verifier: verifier,
      ),
    );
    await _writeCredentialEntries(entries);
  }

  Future<OfflineCredentialEntry?> findOfflineCredential(String identifier) async {
    final needle = normalizeAuthIdentifier(identifier);
    if (needle.isEmpty) return null;
    final entries = await _readCredentialEntries();
    for (final entry in entries) {
      if (entry.identifiers.contains(needle)) return entry;
    }
    return null;
  }

  /// Déconnexion API : retire le JWT et la session locale active.
  /// Conserve cache profil + vérificateurs + téléchargements hors ligne.
  Future<void> clearApiSession() async {
    await clearToken();
    await clearOfflineSession();
  }

  Future<void> clearAll() => _storage.deleteAll();
}

final secureStorageProvider = Provider<SecureStorageService>(
  (ref) => SecureStorageService(),
);
