import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Les écrans utilisent DateFormat(..., 'fr_FR') : sans cette initialisation,
  // intl lève une LocaleDataException au premier rendu (écran rouge).
  await initializeDateFormatting('fr_FR');
  runApp(const ProviderScope(child: EzoaApp()));
}
