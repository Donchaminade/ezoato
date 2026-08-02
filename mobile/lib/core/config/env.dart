import 'dart:io' show Platform;

/// Configuration API EZOA-TO.
///
/// Priorité : `--dart-define=API_URL=...` puis valeur par défaut selon plateforme.
class Env {
  static const String brandName = 'EZOA-TO';
  static const String slogan = 'Archive. Révise. Excelle.';
  static const String tagline =
      'Le passé scolaire du Togo, au service de ton avenir.';

  static const String _dartDefineUrl = String.fromEnvironment('API_URL');

  /// URL du frontend web (contact, liens reset email). Surcharge :
  /// `--dart-define=WEB_URL=https://ezoa-to.tg`
  static const String _dartDefineWebUrl = String.fromEnvironment('WEB_URL');

  /// Empreintes SHA-256 (hex, séparées par des virgules) du certificat TLS
  /// attendu en production. Exemple :
  /// `--dart-define=CERT_PINS=ab12...ef,cd34...90`
  /// Vide = pas de pinning (dev HTTP local).
  static const String _dartDefinePins = String.fromEnvironment('CERT_PINS');

  /// Empreintes normalisées (minuscules, sans `:`). Vide si pinning désactivé.
  static List<String> get certPins => _dartDefinePins
      .split(',')
      .map((p) => p.trim().toLowerCase().replaceAll(':', ''))
      .where((p) => p.isNotEmpty)
      .toList();

  /// Chemin Apache/XAMPP vers le backend PHP (sans slash final).
  static const String _apiPath = '/zovu-project/backend-php';

  /// IP LAN du PC de dev (XAMPP/Apache), joignable par un appareil physique
  /// Android sur le même Wi-Fi. Mettez à jour via `ipconfig` ou surchargez :
  /// `--dart-define=DEV_LAN_HOST=192.168.x.x`
  static const String _devLanHost = String.fromEnvironment(
    'DEV_LAN_HOST',
    defaultValue: '10.14.202.205',
  );

  /// Émulateur Android : `10.0.2.2` pointe vers localhost du PC hôte.
  static const bool _useEmulatorHost = bool.fromEnvironment(
    'USE_EMULATOR_HOST',
    defaultValue: false,
  );

  /// Page contact publique (`/contact` sur le site web).
  static String get contactUrl => '$webUrl/contact';

  static String get webUrl {
    if (_dartDefineWebUrl.isNotEmpty) {
      return _normalize(_dartDefineWebUrl);
    }
    final uri = Uri.parse(apiUrl);
    final host = uri.host;
    if (host == '10.0.2.2') return 'http://10.0.2.2:5173';
    if (host == 'localhost' || host == '127.0.0.1') {
      return 'http://localhost:5173';
    }
    return 'http://$host:5173';
  }

  static String get apiUrl {
    if (_dartDefineUrl.isNotEmpty) {
      return _normalize(_dartDefineUrl);
    }
    if (Platform.isAndroid) {
      if (_useEmulatorHost) {
        return 'http://10.0.2.2$_apiPath';
      }
      return 'http://$_devLanHost$_apiPath';
    }
    return 'http://localhost$_apiPath';
  }

  static String _normalize(String url) {
    var u = url.trim();
    while (u.endsWith('/')) {
      u = u.substring(0, u.length - 1);
    }
    return u;
  }
}
