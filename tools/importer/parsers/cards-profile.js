/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-profile. Base block: cards.
 * Source: https://wknd.site/us/en/about-us.html
 * Structure (from library-description.txt): 2-column table, one row per card.
 *   Cell 1: image (profile photo). Cell 2: name (heading) + role + social links.
 * Source DOM (source.html): one <section class="cmp-experience-fragment--contributor">
 *   per card. Contains .cmp-image img, a .cmp-title h3 (name), a second
 *   .cmp-title h5 (role), and .cmp-buildingblock--btn-list a.cmp-button social links.
 * NOTE: The block instance selector targets individual card sections, so this
 *   parser receives ONE card per invocation and emits a single [image, body] row.
 */
export default function parse(element, { document }) {
  // --- Image cell: profile photo. Single-picture cell → .cards-profile-card-image ---
  const img = element.querySelector('.cmp-image img, img');

  // --- Body cell: name (h3), role (h5), social links ---
  const bodyContent = [];

  // Name — first title heading (h3). Fall back to any heading in a .cmp-title.
  const nameEl = element.querySelector('.cmp-title h3, .cmp-title__text');
  const nameText = nameEl ? nameEl.textContent.trim() : '';
  if (nameText) {
    const heading = document.createElement('h3');
    heading.textContent = nameText;
    bodyContent.push(heading);
  }

  // Role — second title heading (h5).
  const roleEl = element.querySelector('.cmp-title h5');
  const roleText = roleEl ? roleEl.textContent.trim() : '';
  if (roleText) {
    const roleHeading = document.createElement('h5');
    roleHeading.textContent = roleText;
    bodyContent.push(roleHeading);
  }

  // Social links — preserve href and label (facebook / twitter / instagram, ...).
  const socialAnchors = Array.from(
    element.querySelectorAll('.cmp-buildingblock--btn-list a.cmp-button, .cmp-buildingblock--btn-list a'),
  );
  socialAnchors.forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href) return;
    const labelEl = anchor.querySelector('.cmp-button__text');
    const label = (labelEl ? labelEl.textContent : anchor.textContent).trim();
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = label || href;
    const p = document.createElement('p');
    p.append(a);
    bodyContent.push(p);
  });

  // Empty-block guard: nothing extractable for this card.
  if (!img && !bodyContent.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[img || '', bodyContent.length ? bodyContent : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-profile', cells });
  element.replaceWith(block);
}
