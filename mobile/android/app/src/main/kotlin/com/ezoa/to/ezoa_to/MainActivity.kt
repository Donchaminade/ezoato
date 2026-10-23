package com.ezoa.to.ezoa_to

import android.os.Bundle
import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

/**
 * FLAG_SECURE est posé pour toute l'application : captures d'écran,
 * enregistrement d'écran et aperçu dans les applis récentes sont bloqués.
 */
class MainActivity : FlutterActivity() {
    private fun secure() {
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        secure()
        super.onCreate(savedInstanceState)
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.ezoa.to/secure_screen")
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    // La protection reste active partout : "disable" ne la retire plus.
                    "enable", "disable" -> {
                        secure()
                        result.success(null)
                    }
                    else -> result.notImplemented()
                }
            }
    }
}
