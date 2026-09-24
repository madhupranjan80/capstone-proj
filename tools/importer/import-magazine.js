/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import authorBioParser from './parsers/author-bio.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import magazineTransformer from './transformers/wknd-magazine.js';
import shareTransformer from './transformers/wknd-share.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'author-bio': authorBioParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'magazine',
  description: 'Magazine article page: hero image + breadcrumb, article column (title, byline, body, author bio) and a sidebar (share + related articles).',
  urls: [
    'https://wknd.site/us/en/magazine/arctic-surfing.html',
    'https://wknd.site/us/en/magazine/guide-la-skateparks.html',
    'https://wknd.site/us/en/magazine/san-diego-surf.html',
    'https://wknd.site/us/en/magazine/ski-touring.html',
    'https://wknd.site/us/en/magazine/western-australia.html',
  ],
  blocks: [
    {
      name: 'author-bio',
      instances: ['.experiencefragment:has(.cmp-byline)'],
    },
  ],
  sections: [
    {
      id: 'mg1',
      name: 'Hero image and breadcrumb',
      selector: ['main.cmp-layout-container--fixed'],
      style: null,
      blocks: [],
      defaultContent: ['.image', '.breadcrumb'],
    },
    {
      id: 'mg2',
      name: 'Article',
      selector: ['main.cmp-layout-container--fixed main.container'],
      style: 'article',
      blocks: ['author-bio'],
      defaultContent: ['.title', '.contentfragment'],
    },
    {
      id: 'mg3',
      name: 'Sidebar (share + related articles)',
      selector: ['aside.cmp-layoutcontainer--sidebar'],
      style: 'sidebar',
      blocks: [],
      defaultContent: ['.title', '.sharing', '.list'],
    },
  ],
};

// TRANSFORMER REGISTRY
// Order matters: magazine cleanup (drops source separators/hidden title) and
// share run before sections inserts its own section-break <hr>s.
const transformers = [
  cleanupTransformer,
  magazineTransformer,
  shareTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (cleanup, magazine fixes, share link, section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find and parse blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 3. afterTransform (final cleanup + section metadata)
    executeTransformers('afterTransform', main, payload);

    // 4. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Generate sanitized path; map root URL to /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
