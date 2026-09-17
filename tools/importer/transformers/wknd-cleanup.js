/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * Removes non-authorable site chrome (header, footer, nav, search, mobile nav,
 * tracking iframe) and stray non-content elements. All selectors verified in
 * migration-work/cleaned.html for https://wknd.site/us/en.html.
 */
const H = { before: 'beforeTransform', after: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === H.before) {
    // Tracking / sync iframe (demdex) + mobile nav toggle overlays — remove
    // before parsing so they can't interfere with block matching.
    // Found in cleaned.html: <iframe id="destination_publishing_iframe_wkndsite_0">,
    // <div id="toggleNav">, <div id="mobileNav" class="cmp-navigation--mobile">
    WebImporter.DOMUtils.remove(element, [
      '#destination_publishing_iframe_wkndsite_0',
      '#toggleNav',
      '#mobileNav',
    ]);
  }

  if (hookName === H.after) {
    // Non-authorable site chrome — verified in cleaned.html.
    // header experience fragment holds sign-in buttons, language navigation,
    // logo, main navigation and search; footer experience fragment holds logo,
    // footer nav, social buttons and copyright text.
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header',
      'footer.cmp-experiencefragment--footer',
      'iframe',
      'link',
      'noscript',
    ]);

    // Stray empty <meta> tags injected inside cmp-image wrappers (e.g. after
    // teaser/carousel <img> tags in cleaned.html) — not authorable content.
    element.querySelectorAll('meta').forEach((el) => el.remove());
  }
}
