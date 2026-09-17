/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base block: carousel.
 * Source: https://wknd.site/us/en.html
 * Structure (from library-description.txt): 2-column table, one row per slide.
 *   Cell 1: image (mandatory, no other content).
 *   Cell 2: text content — title (heading), description, CTA link.
 * Source DOM (source.html): .cmp-carousel__content > .cmp-carousel__item
 *   each wraps a .cmp-teaser with __title (h2), __description, __action-link (a).
 * Block decorate() maps col0 -> slide image, col1 -> slide content.
 */
export default function parse(element, { document }) {
  // One row per carousel slide.
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) {
    slides = Array.from(element.querySelectorAll('.cmp-teaser--hero, .teaser'));
  }

  const cells = [];

  slides.forEach((slide) => {
    // --- Image cell ---
    const img = slide.querySelector('.cmp-teaser__image img, .cmp-image img, img');

    // --- Content cell ---
    const contentCell = [];

    // Title -> heading, preserving level from source (h2).
    const title = slide.querySelector('.cmp-teaser__title, h1, h2, h3');
    if (title && title.textContent.trim()) {
      const heading = document.createElement(/^h[1-6]$/i.test(title.tagName) ? title.tagName.toLowerCase() : 'h2');
      heading.textContent = title.textContent.trim();
      contentCell.push(heading);
    }

    // Description (may itself contain a <p>).
    const desc = slide.querySelector('.cmp-teaser__description');
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
    const ctas = Array.from(slide.querySelectorAll('.cmp-teaser__action-link, a.cmp-teaser__action-link'));
    ctas.forEach((cta) => contentCell.push(cta));

    // Only emit a slide row if it has an image or content.
    if (img || contentCell.length) {
      cells.push([img || '', contentCell.length ? contentCell : '']);
    }
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
