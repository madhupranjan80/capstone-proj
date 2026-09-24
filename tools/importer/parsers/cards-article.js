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
 */
export default function parse(element, { document }) {
  // Each list item is one card. Fallback to the element itself if no <li> present.
  let items = Array.from(element.querySelectorAll('li.cmp-image-list__item, .cmp-image-list__item'));
  if (!items.length) {
    items = Array.from(element.querySelectorAll('article.cmp-image-list__item-content, .cmp-image-list__item-content'));
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
