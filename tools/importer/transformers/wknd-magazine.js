/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND magazine article cleanup (beforeTransform).
 *
 * - Drops the content fragment's __title (h3). The source hides it (0x0) because
 *   it duplicates the page H1; imported as-is it shows as a second title.
 * - Drops the source's separator components and the empty download component.
 *   Their <hr> would otherwise become stray section breaks; the author-bio block
 *   and the sidebar draw their own rules.
 * - "Up next" related-article list: moves the date out of the link so the title
 *   is the link text and the date follows as plain text (the source renders them
 *   as two lines; left inside the link they collapse into one run-on label).
 */
export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;

  element.querySelectorAll('.cmp-contentfragment__title').forEach((el) => el.remove());

  element.querySelectorAll('.separator, .download').forEach((el) => el.remove());

  element.querySelectorAll('.cmp-list__item-link').forEach((a) => {
    const date = a.querySelector('.cmp-list__item-date');
    if (!date) return;
    const text = date.textContent.trim();
    date.remove();
    if (text) a.after(element.ownerDocument.createTextNode(` ${text}`));
  });
}
