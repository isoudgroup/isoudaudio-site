// Approved legacy-page cleanup, 2026-10-24. Historical articles stay at their existing URLs.
export const legacyRedirects = {
  '/fr/a-propos-isoud/': '/fr/',
  '/fr/controle-qualite/': '/fr/usine-fabrication-ecouteurs/',
  '/fr/produits/ecouteurs-tws/': '/fr/produits/',
  '/fr/produits/ecouteurs-open-ear/': '/fr/produits/',
  '/fr/rss/': '/fr/actualites/'
};
// No currently verified AI translator product replaces this obsolete category.
// Omit its HTML so Cloudflare Pages serves the real custom 404, never the home page.
export const retiredPages = ['/fr/produits/ecouteurs-traducteurs-ia/'];
export function currentHref(href) {
  const match = href.match(/^(?:https:\/\/isoudaudio\.com)?(\/[^?#]*)(.*)$/);
  if (!match) return href;
  const route = match[1].replace(/index\.html$/, '');
  const normalized = route.endsWith('/') ? route : route + '/';
  const target = legacyRedirects[normalized] || (retiredPages.includes(normalized) ? '/fr/produits/' : null);
  return target ? target + match[2] : href;
}
