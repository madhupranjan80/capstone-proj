// Inline SVG glyphs for the social icons (source uses a custom icon font).
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 5.9c-.7.32-1.5.53-2.3.63a4 4 0 0 0 1.77-2.22c-.78.46-1.64.8-2.56.98a4 4 0 0 0-6.82 3.65 11.36 11.36 0 0 1-8.25-4.18 4 4 0 0 0 1.24 5.34c-.65-.02-1.26-.2-1.8-.5v.05a4 4 0 0 0 3.2 3.92c-.6.16-1.22.18-1.82.07a4 4 0 0 0 3.74 2.78 8 8 0 0 1-5.9 1.65 11.32 11.32 0 0 0 6.13 1.8c7.35 0 11.37-6.09 11.37-11.37v-.52A8.1 8.1 0 0 0 22 5.9Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.94c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.41-.35 1.03-.4 2.17-.06 1.24-.07 1.6-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.17.22.55.47.94.88 1.35.41.41.8.66 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.6.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.6.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.17a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.17-.4-1.24-.06-1.6-.07-4.74-.07Zm0 3.3a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm0 1.94a2.66 2.66 0 1 0 0 5.32 2.66 2.66 0 0 0 0-5.32Zm5.84-.35a1.08 1.08 0 1 1-2.15 0 1.08 1.08 0 0 1 2.15 0Z"/></svg>',
};

/**
 * Fetch the footer fragment content.
 * Metadata-independent dual-fetch: /content first (localhost), then root (DA/EDS prod).
 * Returns the container plus the base path that resolved, so relative image
 * paths in the fragment can be made absolute.
 */
async function fetchFooter() {
  let base = '/content';
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) {
    base = '';
    resp = await fetch('/footer.plain.html');
  }
  if (!resp.ok) return null;
  const html = await resp.text();
  const container = document.createElement('div');
  container.innerHTML = html;
  container.dataset.footerBase = base;
  return container;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  // Resolve relative image paths against the fragment base.
  const base = fragment.dataset.footerBase || '';
  fragment.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('/')) {
      img.src = `${base}/${src}`;
    }
  });

  const footer = document.createElement('div');
  footer.className = 'footer-inner';
  const sections = [...fragment.children];
  const [brandSrc, navSrc, socialSrc, legalSrc] = sections;

  if (brandSrc) { brandSrc.className = 'footer-brand'; footer.append(brandSrc); }
  if (navSrc) { navSrc.className = 'footer-nav'; footer.append(navSrc); }

  if (socialSrc) {
    socialSrc.className = 'footer-social';
    // Replace social link text with SVG glyphs. Match on the link label first
    // (reliable: "Facebook"/"Twitter"/"Instagram") and fall back to the href,
    // since imported hrefs may point to the site root rather than the network.
    socialSrc.querySelectorAll('a').forEach((a) => {
      const label = a.textContent.trim().toLowerCase();
      const href = (a.getAttribute('href') || '').toLowerCase();
      const key = Object.keys(SOCIAL_ICONS)
        .find((k) => label.includes(k) || href.includes(k));
      if (key) {
        a.setAttribute('aria-label', a.textContent.trim());
        a.innerHTML = SOCIAL_ICONS[key];
      }
    });
    footer.append(socialSrc);
  }

  if (legalSrc) { legalSrc.className = 'footer-legal'; footer.append(legalSrc); }

  block.append(footer);
}
