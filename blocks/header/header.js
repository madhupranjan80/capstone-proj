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
 * Build the "Sign In" dialog shown from the utility bar (mirrors the source's
 * sign-in modal). The source form posts to an AEM login endpoint that does not
 * exist on Edge Delivery, so this is presentational: submitting just closes it.
 * Closes on outside click (as on the source) and on Escape (native <dialog>).
 * @returns {HTMLDialogElement}
 */
function buildSignInDialog() {
  const dialog = document.createElement('dialog');
  dialog.className = 'nav-signin';
  dialog.setAttribute('aria-labelledby', 'nav-signin-title');
  dialog.innerHTML = `
    <h2 id="nav-signin-title">Sign In</h2>
    <h3>Welcome Back</h3>
    <form method="dialog" class="nav-signin-form">
      <input type="text" name="username" placeholder="Username" aria-label="Username" autocomplete="username">
      <input type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="current-password">
      <p><a href="#" class="nav-signin-forgot">Forgot your password?</a></p>
      <button type="submit">Sign In</button>
    </form>
    <hr>`;

  dialog.querySelector('.nav-signin-forgot').addEventListener('click', (e) => e.preventDefault());

  // A click on the backdrop lands on the <dialog> itself, outside its box.
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right
      && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialog.close();
  });
  return dialog;
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

  // Drop the "Home" link — the source nav is Magazine/Adventures/FAQs/About Us.
  navSections.querySelectorAll('li').forEach((li) => {
    if (li.textContent.trim().toLowerCase() === 'home') li.remove();
  });

  // Highlight the nav item for the section the current page belongs to. Match
  // each link's path against the current path and keep the longest prefix match
  // (so /us/en/adventures/<slug> highlights "Adventures"). The site root is
  // ignored so it never matches every page.
  const currentPath = window.location.pathname.replace(/\.html$/, '');
  let best = null;
  let bestLen = 0;
  navSections.querySelectorAll('a').forEach((a) => {
    let linkPath;
    try {
      linkPath = new URL(a.href, window.location.origin).pathname.replace(/\.html$/, '');
    } catch (e) {
      return;
    }
    if (linkPath === '/' || /\/us\/en\/?$/.test(linkPath)) return; // skip home
    if ((currentPath === linkPath || currentPath.startsWith(`${linkPath}/`))
      && linkPath.length > bestLen) {
      best = a;
      bestLen = linkPath.length;
    }
  });
  if (best) best.closest('li').classList.add('nav-active');

  // --- Search form (built in JS, not in the fragment) ---
  const search = document.createElement('div');
  search.className = 'nav-search';
  search.innerHTML = `
    <form role="search" action="/us/en/search.html" method="get">
      <span class="nav-search-icon" aria-hidden="true"></span>
      <input type="search" name="q" placeholder="Search" aria-label="Search">
    </form>`;

  // --- Locale list (hidden until language toggle clicked) ---
  // The imported content is a flat list of locale codes (en-US, es-US, en-CA…).
  // The source groups them by country, each with a country name and flag, and
  // lists the locale links for that country inline. Rebuild that structure.
  const COUNTRY_NAMES = {
    US: 'United States',
    CA: 'Canada',
    CH: 'Switzerland',
    DE: 'Germany',
    FR: 'France',
    ES: 'Spain',
    IT: 'Italy',
  };
  const FLAG_BASE = 'https://wknd.site/etc.clientlibs/wknd/clientlibs/clientlib-site/resources/images/country-flags/';

  const locale = document.createElement('div');
  locale.className = 'nav-locale';
  locale.hidden = true;
  if (localeSrc) {
    const groups = new Map(); // countryCode -> [anchors], insertion order preserved
    localeSrc.querySelectorAll('a').forEach((a) => {
      const cc = (a.textContent.trim().split('-')[1] || '').toUpperCase();
      if (!cc) return;
      if (!groups.has(cc)) groups.set(cc, []);
      groups.get(cc).push(a);
    });

    const list = document.createElement('ul');
    list.className = 'nav-locale-list';
    groups.forEach((anchors, cc) => {
      const country = document.createElement('li');
      country.className = 'nav-locale-country';
      country.style.backgroundImage = `url("${FLAG_BASE}${cc}.svg")`;

      const title = document.createElement('span');
      title.className = 'nav-locale-country-title';
      title.textContent = COUNTRY_NAMES[cc] || cc;

      const sub = document.createElement('ul');
      sub.className = 'nav-locale-langs';
      anchors.forEach((a) => {
        const li = document.createElement('li');
        li.append(a);
        sub.append(li);
      });

      country.append(title, sub);
      list.append(country);
    });
    locale.append(list);
  }

  // Language toggle wires to the locale list. The source used an
  // `#langNavToggle` anchor, but the imported link carries a real href, so also
  // match the locale-style label (e.g. "en-US") as a fallback. Only wire it when
  // there is actually a locale list to reveal.
  const langToggle = utility.querySelector('a[href="#langNavToggle"]')
    || [...utility.querySelectorAll('.nav-utility-item a')]
      .find((a) => /^[a-z]{2}-[a-z]{2}$/i.test(a.textContent.trim()));
  if (langToggle && locale.children.length) {
    langToggle.setAttribute('aria-haspopup', 'true');
    langToggle.setAttribute('aria-expanded', 'false');
    langToggle.addEventListener('click', (e) => {
      e.preventDefault();
      locale.hidden = !locale.hidden;
      langToggle.setAttribute('aria-expanded', locale.hidden ? 'false' : 'true');
    });
  }

  // "Sign In" opens the sign-in dialog. The imported link carries a real href
  // (the source used #sign-in), so match on its label.
  const signInLink = [...utility.querySelectorAll('.nav-utility-item a')]
    .find((a) => /^sign in$/i.test(a.textContent.trim()));
  let signInDialog;
  if (signInLink) {
    signInDialog = buildSignInDialog();
    signInLink.setAttribute('aria-haspopup', 'dialog');
    signInLink.addEventListener('click', (e) => {
      e.preventDefault();
      locale.hidden = true;
      if (langToggle) langToggle.setAttribute('aria-expanded', 'false');
      signInDialog.showModal();
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
  if (signInDialog) navWrapper.append(signInDialog);
  block.append(navWrapper);
}
