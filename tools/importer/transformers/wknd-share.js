/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND "Share this Adventure" share link preservation.
 *
 * Adventure detail pages render a share widget as default content inside
 * main.cmp-layout-container--fixed, structured as two sibling divs:
 *   <div class="title"><h5 class="cmp-title__text">Share this Adventure</h5></div>
 *   <div class="sharing">
 *     <div class="fb-share-button" ...></div>
 *     <a data-pin-do="buttonPin" href="https://www.pinterest.com/pin/create/button/"></a>
 *   </div>
 *
 * The Facebook/Pinterest buttons are empty, SDK-driven placeholders. Two things
 * conspire to lose the share link on import:
 *   1. html2md pre-cleans the DOM BEFORE our transform runs, stripping the empty
 *      <a data-pin-do> anchor out of .sharing — so by the time this transformer
 *      sees the page, .sharing has no usable anchor to preserve.
 *   2. Even a freshly built <p><a> gets dropped if it is left inside the leftover
 *      .cmp-title wrapper (html2md keeps only the heading text from a title
 *      component).
 *
 * So rather than trying to preserve the (already-gone) anchor, this transformer
 * DETECTS the "Share this Adventure" heading and emits a fresh, plain
 * <p><a>Pinterest</a></p> as the heading wrapper's next sibling. The Pinterest
 * create-button URL is the same static value on every adventure page, so no
 * per-page value is needed. The empty .sharing widget is removed.
 */
const PINTEREST_HREF = 'https://www.pinterest.com/pin/create/button/';
// Adventure pages only. Magazine articles ("Share this Story") intentionally get
// no share link; their empty SDK widget is still removed below.
const SHARE_HEADING_RE = /share this adventure/i;

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;

  const doc = element.ownerDocument;

  // Find the "Share this Adventure" heading — the reliable, surviving anchor.
  const heading = [...element.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .find((h) => SHARE_HEADING_RE.test(h.textContent));

  // Collect any genuine, labeled share links still present in the widget
  // (future-proofing — the source's are empty SDK placeholders that html2md
  // strips before we run, so this is usually empty).
  const links = [];
  element.querySelectorAll('.sharing').forEach((sharing) => {
    sharing.querySelectorAll('a[href^="http"]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      const label = a.textContent.trim();
      if (href && label) links.push({ href, label });
    });
    sharing.remove();
  });

  // If nothing meaningful survived but the share widget was present, emit the
  // known Pinterest share link so the "Share this Adventure" section is usable.
  if (!links.length && heading) {
    links.push({ href: PINTEREST_HREF, label: 'Pinterest' });
  }

  if (!links.length || !heading) return;

  // Build a plain paragraph of links that round-trips through markdown.
  const p = doc.createElement('p');
  links.forEach(({ href, label }, i) => {
    if (i > 0) p.append(doc.createTextNode(' '));
    const a = doc.createElement('a');
    a.setAttribute('href', href);
    a.textContent = label;
    p.append(a);
  });

  // Place the paragraph AFTER the whole title wrapper (not inside it), so it
  // sits in the surviving content flow rather than the title component's
  // discarded children.
  const titleWrapper = heading.closest('.title, .cmp-title') || heading;
  titleWrapper.after(p);
}
