import 'package:url_launcher/url_launcher.dart';

import '../config/env.dart';

Future<bool> openContactPage() {
  return launchUrl(
    Uri.parse(Env.contactUrl),
    mode: LaunchMode.externalApplication,
  );
}

Future<bool> openExternalUrl(String url) {
  return launchUrl(
    Uri.parse(url),
    mode: LaunchMode.externalApplication,
  );
}
