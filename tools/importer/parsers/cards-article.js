/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base block: cards.
 * Source: https://wknd.site/us/en.html
 * Structure (from library-description.txt): 2-column table, one row per card.
 *   Row cell 1: image. Row cell 2: title (heading) + description + optional CTA.
 * Source DOM (source.html): ul.cmp-image-list > li.cmp-image-list__item
 *   > article.cmp-image-list__item-content containing image-link (img),
 *   title-link (span title), and description span.
 *
 * Query-driven source lists (every card links into one folder) are emitted as
 * a separate "listing" settings block instead (see blocks/listing), so newly
 * published pages appear without re-authoring:
 *   | Source | /us/en/magazine/ |  folder all cards link into
 *   | Sort   | newest | title | title-desc |  order the source list is in
 *   | Limit  | 4 |  card count; omitted on the folder's own landing page
 */

// Listing settings rows for the cards, or null when they don't all link into
// one folder (then regular cards are emitted).
function listingRows(items, pageUrl) {
  if (!items.length) return null;
  const paths = items.map((item) => {
    const link = item.querySelector('a.cmp-image-list__item-title-link, a[href]');
    const href = link && link.getAttribute('href');
    if (!href) return null;
    try {
      return new URL(href, 'https://wknd.site').pathname.replace(/\.html$/, '');
    } catch (e) {
      return null;
    }
  });
  if (paths.some((p) => !p)) return null;
  const folders = paths.map((p) => p.slice(0, p.lastIndexOf('/') + 1));
  if (!folders.every((f) => f === folders[0])) return null;
  const source = folders[0];

  const titles = items.map((item) => {
    const el = item.querySelector('.cmp-image-list__item-title, a.cmp-image-list__item-title-link');
    return el ? el.textContent.trim() : '';
  });
  const asc = [...titles].sort((a, b) => a.localeCompare(b));
  let sort = 'newest';
  if (titles.every((t, i) => t === asc[i])) sort = 'title';
  else if (titles.every((t, i) => t === asc[asc.length - 1 - i])) sort = 'title-desc';

  let pagePath = '';
  try {
    pagePath = new URL(pageUrl).pathname.replace(/\.html$/, '');
  } catch (e) { /* keep the limit */ }

  const rows = [['Source', source], ['Sort', sort]];
  if (`${pagePath}/` !== source) rows.push(['Limit', String(items.length)]);
  return rows;
}

export default function parse(element, { document, url, params }) {
  // Each list item is one card. Fallback to the element itself if no <li> present.
  let items = Array.from(element.querySelectorAll('li.cmp-image-list__item, .cmp-image-list__item'));
  if (!items.length) {
    items = Array.from(element.querySelectorAll('article.cmp-image-list__item-content, .cmp-image-list__item-content'));
  }

  const settings = listingRows(items, (params && params.originalURL) || url);
  if (settings) {
    const listing = WebImporter.Blocks.createBlock(document, {
      name: 'listing',
      cells: settings,
    });
    element.replaceWith(listing);
    return;
  }

  const cells = [];

  items.forEach((item) => {
    // --- Image cell ---
    const img = item.querySelector('.cmp-image-list__item-image img, img');

    // --- Body cell ---
    const bodyContent = [];

    // Title (heading). Preserve the article link on the heading when present.
    const titleLink = item.querySelector('a.cmp-image-list__item-title-link, .cmp-image-list__item-title-link');
    const titleSpan = item.querySelector('.cmp-image-list__item-title');
    const titleText = (titleSpan ? titleSpan.textContent : (titleLink ? titleLink.textContent : '')).trim();
    if (titleText) {
      const heading = document.createElement('h3');
      const href = titleLink ? titleLink.getAttribute('href') : null;
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = titleText;
        heading.append(a);
      } else {
        heading.textContent = titleText;
      }
      bodyContent.push(heading);
    }

    // Description.
    const descSpan = item.querySelector('.cmp-image-list__item-description');
    const descText = descSpan ? descSpan.textContent.trim() : '';
    if (descText) {
      const p = document.createElement('p');
      p.textContent = descText;
      bodyContent.push(p);
    }

    // Only emit a card row if it has content.
    if (img || bodyContent.length) {
      cells.push([img || '', bodyContent.length ? bodyContent : '']);
    }
  });

  // Empty-block guard: nothing extractable.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
