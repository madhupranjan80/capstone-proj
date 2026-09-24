import { decorateSocialLinks } from '../../scripts/social-icons.js';

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
    decorateSocialLinks(socialSrc);
    footer.append(socialSrc);
  }

  if (legalSrc) { legalSrc.className = 'footer-legal'; footer.append(legalSrc); }

  block.append(footer);
}
