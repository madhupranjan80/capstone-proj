/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-feature. Base block: hero.
 * Source: https://wknd.site/us/en.html
 * Structure (from library-description.txt): 1-column, 3-row table.
 *   Row 2 (single cell): background image.
 *   Row 3 (single cell): title (heading) + subheading/description + CTA.
 * Source DOM (source.html): .cmp-teaser--hero.cmp-teaser--imagebottom > .cmp-teaser
 *   with __content (__title h2, __description, __action-link a) and __image.
 * Block decorate() reads the first-child picture as the background image and
 * wraps remaining copy in an overlaid content card, so image row must come first.
 */
export default function parse(element, { document }) {
  // --- Background image (row 2) ---
  const img = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  // --- Content (row 3) ---
  const contentCell = [];

  // Title -> heading, preserving level from source (h2).
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  if (title && title.textContent.trim()) {
    const heading = document.createElement(/^h[1-6]$/i.test(title.tagName) ? title.tagName.toLowerCase() : 'h2');
    heading.textContent = title.textContent.trim();
    contentCell.push(heading);
  }

  // Subheading / description.
  const desc = element.querySelector('.cmp-teaser__description');
  if (desc && desc.textContent.trim()) {
    if (desc.querySelector('p')) {
      desc.querySelectorAll('p').forEach((p) => contentCell.push(p));
    } else {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      contentCell.push(p);
    }
  }

  // CTA link(s).
  const ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-link, a.cmp-teaser__action-link'));
  ctas.forEach((cta) => contentCell.push(cta));

  // Empty-block guard.
  if (!img && !contentCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // 1-column block: each row is one cell.
  const cells = [];
  if (img) cells.push([img]);            // row 2: background image
  if (contentCell.length) cells.push([contentCell]); // row 3: heading + description + CTA

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-feature', cells });
  element.replaceWith(block);
}
