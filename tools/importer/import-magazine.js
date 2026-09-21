/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
// Magazine articles are all default content (no blocks, no styled sections).
const PAGE_TEMPLATE = {
  name: 'magazine',
  description: 'Magazine article page: editorial content (hero image, article body, byline, related sidebar) — all default content, no blocks.',
  urls: [
    'https://wknd.site/us/en/magazine/arctic-surfing.html',
  ],
  blocks: [],
  sections: [],
};

// TRANSFORMER REGISTRY - cleanup only (no sections: single-flow article)
const transformers = [
  cleanupTransformer,
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

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. No blocks to parse for this template — editorial default content only.

    // 3. afterTransform (final cleanup)
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
        blocks: [],
      },
    }];
  },
};
