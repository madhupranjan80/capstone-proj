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

export default function parse(element, { document }) {
  const tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

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
