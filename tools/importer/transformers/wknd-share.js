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
 * The Pinterest <a> has no text or child nodes, so html2md drops it as an empty
 * anchor — leaving only the "Share this Adventure" heading in the migrated output.
 *
 * This transformer gives the Pinterest anchor visible text so it round-trips
 * through markdown as a normal link right after the heading. The href is the
 * same static create-button URL on every page, so no per-page value is used.
 */
const PINTEREST_HREF_PREFIX = 'https://www.pinterest.com/pin/create/button/';
const PINTEREST_LABEL = 'Pinterest';

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;

  const anchors = element.querySelectorAll(
    'a[data-pin-do], a[href^="https://www.pinterest.com/pin/create/button/"]',
  );

  anchors.forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (!href.startsWith(PINTEREST_HREF_PREFIX)) return;
    // Only fill in a label when the anchor is empty; never clobber real content.
    if (a.textContent.trim() === '' && a.children.length === 0) {
      a.textContent = PINTEREST_LABEL;
    }
  });
}
