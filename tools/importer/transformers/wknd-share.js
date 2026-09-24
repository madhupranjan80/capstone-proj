/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND share widget removal.
 *
 * Adventure detail pages ("Share this Adventure") and magazine articles
 * ("Share this Story") render a share widget as:
 *   <div class="sharing">
 *     <div class="fb-share-button" ...></div>
 *     <a data-pin-do="buttonPin" href="https://www.pinterest.com/pin/create/button/"></a>
 *   </div>
 * The buttons are empty placeholders filled in by the Facebook/Pinterest SDKs,
 * which the migrated site does not load. By decision, no share links are
 * migrated, so the widget is removed and nothing is emitted in its place.
 */
export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;

  element.querySelectorAll('.sharing').forEach((sharing) => sharing.remove());
}
