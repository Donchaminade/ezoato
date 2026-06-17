import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _tokenKey = 'ezoa_jwt_token';
const _themeModeKey = 'ezoa_theme_mode';
const _onboardingCompletedKey = 'ezoa_onboarding_completed';

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

  Future<void> clearAll() => _storage.deleteAll();
}

final secureStorageProvider = Provider<SecureStorageService>(
  (ref) => SecureStorageService(),
);
