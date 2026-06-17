import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/env.dart';
import '../storage/secure_storage.dart';
import '../../shared/models/models.dart';

class ApiException implements Exception {
  ApiException(this.message);
  final String message;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          final data = error.response?.data;
          if (data is Map && data['error'] is String) {
            handler.reject(
              DioException(
                requestOptions: error.requestOptions,
                response: error.response,
                error: ApiException(data['error'] as String),
              ),
            );
            return;
          }
          handler.next(error);
        },
      ),
    );
    _applyCertificatePinning();
  }

  final SecureStorageService _storage;
  late final Dio _dio;

  /// Cert pinning (production) : valide l'empreinte SHA-256 du certificat
  /// leaf contre `Env.certPins`. Sans pins définis, validation TLS standard.
  void _applyCertificatePinning() {
    final pins = Env.certPins;
    if (pins.isEmpty || kIsWeb) return;
    final adapter = _dio.httpClientAdapter;
    if (adapter is IOHttpClientAdapter) {
      adapter.validateCertificate = (cert, host, port) {
        if (cert == null) return false;
        final fingerprint = sha256.convert(cert.der).toString();
        return pins.contains(fingerprint);
      };
    }
  }

  Future<T> _get<T>(
    String path, {
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(path);
      final data = res.data;
      if (data == null) throw ApiException('Réponse vide');
      if (fromJson != null) return fromJson(data);
      return data as T;
    } on DioException catch (e) {
      throw _wrap(e);
    }
  }

  Future<T> _post<T>(
    String path, {
    Map<String, dynamic>? body,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(path, data: body);
      final data = res.data;
      if (data == null) throw ApiException('Réponse vide');
      if (fromJson != null) return fromJson(data);
      return data as T;
    } on DioException catch (e) {
      throw _wrap(e);
    }
  }

  /// GET d'un endpoint renvoyant un tableau JSON à la racine.
  Future<List<T>> _getList<T>(
    String path,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final res = await _dio.get<List<dynamic>>(path);
      return (res.data ?? [])
          .map((e) => fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _wrap(e);
    }
  }

  Future<void> _delete(String path) async {
    try {
      await _dio.delete(path);
    } on DioException catch (e) {
      throw _wrap(e);
    }
  }

  Exception _wrap(DioException e) {
    if (e.error is ApiException) return e.error! as ApiException;

    final data = e.response?.data;
    if (data is Map && data['error'] is String) {
      return ApiException(data['error'] as String);
    }

    final status = e.response?.statusCode;
    if (status != null) {
      return ApiException('Erreur API ($status)');
    }

    final type = e.type;
    if (type == DioExceptionType.connectionError ||
        type == DioExceptionType.connectionTimeout ||
        type == DioExceptionType.sendTimeout ||
        type == DioExceptionType.receiveTimeout) {
      if (kDebugMode) {
        return ApiException(
          'Impossible de joindre l\'API (${Env.apiUrl}). '
          'Vérifiez : Apache/XAMPP démarré, IP du PC (`ipconfig` → IPv4 Wi-Fi), '
          'même réseau Wi-Fi que l\'appareil, pare-feu Windows (port 80). '
          'Émulateur Android : flutter run '
          '--dart-define=API_URL=http://10.0.2.2/zovu-project/backend-php '
          'ou --dart-define=USE_EMULATOR_HOST=true. '
          'Appareil physique : --dart-define=DEV_LAN_HOST=<IP-LAN>',
        );
      }
      return ApiException(
        'Impossible de joindre le serveur. Vérifiez votre connexion.',
      );
    }

    if (kDebugMode && e.message != null && e.message!.isNotEmpty) {
      return ApiException('Erreur réseau : ${e.message}');
    }

    return ApiException('Erreur API');
  }

  Future<PublicMeta> getMeta() =>
      _get('/meta', fromJson: PublicMeta.fromJson);

  Future<PageResult<Epreuve>> listEpreuves([
    ListEpreuvesParams params = const ListEpreuvesParams(),
  ]) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/epreuves',
        queryParameters: params.toQuery(),
      );
      final data = res.data;
      if (data == null) throw ApiException('Réponse vide');
      return PageResult.fromJson(data, Epreuve.fromJson);
    } on DioException catch (e) {
      throw _wrap(e);
    }
  }

  Future<Epreuve?> getEpreuve(String id) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/epreuves/$id');
      final data = res.data;
      if (data == null) return null;
      return Epreuve.fromJson(data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      throw _wrap(e);
    }
  }

  Future<PaymentAccess> checkPaymentAccess(String epreuveId) =>
      _get('/paiements/acces/$epreuveId', fromJson: PaymentAccess.fromJson);

  Future<PaymentInit> initierPaiement({
    required String epreuveId,
    required String methode,
    required String telephone,
  }) =>
      _post(
        '/paiements/initier',
        body: {
          'epreuveId': epreuveId,
          'methode': methode,
          'telephone': telephone,
        },
        fromJson: PaymentInit.fromJson,
      );

  Future<bool> confirmerPaiement(String reference) async {
    final data = await _post<Map<String, dynamic>>(
      '/paiements/confirmer',
      body: {'reference': reference},
    );
    return data['hasAccess'] as bool? ?? false;
  }

  Future<SubscriptionStatus> getSubscriptionStatus() =>
      _get('/account/abonnement/status', fromJson: SubscriptionStatus.fromJson);

  Future<PaymentInit> initierAbonnement({
    required String methode,
    required String telephone,
  }) async {
    final data = await _post<Map<String, dynamic>>(
      '/account/abonnement/subscribe',
      body: {'methode': methode, 'telephone': telephone},
    );
    if (data['alreadyActive'] == true) {
      return PaymentInit(alreadyPaid: true);
    }
    return PaymentInit.fromJson(data);
  }

  Future<SubscriptionStatus> confirmerAbonnement(String reference) =>
      _post(
        '/account/abonnement/subscribe',
        body: {'reference': reference},
        fromJson: SubscriptionStatus.fromJson,
      );

  Future<String> requestRetrait({
    required int montant,
    required String methode,
    required String telephone,
  }) async {
    final data = await _post<Map<String, dynamic>>(
      '/wallet/retrait',
      body: {
        'montant': montant,
        'methode': methode,
        'telephone': telephone,
      },
    );
    return data['message'] as String? ?? 'Demande de retrait envoyée.';
  }

  /// Soumission multipart : métadonnées + un PDF **ou** une liste d'images.
  Future<SoumissionResult> submitSoumission({
    required Map<String, String> fields,
    String? pdfPath,
    List<String> imagePaths = const [],
  }) async {
    try {
      final form = FormData.fromMap({...fields});
      if (pdfPath != null) {
        form.files.add(MapEntry(
          'pdf',
          await MultipartFile.fromFile(pdfPath),
        ));
      }
      for (final path in imagePaths) {
        form.files.add(MapEntry(
          'images[]',
          await MultipartFile.fromFile(path),
        ));
      }
      final res = await _dio.post<Map<String, dynamic>>(
        '/soumissions',
        data: form,
        options: Options(
          contentType: 'multipart/form-data',
          sendTimeout: const Duration(minutes: 3),
          receiveTimeout: const Duration(minutes: 3),
        ),
      );
      final data = res.data;
      if (data == null) throw ApiException('Réponse vide');
      return SoumissionResult.fromJson(data);
    } on DioException catch (e) {
      throw _wrap(e);
    }
  }

  Future<List<int>> downloadEpreuveBytes(String epreuveId) async {
    try {
      final res = await _dio.get<List<int>>(
        '/epreuves/$epreuveId/download',
        options: Options(responseType: ResponseType.bytes),
      );
      return res.data ?? [];
    } on DioException catch (e) {
      throw _wrap(e);
    }
  }

  Future<UserLibrary> getMyLibrary() =>
      _get('/account/library', fromJson: UserLibrary.fromJson);

  Future<List<String>> getFavorisIds() async {
    final data = await _get<Map<String, dynamic>>('/account/favoris');
    return (data['ids'] as List<dynamic>? ?? []).map((e) => e as String).toList();
  }

  Future<List<Epreuve>> getFavorisEpreuves() async {
    final data = await _get<Map<String, dynamic>>('/account/favoris/list');
    return (data['items'] as List<dynamic>? ?? [])
        .map((e) => Epreuve.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> addFavori(String epreuveId) =>
      _post('/account/favoris', body: {'epreuveId': epreuveId});

  Future<void> removeFavori(String epreuveId) =>
      _delete('/account/favoris/$epreuveId');

  Future<ContributorWallet> getWallet() =>
      _get('/wallet/portefeuille', fromJson: ContributorWallet.fromJson);

  /// Liste « Mes soumissions » (`GET /account/soumissions`).
  Future<List<SoumissionHistory>> getMySoumissions() =>
      _getList('/account/soumissions', SoumissionHistory.fromJson);

  /// Détail d'une de mes soumissions (`GET /account/soumissions/{id}`).
  Future<SoumissionDetail?> getMySoumission(String id) async {
    try {
      final res =
          await _dio.get<Map<String, dynamic>>('/account/soumissions/$id');
      final data = res.data;
      if (data == null) return null;
      return SoumissionDetail.fromJson(data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      throw _wrap(e);
    }
  }

  /// Historique de mes paiements (`GET /account/paiements`).
  Future<List<PaymentHistory>> getMyPaiements() =>
      _getList('/account/paiements', PaymentHistory.fromJson);

  /// Historique de mes téléchargements (`GET /account/downloads`).
  Future<List<DownloadHistoryItem>> getMyDownloads() =>
      _getList('/account/downloads', DownloadHistoryItem.fromJson);

  Future<({UserProfile user, NotificationPreferences notifications})>
      getProfile() async {
    final data = await _get<Map<String, dynamic>>('/account/profile');
    return (
      user: UserProfile.fromJson(data['user'] as Map<String, dynamic>),
      notifications: NotificationPreferences.fromJson(
        data['notifications'] as Map<String, dynamic>,
      ),
    );
  }

  Future<UserProfile> updateProfile(Map<String, dynamic> payload) async {
    final data = await _post<Map<String, dynamic>>(
      '/account/profile',
      body: payload,
    );
    return UserProfile.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<NotificationConfig> getNotificationConfig() =>
      _get('/account/notifications', fromJson: NotificationConfig.fromJson);

  Future<NotificationPreferences> updateNotificationPreferences(
    Map<String, dynamic> prefs,
  ) async {
    final data = await _post<Map<String, dynamic>>(
      '/account/notifications',
      body: prefs,
    );
    return NotificationPreferences.fromJson(
      data['preferences'] as Map<String, dynamic>,
    );
  }

  Future<int> markNotificationsRead([List<String>? ids]) async {
    final data = await _post<Map<String, dynamic>>(
      '/account/notifications/read',
      body: ids != null ? {'ids': ids} : {},
    );
    return (data['unreadCount'] as num?)?.toInt() ?? 0;
  }

  Future<int> deleteNotification(String id) async {
    final data = await _post<Map<String, dynamic>>(
      '/account/notifications/$id/supprimer',
    );
    return (data['unreadCount'] as num?)?.toInt() ?? 0;
  }

  Future<({String token, User user})> login(
    String identifier,
    String password,
  ) async {
    final data = await _post<Map<String, dynamic>>(
      '/auth/login',
      body: {'identifier': identifier, 'password': password},
    );
    return (
      token: data['token'] as String,
      user: User.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  Future<({String token, User user})> register({
    required String nom,
    required String email,
    required String telephone,
    required String password,
    required String classe,
    required String etablissement,
  }) async {
    final data = await _post<Map<String, dynamic>>(
      '/auth/register',
      body: {
        'nom': nom,
        'email': email,
        'telephone': telephone,
        'password': password,
        'classe': classe,
        'etablissement': etablissement,
      },
    );
    return (
      token: data['token'] as String,
      user: User.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  Future<User?> me() async {
    try {
      final data = await _get<Map<String, dynamic>>('/auth/me');
      return User.fromJson(data);
    } catch (_) {
      return null;
    }
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(secureStorageProvider));
});
