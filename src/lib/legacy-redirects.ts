/** Anciens libellés « annales » : les URL actuelles (/docs, /epreuves) restent. */
export const LEGACY_REDIRECTS: Record<string, string> = {
  "/annales": "/docs",
  "/annale": "/docs",
};

export function legacyRedirectTarget(pathname: string): string | null {
  let path = pathname.split("?")[0] || "/";
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return LEGACY_REDIRECTS[path] ?? null;
}
