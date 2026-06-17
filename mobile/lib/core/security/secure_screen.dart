import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Active FLAG_SECURE (Android) / couche sécurisée (iOS) pendant l'affichage
/// de contenu payant pour bloquer captures d'écran et enregistrement.
class SecureScreenScope extends StatefulWidget {
  const SecureScreenScope({super.key, required this.child});

  final Widget child;

  static const _channel = MethodChannel('com.ezoa.to/secure_screen');

  static Future<void> enable() async {
    try {
      await _channel.invokeMethod<void>('enable');
    } catch (_) {}
  }

  static Future<void> disable() async {
    try {
      await _channel.invokeMethod<void>('disable');
    } catch (_) {}
  }

  @override
  State<SecureScreenScope> createState() => _SecureScreenScopeState();
}

class _SecureScreenScopeState extends State<SecureScreenScope> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      SecureScreenScope.enable();
    });
  }

  @override
  void dispose() {
    SecureScreenScope.disable();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
