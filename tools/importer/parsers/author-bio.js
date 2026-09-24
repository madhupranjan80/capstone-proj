/* eslint-disable */
/* global WebImporter */
/**
 * Parser for author-bio.
 * Source: https://wknd.site/us/en/magazine/*.html — contributor experience
 * fragment (.experiencefragment containing .cmp-byline) at the end of the article:
 *   .cmp-byline > .cmp-byline__image img, h2.cmp-byline__name, p.cmp-byline__occupations
 *   + icon-only buttons (a.cmp-button with aria-label Facebook/Twitter/Instagram)
 * Emits a single row with three cells: [avatar] [name h3 + role p] [social links].
 * The fragment's separator is dropped (the block draws its own rule).
 */
export default function parse(element, { document }) {
  const byline = element.querySelector('.cmp-byline');
  if (!byline) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const img = byline.querySelector('.cmp-byline__image img, img');

  const text = [];
  const name = byline.querySelector('.cmp-byline__name');
  if (name && name.textContent.trim()) {
    const h3 = document.createElement('h3');
    h3.textContent = name.textContent.trim();
    text.push(h3);
  }
  const role = byline.querySelector('.cmp-byline__occupations');
  if (role && role.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = role.textContent.trim();
    text.push(p);
  }

  const social = [];
  element.querySelectorAll('a.cmp-button').forEach((a) => {
    const label = (a.getAttribute('aria-label') || a.textContent).trim();
    if (!label) return;
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href') || '#');
    // Normalise the label casing ("instagram" -> "Instagram").
    link.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    p.append(link);
    social.push(p);
  });

  const cells = [[img || '', text.length ? text : '', social.length ? social : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'author-bio', cells });
  element.replaceWith(block);
}
