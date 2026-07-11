import { useEffect } from 'react';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '../lib/seo';

interface UseSEOOptions {
  title: string;
  description: string;
  /** Route path, e.g. '/' or '/collections/japan' — used for canonical + og:url */
  path: string;
  image?: string;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLinkTag(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Updates document title + meta/OG/Twitter tags + canonical link for the
 * current route. This is a client-rendered SPA (no SSR/prerendering), so
 * these updates help the browser tab, and search engines that execute JS
 * (Google does) — but link-preview crawlers that don't run JS (e.g. most
 * chat apps, some social platforms) will only ever see index.html's static
 * defaults. If per-page social preview cards become important, that needs
 * prerendering, not just this hook.
 */
export function useSEO({ title, description, path, image = DEFAULT_OG_IMAGE }: UseSEOOptions) {
  useEffect(() => {
    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:url', `${SITE_URL}${path}`);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);
    setLinkTag('canonical', `${SITE_URL}${path}`);
  }, [title, description, path, image]);
}
