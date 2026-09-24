/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-magazine-landing.js
  var import_magazine_landing_exports = {};
  __export(import_magazine_landing_exports, {
    default: () => import_magazine_landing_default
  });

  // tools/importer/parsers/cards-article.js
  function parse(element, { document: document2 }) {
    let items = Array.from(element.querySelectorAll("li.cmp-image-list__item, .cmp-image-list__item"));
    if (!items.length) {
      items = Array.from(element.querySelectorAll("article.cmp-image-list__item-content, .cmp-image-list__item-content"));
    }
    const cells = [];
    items.forEach((item) => {
      const img = item.querySelector(".cmp-image-list__item-image img, img");
      const bodyContent = [];
      const titleLink = item.querySelector("a.cmp-image-list__item-title-link, .cmp-image-list__item-title-link");
      const titleSpan = item.querySelector(".cmp-image-list__item-title");
      const titleText = (titleSpan ? titleSpan.textContent : titleLink ? titleLink.textContent : "").trim();
      if (titleText) {
        const heading = document2.createElement("h3");
        const href = titleLink ? titleLink.getAttribute("href") : null;
        if (href) {
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = titleText;
          heading.append(a);
        } else {
          heading.textContent = titleText;
        }
        bodyContent.push(heading);
      }
      const descSpan = item.querySelector(".cmp-image-list__item-description");
      const descText = descSpan ? descSpan.textContent.trim() : "";
      if (descText) {
        const p = document2.createElement("p");
        p.textContent = descText;
        bodyContent.push(p);
      }
      if (img || bodyContent.length) {
        cells.push([img || "", bodyContent.length ? bodyContent : ""]);
      }
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-article", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-members.js
  function parse2(element, { document: document2 }) {
    const parent = element.parentElement;
    const teasers = parent ? Array.from(parent.querySelectorAll(":scope > .teaser.cmp-teaser--secure")) : [element];
    if (!teasers.includes(element)) teasers.unshift(element);
    const cells = [];
    teasers.forEach((teaser) => {
      const img = teaser.querySelector(".cmp-teaser__image img, img");
      const body = [];
      const title = teaser.querySelector(".cmp-teaser__title");
      if (title && title.textContent.trim()) {
        const h3 = document2.createElement("h3");
        h3.textContent = title.textContent.trim();
        body.push(h3);
      }
      const desc = teaser.querySelector(".cmp-teaser__description");
      if (desc && desc.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = desc.textContent.trim();
        body.push(p);
      }
      const action = teaser.querySelector(".cmp-teaser__action-container");
      if (action && action.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = action.textContent.trim();
        body.push(p);
      }
      if (img || body.length) cells.push([img || "", body.length ? body : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-members", cells });
    element.replaceWith(block);
    teasers.forEach((t) => {
      if (t !== element) t.remove();
    });
  }

  // tools/importer/parsers/columns-featured.js
  function parse3(element, { document: document2 }) {
    const img = element.querySelector(".cmp-teaser__image img, .cmp-image img, img");
    const contentCell = [];
    const pretitle = element.querySelector(".cmp-teaser__pretitle");
    if (pretitle && pretitle.textContent.trim()) {
      const p = document2.createElement("p");
      const em = document2.createElement("em");
      em.textContent = pretitle.textContent.trim();
      p.append(em);
      contentCell.push(p);
    }
    const title = element.querySelector(".cmp-teaser__title, h1, h2, h3");
    if (title && title.textContent.trim()) {
      const heading = document2.createElement(/^h[1-6]$/i.test(title.tagName) ? title.tagName.toLowerCase() : "h2");
      heading.textContent = title.textContent.trim();
      contentCell.push(heading);
    }
    const desc = element.querySelector(".cmp-teaser__description");
    if (desc && desc.textContent.trim()) {
      if (desc.querySelector("p")) {
        desc.querySelectorAll("p").forEach((p) => contentCell.push(p));
      } else {
        const p = document2.createElement("p");
        p.textContent = desc.textContent.trim();
        contentCell.push(p);
      }
    }
    const ctas = Array.from(element.querySelectorAll(".cmp-teaser__action-link, a.cmp-teaser__action-link"));
    ctas.forEach((cta) => contentCell.push(cta));
    if (!img && !contentCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[img || "", contentCell.length ? contentCell : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-featured", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var H = { before: "beforeTransform", after: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === H.before) {
      WebImporter.DOMUtils.remove(element, [
        "#destination_publishing_iframe_wkndsite_0",
        "#toggleNav",
        "#mobileNav"
      ]);
    }
    if (hookName === H.after) {
      WebImporter.DOMUtils.remove(element, [
        "header.cmp-experiencefragment--header",
        "footer.cmp-experiencefragment--footer",
        "iframe",
        "link",
        "noscript"
      ]);
      element.querySelectorAll("meta").forEach((el) => el.remove());
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-magazine-landing.js
  var parsers = {
    "cards-article": parse,
    "cards-members": parse2,
    "columns-featured": parse3
  };
  var PAGE_TEMPLATE = {
    name: "magazine-landing",
    description: 'Magazine landing page: title, featured article teaser, "All Articles" card grid, and "Members Only" locked teasers.',
    urls: [
      "https://wknd.site/us/en/magazine.html"
    ],
    blocks: [
      {
        name: "columns-featured",
        instances: [".teaser.cmp-teaser--featured"]
      },
      {
        name: "cards-article",
        instances: [".image-list.list"]
      },
      {
        name: "cards-members",
        instances: [".teaser.cmp-teaser--secure"]
      }
    ],
    sections: [
      {
        id: "ml1",
        name: "Page title and featured article",
        selector: ["main.cmp-layout-container--fixed"],
        style: null,
        blocks: ["columns-featured"],
        defaultContent: [".title"]
      },
      {
        id: "ml2",
        name: "All Articles",
        selector: [".title.cmp-title--underline"],
        style: "underline",
        blocks: ["cards-article"],
        defaultContent: [".title.cmp-title--underline"]
      },
      {
        id: "ml3",
        name: "Members Only",
        selector: [".title.cmp-title--underline ~ .title.cmp-title--underline"],
        style: "underline",
        blocks: ["cards-members"],
        defaultContent: [".title.cmp-title--underline", ".text"]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_magazine_landing_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_magazine_landing_exports);
})();
