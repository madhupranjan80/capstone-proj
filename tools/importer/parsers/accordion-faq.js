/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion.
 * Source: WKND "faqs" template — <div class="cmp-accordion"> with .cmp-accordion__item children.
 * Generated: 2026-09-21
 *
 * EDS library convention (Accordion): 2-column table. First row = block name.
 * Each subsequent row is one accordion item with 2 cells:
 *   - Title cell (mandatory): the clickable label -> here the FAQ question text.
 *   - Content cell (mandatory): the body content shown when expanded -> the answer paragraph(s).
 *
 * Matches blocks/accordion-faq/accordion-faq.js decorate(): row.children[0] -> summary label,
 * row.children[1] -> body. ONE ROW PER Q&A pair.
 *
 * `element` is the .cmp-accordion instance (selector: .accordion.panelcontainer / .cmp-accordion).
 */
export default function parse(element, { document }) {
  const items = element.querySelectorAll(':scope > .cmp-accordion__item, .cmp-accordion__item');

  const cells = [];

  items.forEach((item) => {
    // Title cell — question text inside the header button title span, with fallbacks.
    const titleEl = item.querySelector('.cmp-accordion__title, .cmp-accordion__button, .cmp-accordion__header');
    const questionText = titleEl ? titleEl.textContent.trim() : '';

    // Content cell — answer paragraph HTML from the panel's text component(s).
    const panel = item.querySelector('.cmp-accordion__panel, [class*="panel"]');
    const answerCell = [];
    if (panel) {
      // Prefer meaningful content elements inside .cmp-text blocks; fall back to the panel body.
      const contentNodes = panel.querySelectorAll('.cmp-text > *, .cmp-text');
      if (contentNodes.length) {
        contentNodes.forEach((node) => {
          // Skip empty placeholder nodes (e.g. <h3>&nbsp;</h3>).
          if (node.textContent && node.textContent.replace(/ /g, ' ').trim()) {
            answerCell.push(node);
          }
        });
      }
      // Fallback: if no .cmp-text content resolved, keep whatever paragraphs the panel holds.
      if (!answerCell.length) {
        const paras = panel.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6');
        paras.forEach((p) => {
          if (p.textContent && p.textContent.replace(/ /g, ' ').trim()) answerCell.push(p);
        });
      }
    }

    // Only emit a row when there is real content for this item (mandatory cells).
    if (questionText || answerCell.length) {
      cells.push([questionText, answerCell.length ? answerCell : '']);
    }
  });

  // Empty-block guard: nothing extracted -> unwrap rather than emit a malformed block.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
