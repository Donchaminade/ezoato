import { useCallback, useEffect, useState } from "react";
import {
  type BeforeInstallPromptEvent,
  dismissInstallPrompt,
  isAndroidDevice,
  isInstallDismissed,
  isStandalonePwa,
} from "@/lib/pwa-install";

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAndroidDevice() || isStandalonePwa() || isInstallDismissed()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);

    const timer = window.setTimeout(() => {
      if (!isStandalonePwa() && !isInstallDismissed()) setVisible(true);
    }, 4000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.clearTimeout(timer);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    setInstalling(true);
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
        setDeferred(null);
        return true;
      }
      return false;
    } finally {
      setInstalling(false);
    }
  }, [deferred]);

  const dismiss = useCallback(() => {
    dismissInstallPrompt();
    setVisible(false);
  }, []);

  return {
    visible,
    canNativeInstall: !!deferred,
    installing,
    install,
    dismiss,
    isAndroid: isAndroidDevice(),
    isStandalone: isStandalonePwa(),
  };
}
