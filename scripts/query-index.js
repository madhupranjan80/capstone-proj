import { createOptimizedPicture } from './aem.js';

/*
 * Query-index helpers for listing blocks (cards-article, tabs-content).
 *
 * A listing block is authored as a small settings table instead of one row
 * per card, e.g.
 *   | Source | /us/en/magazine/ |
 *   | Sort   | newest           |   (newest | title | title-desc)
 *   | Limit  | 4                |   (optional)
 * Pages are read from /query-index.json, so publishing a new page under the
 * source folder makes it appear in every listing with no code or content change.
 */

const SETTING_KEYS = ['source', 'sort', 'limit'];

let indexPromise;

/**
 * Fetch (once per page view) all rows of the site's query index.
 * @returns {Promise<Object[]>} index rows; empty on failure
 */
export function fetchQueryIndex() {
  if (!indexPromise) {
    indexPromise = fetch('/query-index.json?limit=1000')
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => json.data || [])
      .catch(() => []);
  }
  return indexPromise;
}

// text of a settings cell; a link (DA may auto-link paths) yields its path
function cellValue(cell) {
  const a = cell.querySelector('a');
  if (a) {
    try {
      return new URL(a.href, window.location.origin).pathname;
    } catch (e) {
      return a.textContent.trim();
    }
  }
  return cell.textContent.trim();
}

/**
 * Read a listing settings table from a block.
 * @param {Element} block block element (undecorated)
 * @returns {Object|null} { source, sort, limit, rows } or null when the block
 *   holds authored content rather than listing settings. `rows` keeps every
 *   non-setting [label, value] pair in order (used for tab definitions).
 */
export function readListingConfig(block) {
  if (block.querySelector('picture, img')) return null;
  const pairs = [...block.children].map((row) => [...row.children]);
  if (!pairs.length || pairs.some((cells) => cells.length !== 2)) return null;

  const config = { sort: 'newest', limit: 0, rows: [] };
  pairs.forEach(([keyCell, valueCell]) => {
    const key = keyCell.textContent.trim();
    const setting = key.toLowerCase();
    if (SETTING_KEYS.includes(setting)) config[setting] = cellValue(valueCell);
    else config.rows.push([key, valueCell.textContent.trim()]);
  });
  if (!config.source || !config.source.startsWith('/')) return null;

  config.source = config.source.replace(/\.html$/, '').replace(/\/?$/, '/');
  config.sort = config.sort.toLowerCase();
  config.limit = parseInt(config.limit, 10) || 0;
  return config;
}

/**
 * Pages below the configured source folder, sorted and limited.
 * @param {Object} config from readListingConfig
 * @param {Function} [filter] extra row filter
 * @returns {Promise<Object[]>}
 */
export async function queryPages(config, filter = () => true) {
  const rows = await fetchQueryIndex();
  const pages = rows.filter((row) => row.path
    && row.path.startsWith(config.source)
    && row.title
    && filter(row));

  const byTitle = (a, b) => a.title.localeCompare(b.title);
  if (config.sort === 'title') pages.sort(byTitle);
  else if (config.sort === 'title-desc') pages.sort((a, b) => byTitle(b, a));
  else pages.sort((a, b) => (Number(b.lastModified) || 0) - (Number(a.lastModified) || 0));

  return config.limit ? pages.slice(0, config.limit) : pages;
}

/**
 * Card parts for an index row: an optimized picture, a linked h3 title and a
 * description paragraph (the same shape authored cards use).
 * @param {Object} page index row
 * @returns {{picture: Element|null, heading: Element, description: Element|null}}
 */
export function buildCardParts(page) {
  let picture = null;
  if (page.image && !page.image.includes('default-meta-image')) {
    const src = new URL(page.image, window.location.origin).pathname;
    picture = createOptimizedPicture(src, page.title, false, [{ width: '750' }]);
  }

  const heading = document.createElement('h3');
  const link = document.createElement('a');
  link.href = page.path;
  link.textContent = page.title;
  heading.append(link);

  let description = null;
  if (page.description) {
    description = document.createElement('p');
    description.textContent = page.description;
  }
  return { picture, heading, description };
}
