/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-members. Base block: cards.
 * Source: https://wknd.site/us/en/magazine.html (.teaser.cmp-teaser--secure)
 *
 * "Members Only" locked teasers. Each source teaser is its own sibling
 * component (.teaser.cmp-teaser--secure > .cmp-teaser) holding __content
 * (h2 __title, __description, __action-container with a plain "Read More"
 * label — not a link, the content is gated) and __image.
 *
 * Follows the Cards convention: 2 columns, one row per card.
 *   cell 1: image, cell 2: title (h3) + description (p) + CTA label (p).
 * The CTA stays plain text because the source has no destination (sign-in gated).
 * All sibling secure teasers are collected into ONE block; the first teaser is
 * replaced by the block and the others are removed, so the import script's
 * parser loop skips them (their parentNode is gone).
 */
export default function parse(element, { document }) {
  const parent = element.parentElement;
  const teasers = parent
    ? Array.from(parent.querySelectorAll(':scope > .teaser.cmp-teaser--secure'))
    : [element];
  if (!teasers.includes(element)) teasers.unshift(element);

  const cells = [];
  teasers.forEach((teaser) => {
    const img = teaser.querySelector('.cmp-teaser__image img, img');

    const body = [];
    const title = teaser.querySelector('.cmp-teaser__title');
    if (title && title.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.trim();
      body.push(h3);
    }

    const desc = teaser.querySelector('.cmp-teaser__description');
    if (desc && desc.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      body.push(p);
    }

    const action = teaser.querySelector('.cmp-teaser__action-container');
    if (action && action.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = action.textContent.trim();
      body.push(p);
    }

    if (img || body.length) cells.push([img || '', body.length ? body : '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-members', cells });
  element.replaceWith(block);
  teasers.forEach((t) => { if (t !== element) t.remove(); });
}
