/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base block: columns.
 * Source: https://wknd.site/us/en.html
 * Structure (from library-description.txt + metadata): 2-column single row.
 *   Cell 1: large image. Cell 2: eyebrow (pretitle) + heading + description + CTA.
 * Source DOM (source.html): .cmp-teaser--featured > .cmp-teaser with
 *   __content (pretitle p, __title h2, __description, __action-link a) and __image.
 * Block decorate() flags the picture-only column as the image column.
 */
export default function parse(element, { document }) {
  // --- Image column ---
  const img = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  // --- Content column ---
  const contentCell = [];

  // Eyebrow / pretitle.
  const pretitle = element.querySelector('.cmp-teaser__pretitle');
  if (pretitle && pretitle.textContent.trim()) {
    const p = document.createElement('p');
    const em = document.createElement('em');
    em.textContent = pretitle.textContent.trim();
    p.append(em);
    contentCell.push(p);
  }

  // Heading.
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  if (title && title.textContent.trim()) {
    const heading = document.createElement(/^h[1-6]$/i.test(title.tagName) ? title.tagName.toLowerCase() : 'h2');
    heading.textContent = title.textContent.trim();
    contentCell.push(heading);
  }

  // Description.
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

  const cells = [[img || '', contentCell.length ? contentCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
