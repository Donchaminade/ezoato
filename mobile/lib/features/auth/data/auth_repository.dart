import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';

class MobileAccessDeniedException implements Exception {
  MobileAccessDeniedException([this.message = kMobileAccessDeniedMessage]);
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
  });

  final User? user;
  final bool isLoading;
  final bool isAuthenticated;
  final String? accessDeniedMessage;

  AuthState copyWith({
    User? user,
    bool? isLoading,
    bool? isAuthenticated,
    String? accessDeniedMessage,
    bool clearAccessDeniedMessage = false,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      accessDeniedMessage: clearAccessDeniedMessage
          ? null
          : (accessDeniedMessage ?? this.accessDeniedMessage),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._api, this._storage) : super(const AuthState()) {
    _bootstrap();
  }

  final ApiClient _api;
  final SecureStorageService _storage;

  Future<void> _bootstrap() async {
    try {
      final token = await _storage.getToken();
      if (token == null || token.isEmpty) {
        state = const AuthState(isLoading: false, isAuthenticated: false);
        return;
      }
      final user = await _api.me();
      if (user == null) {
        await _storage.clearToken();
        state = const AuthState(isLoading: false, isAuthenticated: false);
        return;
      }
      if (isMobileAccessDeniedRole(user.role)) {
        await _rejectMobileAccess();
        return;
      }
      state = AuthState(user: user, isLoading: false, isAuthenticated: true);
    } catch (_) {
      state = const AuthState(isLoading: false, isAuthenticated: false);
    }
  }

  Future<void> _rejectMobileAccess() async {
    await _storage.clearToken();
    state = const AuthState(
      isLoading: false,
      isAuthenticated: false,
      accessDeniedMessage: kMobileAccessDeniedMessage,
    );
  }

  Future<void> _completeAuth({required String token, required User user}) async {
    if (isMobileAccessDeniedRole(user.role)) {
      await _rejectMobileAccess();
      throw MobileAccessDeniedException();
    }
    await _storage.setToken(token);
    state = AuthState(
      user: user,
      isLoading: false,
      isAuthenticated: true,
    );
  }

  Future<void> login(String identifier, String password) async {
    final result = await _api.login(identifier, password);
    await _completeAuth(token: result.token, user: result.user);
  }

  Future<void> register({
    required String nom,
    required String email,
    required String telephone,
    required String password,
  }) async {
    final result = await _api.register(
      nom: nom,
      email: email,
      telephone: telephone,
      password: password,
    );
    await _completeAuth(token: result.token, user: result.user);
  }

  void clearAccessDeniedMessage() {
    if (state.accessDeniedMessage != null) {
      state = state.copyWith(clearAccessDeniedMessage: true);
    }
  }

  Future<void> logout() async {
    await _storage.clearToken();
    state = const AuthState(isLoading: false, isAuthenticated: false);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(apiClientProvider),
    ref.watch(secureStorageProvider),
  );
});
