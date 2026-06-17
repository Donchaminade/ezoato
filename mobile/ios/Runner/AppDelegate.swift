import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  private var secureField: UITextField?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)

    if let controller = window?.rootViewController as? FlutterViewController {
      let channel = FlutterMethodChannel(
        name: "com.ezoa.to/secure_screen",
        binaryMessenger: controller.binaryMessenger
      )
      channel.setMethodCallHandler { [weak self] call, result in
        switch call.method {
        case "enable":
          self?.enableSecureScreen()
          result(nil)
        case "disable":
          self?.disableSecureScreen()
          result(nil)
        default:
          result(FlutterMethodNotImplemented)
        }
      }
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  private func enableSecureScreen() {
    guard let window = self.window else { return }
    disableSecureScreen()
    let field = UITextField()
    field.isSecureTextEntry = true
    field.isUserInteractionEnabled = false
    window.addSubview(field)
    window.layer.superlayer?.addSublayer(field.layer)
    field.layer.sublayers?.first?.addSublayer(window.layer)
    secureField = field
  }

  private func disableSecureScreen() {
    secureField?.removeFromSuperview()
    secureField = nil
  }
}
