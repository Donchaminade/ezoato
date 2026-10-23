import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  private var secureField: UITextField?
  private var captureShield: UIView?

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
          // Protection permanente : on ne la retire pas.
          result(nil)
        default:
          result(FlutterMethodNotImplemented)
        }
      }
    }

    let launched = super.application(application, didFinishLaunchingWithOptions: launchOptions)
    // Protection pour toute l'application : captures masquées (couche sécurisée)
    // et contenu flouté pendant un enregistrement / recopie d'écran ou en arrière-plan.
    DispatchQueue.main.async { [weak self] in
      self?.enableSecureScreen()
      self?.updateCaptureShield()
    }
    let nc = NotificationCenter.default
    nc.addObserver(self, selector: #selector(updateCaptureShield), name: UIScreen.capturedDidChangeNotification, object: nil)
    nc.addObserver(self, selector: #selector(showShield), name: UIApplication.willResignActiveNotification, object: nil)
    nc.addObserver(self, selector: #selector(updateCaptureShield), name: UIApplication.didBecomeActiveNotification, object: nil)
    nc.addObserver(self, selector: #selector(screenshotTaken), name: UIApplication.userDidTakeScreenshotNotification, object: nil)
    return launched
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

  @objc private func updateCaptureShield() {
    if UIScreen.main.isCaptured { showShield() } else { hideShield() }
  }

  @objc private func showShield() {
    guard captureShield == nil, let window = self.window else { return }
    let blur = UIVisualEffectView(effect: UIBlurEffect(style: .systemThickMaterial))
    blur.frame = window.bounds
    blur.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    let label = UILabel()
    label.text = "Contenu protégé — EZOA-TO"
    label.font = .boldSystemFont(ofSize: 17)
    label.textColor = UIColor(red: 0, green: 0.30, blue: 0.22, alpha: 1)
    label.translatesAutoresizingMaskIntoConstraints = false
    blur.contentView.addSubview(label)
    NSLayoutConstraint.activate([
      label.centerXAnchor.constraint(equalTo: blur.contentView.centerXAnchor),
      label.centerYAnchor.constraint(equalTo: blur.contentView.centerYAnchor),
    ])
    window.addSubview(blur)
    captureShield = blur
  }

  private func hideShield() {
    captureShield?.removeFromSuperview()
    captureShield = nil
  }

  @objc private func screenshotTaken() {
    // iOS ne permet pas d'empêcher la capture : la couche sécurisée la rend noire.
    enableSecureScreen()
  }

  private func disableSecureScreen() {
    secureField?.removeFromSuperview()
    secureField = nil
  }
}
