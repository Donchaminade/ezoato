import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "10.0.2.2"]);

/**
 * Réécrit une URL média (thumbnail, PDF…) pour utiliser le même hôte que
 * `VITE_API_URL` — évite les `localhost` renvoyés par l'API en accès LAN.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  if (!apiBase) return trimmed;

  try {
    const api = new URL(apiBase);
    const media = new URL(trimmed, apiBase);
    if (!LOOPBACK_HOSTS.has(media.hostname.toLowerCase())) {
      return media.toString();
    }
    media.protocol = api.protocol;
    media.hostname = api.hostname;
    media.port = api.port;
    return media.toString();
  } catch {
    return trimmed;
  }
}
