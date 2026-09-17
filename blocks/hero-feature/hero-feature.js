export default function decorate(block) {
  const picture = block.querySelector(':scope > div:first-child picture');
  if (!picture) {
    block.classList.add('no-image');
    return;
  }

  // Separate the background image from the textual content, wrapping the copy
  // in a card so it can be overlaid on the full-bleed image.
  const rows = [...block.children];
  const imageRow = rows.find((row) => row.querySelector('picture'));
  const contentCell = document.createElement('div');
  contentCell.className = 'hero-feature-content';

  rows.forEach((row) => {
    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture')) {
        cell.className = 'hero-feature-image';
      } else if (cell.textContent.trim() || cell.querySelector('a')) {
        while (cell.firstChild) contentCell.append(cell.firstChild);
        cell.remove();
      }
    });
    if (row !== imageRow && !row.children.length) row.remove();
  });

  if (contentCell.childNodes.length) {
    // Promote a standalone CTA link to the brand button (the project's
    // decorateButtons only buttonizes links wrapped in <strong>/<em>, so a
    // plain teaser link like "See Trip" needs the class applied here).
    const cta = contentCell.querySelector('p > a:only-child');
    if (cta && cta.parentElement.textContent.trim() === cta.textContent.trim()) {
      cta.className = 'button';
      cta.parentElement.className = 'button-wrapper';
    }
    block.append(contentCell);
  }
}
