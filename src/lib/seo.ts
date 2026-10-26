/** Métadonnées SEO par page : title, description, canonical absolu, Open Graph et Twitter. */
export const SITE_URL = "https://ezoato.vercel.app";
export const OG_IMAGE = `${SITE_URL}/images/students-hero.png`;

export function canonicalUrl(path: string) {
  const clean = path === "/" ? "/" : path.replace(/\/+$/, "");
  return `${SITE_URL}${clean}`;
}

export function pageHead(opts: { path: string; title: string; description: string; noindex?: boolean }) {
  const url = canonicalUrl(opts.path);
  const meta: Array<Record<string, string>> = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:url", content: url },
    { property: "og:image", content: OG_IMAGE },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
    { name: "twitter:image", content: OG_IMAGE },
  ];
  if (opts.noindex) meta.push({ name: "robots", content: "noindex, follow" });
  return { meta, links: [{ rel: "canonical", href: url }] };
}
