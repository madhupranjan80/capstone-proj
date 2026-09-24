import { decorateSocialLinks } from '../../scripts/social-icons.js';

/**
 * Author bio row: avatar | name + role | social links.
 * Cells are identified by content rather than position, so authors can omit
 * the avatar or the social links.
 * @param {Element} block The author-bio block element
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  row.classList.add('author-bio-row');

  [...row.children].forEach((cell) => {
    if (cell.querySelector('picture') && !cell.querySelector('h1, h2, h3, h4, h5, h6')) {
      cell.className = 'author-bio-image';
    } else if (cell.querySelector('a') && !cell.querySelector('h1, h2, h3, h4, h5, h6')) {
      cell.className = 'author-bio-social';
      decorateSocialLinks(cell);
    } else {
      cell.className = 'author-bio-text';
    }
  });
}
