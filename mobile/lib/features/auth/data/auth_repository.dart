import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/connectivity_service.dart';
import '../../../core/storage/offline_credentials.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';

class MobileAccessDeniedException implements Exception {
  MobileAccessDeniedException([this.message = kMobileAccessDeniedMessage]);
  final String message;

  @override
  String toString() => message;
}

/// Échec de connexion hors ligne (identifiants / pas de session locale).
class OfflineAuthException implements Exception {
  OfflineAuthException(this.message);
  final String message;

  @override
  String toString() => message;
}

class AuthState {
  const AuthState({
    this.user,
    this.isLoading = true,
    this.isAuthenticated = false,
    this.accessDeniedMessage,
    this.isOfflineOnly = false,
  });

  final User? user;
  final bool isLoading;
  final bool isAuthenticated;
  final String? accessDeniedMessage;

  /// Session locale sans JWT valide (re-login hors ligne).
  final bool isOfflineOnly;

  AuthState copyWith({
    User? user,
    bool? isLoading,
    bool? isAuthenticated,
    String? accessDeniedMessage,
    bool? isOfflineOnly,
    bool clearAccessDeniedMessage = false,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      accessDeniedMessage: clearAccessDeniedMessage
          ? null
          : (accessDeniedMessage ?? this.accessDeniedMessage),
      isOfflineOnly: isOfflineOnly ?? this.isOfflineOnly,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._api, this._storage) : super(const AuthState()) {
    _bootstrap();
  }

  final ApiClient _api;
  final SecureStorageService _storage;

  Future<bool> _hasNetwork() async {
    final results = await Connectivity().checkConnectivity();
    return results.any((r) => r != ConnectivityResult.none);
  }

  Future<void> _bootstrap() async {
    try {
      final token = await _storage.getToken();
      final cached = await _storage.getCachedUser();
      final offlineSession = await _storage.isOfflineSessionActive();
      final online = await _hasNetwork();

      final hasToken = token != null && token.isNotEmpty;

      if (!hasToken) {
        if (offlineSession && cached != null) {
          if (isMobileAccessDeniedRole(cached.role)) {
            await _rejectMobileAccess();
            return;
          }
          state = AuthState(
            user: cached,
            isLoading: false,
            isAuthenticated: true,
            isOfflineOnly: true,
          );
          return;
        }
        state = const AuthState(isLoading: false, isAuthenticated: false);
        return;
      }

      if (!online) {
        await _enterCachedSession(cached, offlineOnly: true);
        return;
      }

      try {
        final user = await _api.me();
        if (user == null) {
          await _storage.clearApiSession();
          state = const AuthState(isLoading: false, isAuthenticated: false);
          return;
        }
        if (isMobileAccessDeniedRole(user.role)) {
          await _rejectMobileAccess();
          return;
        }
        await _storage.setCachedUser(user);
        await _storage.setOfflineSessionActive(false);
        state = AuthState(
          user: user,
          isLoading: false,
          isAuthenticated: true,
        );
      } on ApiException catch (e) {
        if (e.isUnauthorized) {
          await _storage.clearApiSession();
          state = const AuthState(isLoading: false, isAuthenticated: false);
          return;
        }
        // Réseau / serveur indisponible malgré connectivity : cache local.
        await _enterCachedSession(cached, offlineOnly: true);
      } catch (_) {
        await _enterCachedSession(cached, offlineOnly: true);
      }
    } catch (_) {
      state = const AuthState(isLoading: false, isAuthenticated: false);
    }
  }

  Future<void> _enterCachedSession(User? cached, {required bool offlineOnly}) async {
    if (cached == null) {
      // Token présent mais aucun profil local : pas d'entrée hors ligne.
      if (offlineOnly) {
        state = const AuthState(isLoading: false, isAuthenticated: false);
        return;
      }
      state = const AuthState(isLoading: false, isAuthenticated: false);
      return;
    }
    if (isMobileAccessDeniedRole(cached.role)) {
      await _rejectMobileAccess();
      return;
    }
    state = AuthState(
      user: cached,
      isLoading: false,
      isAuthenticated: true,
      isOfflineOnly: offlineOnly,
    );
  }

  Future<void> _rejectMobileAccess() async {
    await _storage.clearApiSession();
    // Ne pas effacer les vérificateurs / cache d'un autre compte utilisateur.
    state = const AuthState(
      isLoading: false,
      isAuthenticated: false,
      accessDeniedMessage: kMobileAccessDeniedMessage,
    );
  }

  Future<void> _persistLocalAuth({
    required User user,
    required String password,
    String? loginIdentifier,
  }) async {
    await _storage.setCachedUser(user);
    await _storage.saveOfflineCredential(
      userId: user.id,
      identifiers: collectAuthIdentifiers(
        email: user.email,
        telephone: user.telephone,
        loginIdentifier: loginIdentifier,
      ),
      password: password,
    );
  }

  Future<void> _completeAuth({
    required String token,
    required User user,
    required String password,
    String? loginIdentifier,
  }) async {
    if (isMobileAccessDeniedRole(user.role)) {
      await _rejectMobileAccess();
      throw MobileAccessDeniedException();
    }
    await _storage.setToken(token);
    await _storage.setOfflineSessionActive(false);
    await _persistLocalAuth(
      user: user,
      password: password,
      loginIdentifier: loginIdentifier,
    );
    state = AuthState(
      user: user,
      isLoading: false,
      isAuthenticated: true,
    );
  }

  Future<void> _loginOffline(String identifier, String password) async {
    final entry = await _storage.findOfflineCredential(identifier);
    if (entry == null) {
      throw OfflineAuthException(
        'Aucune session locale — connectez-vous en ligne une première fois',
      );
    }
    if (!entry.verifier.matches(password)) {
      throw OfflineAuthException('Identifiants incorrects');
    }
    final cached = await _storage.getCachedUser();
    if (cached == null || cached.id != entry.userId) {
      throw OfflineAuthException(
        'Aucune session locale — connectez-vous en ligne une première fois',
      );
    }
    if (isMobileAccessDeniedRole(cached.role)) {
      await _rejectMobileAccess();
      throw MobileAccessDeniedException();
    }
    await _storage.setOfflineSessionActive(true);
    state = AuthState(
      user: cached,
      isLoading: false,
      isAuthenticated: true,
      isOfflineOnly: true,
    );
  }

  Future<void> login(String identifier, String password) async {
    final online = await _hasNetwork();
    if (!online) {
      await _loginOffline(identifier, password);
      return;
    }

    try {
      final result = await _api.login(identifier, password);
      await _completeAuth(
        token: result.token,
        user: result.user,
        password: password,
        loginIdentifier: identifier,
      );
    } on ApiException catch (e) {
      if (e.isNetworkError) {
        await _loginOffline(identifier, password);
        return;
      }
      rethrow;
    }
  }

  Future<void> register({
    required String nom,
    required String email,
    required String telephone,
    required String password,
    required String profilType,
    String? classe,
    String? etablissement,
  }) async {
    final result = await _api.register(
      nom: nom,
      email: email,
      telephone: telephone,
      password: password,
      profilType: profilType,
      classe: classe,
      etablissement: etablissement,
    );
    await _completeAuth(
      token: result.token,
      user: result.user,
      password: password,
      loginIdentifier: email,
    );
  }

  void clearAccessDeniedMessage() {
    if (state.accessDeniedMessage != null) {
      state = state.copyWith(clearAccessDeniedMessage: true);
    }
  }

  /// Déconnexion API : conserve vérificateur + cache profil + téléchargements.
  Future<void> logout() async {
    await _storage.clearApiSession();
    state = const AuthState(isLoading: false, isAuthenticated: false);
  }

  /// Au retour du réseau : rafraîchir via `me()` ; 401 → session API effacée.
  Future<void> onConnectivityRestored() async {
    if (!state.isAuthenticated) return;

    final token = await _storage.getToken();
    if (token == null || token.isEmpty) {
      // Session purement locale : rester sur les téléchargements hors ligne.
      return;
    }

    try {
      final user = await _api.me();
      if (user == null) {
        await _storage.clearApiSession();
        state = const AuthState(isLoading: false, isAuthenticated: false);
        return;
      }
      if (isMobileAccessDeniedRole(user.role)) {
        await _rejectMobileAccess();
        return;
      }
      await _storage.setCachedUser(user);
      await _storage.setOfflineSessionActive(false);
      state = AuthState(
        user: user,
        isLoading: false,
        isAuthenticated: true,
      );
    } on ApiException catch (e) {
      if (e.isUnauthorized) {
        await _storage.clearApiSession();
        state = const AuthState(isLoading: false, isAuthenticated: false);
      }
      // Sinon conserver la session cache (réseau encore fragile).
    } catch (_) {
      // Conserver la session locale.
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final notifier = AuthNotifier(
    ref.watch(apiClientProvider),
    ref.watch(secureStorageProvider),
  );

  ref.listen<AsyncValue<bool>>(connectivityProvider, (prev, next) {
    final wasOffline = prev?.asData?.value == false;
    final isOnline = next.asData?.value == true;
    if (wasOffline && isOnline) {
      notifier.onConnectivityRestored();
    }
  });

  return notifier;
});
