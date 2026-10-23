/**
 * Enregistrement contrôlé du service worker EZOA-TO.
 * - Jamais en dev / preview Vercel / iframe
 * - Kill-switch via ?sw=off
 */
export async function registerEzoaSW() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  const host = window.location.hostname;
  const isPreview =
    host.endsWith(".vercel.app") && host !== "ezoato.vercel.app";
  const inIframe = window.self !== window.top;
  const killed = url.searchParams.get("sw") === "off";

  if (!import.meta.env.PROD || isPreview || inIframe || killed) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        if (r.active?.scriptURL?.endsWith("/sw.js")) await r.unregister();
      }
    } catch {}
    return;
  }

  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (e) {
    console.warn("[tea] SW register failed", e);
  }
}
