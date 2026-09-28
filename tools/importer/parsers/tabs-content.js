/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-content.
 * Base block: tabs
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.tabs.panelcontainer)  -- prose panels
 *         https://wknd.site/us/en/adventures.html (.tabs.panelcontainer)                 -- image-list card grid panels
 * Generated: 2026-09-21 (image-list card support added 2026-09-24)
 *
 * EDS "tabs" convention: 2-column table, one row per tab. Cell 0 = tab label,
 * cell 1 = tab content. The block's decorate() takes each row's first child as
 * the tab label and treats the row (panel) as the tabpanel.
 *
 * Source is a .cmp-tabs with an <ol class="cmp-tabs__tablist"> of
 * <li class="cmp-tabs__tab"> labels and matching <div class="cmp-tabs__tabpanel"> panels.
 *
 * Two panel shapes are handled:
 *   1. PROSE panels (adventure DETAIL pages): contentfragment with paragraphs, images,
 *      lists. Content nodes (p, ul, ol, h2..h6, img) are collected in document order.
 *   2. IMAGE-LIST CARD GRID panels (adventures LANDING page): a ul.cmp-image-list of
 *      li.cmp-image-list__item cards. Each card is rebuilt as a self-contained <li>
 *      (image + linked title heading + description) inside a single <ul>, so every
 *      card stays intact through the markdown round-trip and renders as a grid via
 *      tabs-content.css (`.tabs-content-panel ul:has(li picture)`). This reuses the
 *      per-card extraction from parsers/cards-article.js so image + title-link +
 *      description stay together per card instead of being flattened.
 */

// Build a card grid <ul> from a panel's .cmp-image-list items.
// Mirrors parsers/cards-article.js per-card extraction (image cell + title-link
// heading + description), but emits one <li> per card so the whole card survives
// the html2md round-trip as a single list item.
function buildImageListCards(panel, document) {
  let items = Array.from(panel.querySelectorAll('li.cmp-image-list__item, .cmp-image-list__item'));
  if (!items.length) {
    items = Array.from(panel.querySelectorAll('article.cmp-image-list__item-content, .cmp-image-list__item-content'));
  }
  if (!items.length) return null;

  const ul = document.createElement('ul');

  items.forEach((item) => {
    const li = document.createElement('li');

    // --- Image ---
    const img = item.querySelector('.cmp-image-list__item-image img, img');
    if (img) li.append(img);

    // --- Title (linked heading) ---
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
      li.append(heading);
    }

    // --- Description ---
    const descSpan = item.querySelector('.cmp-image-list__item-description');
    const descText = descSpan ? descSpan.textContent.trim() : '';
    if (descText) {
      const p = document.createElement('p');
      p.textContent = descText;
      li.append(p);
    }

    // Only emit a card that has some content.
    if (img || titleText || descText) ul.append(li);
  });

  return ul.children.length ? ul : null;
}

// Collect prose content nodes (paragraphs, headings, lists, images) in document
// order for a non-image-list panel.
function buildProseContent(panel) {
  const contentRoot = panel.querySelector('.cmp-contentfragment__elements')
    || panel.querySelector('.cmp-contentfragment')
    || panel;

  // Drop the duplicated contentfragment title (h3) before extracting.
  contentRoot
    .querySelectorAll('.cmp-contentfragment__title')
    .forEach((h) => h.remove());

  return Array.from(
    contentRoot.querySelectorAll('p, ul, ol, h2, h3, h4, h5, h6, img'),
  ).filter((node) => {
    if (node.tagName === 'IMG') return true;
    return node.textContent.trim().length > 0;
  });
}

// Source tabs on the adventures landing page are CMS tags; the migrated pages
// carry an "Activity" value instead (indexed as `activity`). Tabs whose label
// differs from the activity names they cover are mapped here; any other tab
// label is used as the activity name itself.
const TAB_ACTIVITIES = {
  climbing: 'Rock Climbing',
  travel: 'Social, Camping',
};

/**
 * Landing-page card-grid tabs are a query-driven listing on the source: emit a
 * "listing (tabs)" settings block (see blocks/listing) resolved against
 * /query-index.json at runtime, so new adventures appear without re-authoring.
 *   | Source | /us/en/adventures/ |  | Sort | title |
 *   | <Tab label> | <activities> |   (empty = all pages, e.g. the "All" tab)
 * Returns null when the panels are not all card lists into one folder.
 */
function listingTabRows(tabs, panels) {
  if (!tabs.length || panels.some((panel) => !panel || !panel.querySelector('.cmp-image-list__item'))) {
    return null;
  }
  const panelItems = panels.map((panel) => Array.from(panel.querySelectorAll('.cmp-image-list__item')));
  const pathOf = (item) => {
    const link = item.querySelector('a.cmp-image-list__item-title-link, a[href]');
    const href = link && link.getAttribute('href');
    try {
      return href ? new URL(href, 'https://wknd.site').pathname.replace(/\.html$/, '') : null;
    } catch (e) {
      return null;
    }
  };
  const allPaths = panelItems.flat().map(pathOf);
  if (allPaths.some((p) => !p)) return null;
  const folders = allPaths.map((p) => p.slice(0, p.lastIndexOf('/') + 1));
  if (!folders.every((f) => f === folders[0])) return null;
  const uniqueCount = new Set(allPaths).size;

  // sort order of the widest ("All") tab
  const widest = panelItems.reduce((a, b) => (b.length > a.length ? b : a));
  const titles = widest.map((item) => {
    const el = item.querySelector('.cmp-image-list__item-title, a.cmp-image-list__item-title-link');
    return el ? el.textContent.trim() : '';
  });
  const asc = [...titles].sort((a, b) => a.localeCompare(b));
  let sort = 'newest';
  if (titles.every((t, i) => t === asc[i])) sort = 'title';
  else if (titles.every((t, i) => t === asc[asc.length - 1 - i])) sort = 'title-desc';

  const rows = [['Source', folders[0]], ['Sort', sort]];
  tabs.forEach((tab, i) => {
    const label = tab.textContent.trim();
    if (!label) return;
    const showsAll = panelItems[i].length === uniqueCount;
    rows.push([label, showsAll ? '' : (TAB_ACTIVITIES[label.toLowerCase()] || label)]);
  });
  return rows;
}

export default function parse(element, { document }) {
  const tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  const listing = listingTabRows(tabs, panels);
  if (listing) {
    const block = WebImporter.Blocks.createBlock(document, {
      name: 'listing (tabs)',
      cells: listing,
    });
    element.replaceWith(block);
    return;
  }

  const cells = [];
  tabs.forEach((tab, i) => {
    const label = tab.textContent.trim();
    const panel = panels[i];

    let contentCell = [];
    if (panel) {
      // Image-list card grid panel (landing page) vs. prose panel (detail page).
      if (panel.querySelector('.cmp-image-list__item')) {
        const cardGrid = buildImageListCards(panel, document);
        if (cardGrid) contentCell = [cardGrid];
      } else {
        contentCell = buildProseContent(panel);
      }
    }

    // Only emit a tab row when it has a label; keep 2 columns consistently.
    if (label) {
      cells.push([label, contentCell.length ? contentCell : '']);
    }
  });

  // Empty-block guard: no tabs found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'tabs-content',
    cells,
  });
  element.replaceWith(block);
}
