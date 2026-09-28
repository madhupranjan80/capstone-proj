import { decorateBlock, loadBlock } from '../../scripts/aem.js';
import { readListingConfig, queryPages, buildCardParts } from '../../scripts/query-index.js';

/*
 * Listing: renders pages from /query-index.json, so newly published pages
 * appear without re-authoring. The block holds settings only; the cards are
 * handed to an existing presentation block, so the look stays the same:
 *   listing         -> cards-article grid
 *   listing (tabs)  -> tabs-content, one tab per extra row:
 *                      | Tab label | activity, activity | (empty = all pages)
 */

// authored-style cards-article row: image cell + body cell
function cardRow(page) {
  const { picture, heading, description } = buildCardParts(page);
  const row = document.createElement('div');
  const imageCell = document.createElement('div');
  if (picture) imageCell.append(picture);
  const bodyCell = document.createElement('div');
  bodyCell.append(heading);
  if (description) bodyCell.append(description);
  row.append(imageCell, bodyCell);
  return row;
}

// authored-style tabs-content row: label cell + panel cell with a card list
function tabRow(label, pages) {
  const ul = document.createElement('ul');
  pages.forEach((page) => {
    const { picture, heading, description } = buildCardParts(page);
    const li = document.createElement('li');
    if (picture) {
      const p = document.createElement('p');
      p.append(picture);
      li.append(p);
    }
    li.append(heading);
    if (description) li.append(description);
    ul.append(li);
  });

  const row = document.createElement('div');
  const labelCell = document.createElement('div');
  labelCell.textContent = label;
  const panelCell = document.createElement('div');
  panelCell.append(ul);
  row.append(labelCell, panelCell);
  return row;
}

function matchesActivities(page, activities) {
  const wanted = activities.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);
  if (!wanted.length) return true;
  return wanted.includes((page.activity || '').trim().toLowerCase());
}

export default async function decorate(block) {
  const config = readListingConfig(block);
  if (!config) {
    block.textContent = '';
    return;
  }

  const pages = await queryPages(config);
  const tabs = block.classList.contains('tabs');
  const target = document.createElement('div');
  target.className = tabs ? 'tabs-content' : 'cards-article';
  if (tabs) {
    config.rows.forEach(([label, activities]) => {
      target.append(tabRow(label, pages.filter((page) => matchesActivities(page, activities))));
    });
  } else {
    pages.forEach((page) => target.append(cardRow(page)));
  }

  block.replaceWith(target);
  decorateBlock(target);
  await loadBlock(target);
}
