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
  if (navSrc) {
    navSrc.className = 'footer-nav';
    // Mark the section the current page belongs to (source underlines it):
    // longest path-prefix match, so /us/en/adventures/<slug> marks "Adventures".
    // The site root is skipped so it never matches every page.
    const currentPath = window.location.pathname.replace(/\.html$/, '');
    let best = null;
    let bestLen = 0;
    navSrc.querySelectorAll('li a').forEach((a) => {
      const linkPath = new URL(a.href, window.location.origin).pathname.replace(/\.html$/, '');
      if (linkPath === '/' || /\/us\/en\/?$/.test(linkPath)) return;
      if ((currentPath === linkPath || currentPath.startsWith(`${linkPath}/`))
        && linkPath.length > bestLen) {
        best = a;
        bestLen = linkPath.length;
      }
    });
    if (best) best.closest('li').classList.add('footer-active');
    footer.append(navSrc);
  }

  if (socialSrc) {
    socialSrc.className = 'footer-social';
    decorateSocialLinks(socialSrc);
    footer.append(socialSrc);
  }

  if (legalSrc) { legalSrc.className = 'footer-legal'; footer.append(legalSrc); }

  block.append(footer);
}
