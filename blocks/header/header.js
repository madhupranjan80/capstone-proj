// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch the nav fragment content.
 * Metadata-independent dual-fetch: /content first (localhost / aem up),
 * then root (DA/EDS production, fragment served at site root).
 */
async function fetchNav() {
  let base = '/content';
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) {
    base = '';
    resp = await fetch('/nav.plain.html');
  }
  if (!resp.ok) return null;
  const html = await resp.text();
  const container = document.createElement('div');
  container.innerHTML = html;
  container.dataset.navBase = base;
  return container;
}

/**
 * Toggle the mobile nav open/closed.
 */
function toggleMenu(nav, expanded) {
  const open = expanded !== undefined ? expanded : nav.getAttribute('aria-expanded') !== 'true';
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  const button = nav.querySelector('.nav-hamburger button');
  if (button) button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  document.body.style.overflowY = (open && !isDesktop.matches) ? 'hidden' : '';
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  // Nav images use paths relative to the fragment (content root). Resolve them
  // to absolute paths so they load regardless of the current page URL.
  const navBase = fragment.dataset.navBase || '';
  fragment.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('/')) {
      img.src = `${navBase}/${src}`;
    }
  });

  const nav = document.createElement('nav');
  nav.id = 'nav';

  const sections = [...fragment.children];
  // Expected order: [0] utility (sign-in + language toggle),
  // [1] brand (logo), [2] main nav links, [3] locale list.
  const [utilitySrc, brandSrc, navSrc, localeSrc] = sections;

  // --- Utility bar (top): sign-in + language toggle ---
  const utility = document.createElement('div');
  utility.className = 'nav-utility';
  if (utilitySrc) {
    utilitySrc.querySelectorAll('a').forEach((a) => {
      const item = document.createElement('span');
      item.className = 'nav-utility-item';
      item.append(a);
      utility.append(item);
    });
  }

  // --- Brand (logo) ---
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSrc) {
    while (brandSrc.firstChild) brand.append(brandSrc.firstChild);
  }

  // --- Main nav links ---
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  if (navSrc) {
    while (navSrc.firstChild) navSections.append(navSrc.firstChild);
  }

  // --- Search form (built in JS, not in the fragment) ---
  const search = document.createElement('div');
  search.className = 'nav-search';
  search.innerHTML = `
    <form role="search" action="/us/en/search.html" method="get">
      <span class="nav-search-icon" aria-hidden="true"></span>
      <input type="search" name="q" placeholder="Search" aria-label="Search">
    </form>`;

  // --- Locale list (hidden until language toggle clicked) ---
  const locale = document.createElement('div');
  locale.className = 'nav-locale';
  locale.hidden = true;
  if (localeSrc) {
    while (localeSrc.firstChild) locale.append(localeSrc.firstChild);
  }

  // Language toggle wires to the locale list
  const langToggle = utility.querySelector('a[href="#langNavToggle"]');
  if (langToggle) {
    langToggle.addEventListener('click', (e) => {
      e.preventDefault();
      locale.hidden = !locale.hidden;
      langToggle.setAttribute('aria-expanded', locale.hidden ? 'false' : 'true');
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));

  // assemble
  utility.append(locale);
  nav.append(utility, hamburger, brand, navSections, search);
  nav.setAttribute('aria-expanded', 'false');

  // close the mobile menu when switching to desktop
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, false);
    locale.hidden = true;
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
