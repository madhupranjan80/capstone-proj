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

  // tools/importer/import-adventures.js
  var import_adventures_exports = {};
  __export(import_adventures_exports, {
    default: () => import_adventures_default
  });

  // tools/importer/parsers/carousel-hero.js
  function parse(element, { document: document2 }) {
    let slides = Array.from(element.querySelectorAll(".cmp-carousel__item"));
    if (!slides.length) {
      slides = Array.from(element.querySelectorAll(".cmp-teaser--hero, .teaser"));
    }
    const cells = [];
    slides.forEach((slide) => {
      const img = slide.querySelector(".cmp-teaser__image img, .cmp-image img, img");
      const contentCell = [];
      const title = slide.querySelector(".cmp-teaser__title, h1, h2, h3");
      if (title && title.textContent.trim()) {
        const heading = document2.createElement(/^h[1-6]$/i.test(title.tagName) ? title.tagName.toLowerCase() : "h2");
        heading.textContent = title.textContent.trim();
        contentCell.push(heading);
      }
      const desc = slide.querySelector(".cmp-teaser__description");
      if (desc && desc.textContent.trim()) {
        if (desc.querySelector("p")) {
          desc.querySelectorAll("p").forEach((p) => contentCell.push(p));
        } else {
          const p = document2.createElement("p");
          p.textContent = desc.textContent.trim();
          contentCell.push(p);
        }
      }
      const ctas = Array.from(slide.querySelectorAll(".cmp-teaser__action-link, a.cmp-teaser__action-link"));
      ctas.forEach((cta) => contentCell.push(cta));
      if (img || contentCell.length) {
        cells.push([img || "", contentCell.length ? contentCell : ""]);
      }
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-details.js
  function parse2(element, { document: document2 }) {
    const items = Array.from(
      element.querySelectorAll(".cmp-contentfragment__element")
    );
    const cells = [];
    items.forEach((item) => {
      const label = item.querySelector(".cmp-contentfragment__element-title, dt");
      const value = item.querySelector(".cmp-contentfragment__element-value, dd");
      const labelText = label ? label.textContent.trim() : "";
      const valueText = value ? value.textContent.trim() : "";
      if (labelText || valueText) {
        cells.push([labelText, valueText]);
      }
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "columns-details",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-content.js
  function buildImageListCards(panel, document2) {
    let items = Array.from(panel.querySelectorAll("li.cmp-image-list__item, .cmp-image-list__item"));
    if (!items.length) {
      items = Array.from(panel.querySelectorAll("article.cmp-image-list__item-content, .cmp-image-list__item-content"));
    }
    if (!items.length) return null;
    const ul = document2.createElement("ul");
    items.forEach((item) => {
      const li = document2.createElement("li");
      const img = item.querySelector(".cmp-image-list__item-image img, img");
      if (img) li.append(img);
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
        li.append(heading);
      }
      const descSpan = item.querySelector(".cmp-image-list__item-description");
      const descText = descSpan ? descSpan.textContent.trim() : "";
      if (descText) {
        const p = document2.createElement("p");
        p.textContent = descText;
        li.append(p);
      }
      if (img || titleText || descText) ul.append(li);
    });
    return ul.children.length ? ul : null;
  }
  function buildProseContent(panel) {
    const contentRoot = panel.querySelector(".cmp-contentfragment__elements") || panel.querySelector(".cmp-contentfragment") || panel;
    contentRoot.querySelectorAll(".cmp-contentfragment__title").forEach((h) => h.remove());
    return Array.from(
      contentRoot.querySelectorAll("p, ul, ol, h2, h3, h4, h5, h6, img")
    ).filter((node) => {
      if (node.tagName === "IMG") return true;
      return node.textContent.trim().length > 0;
    });
  }
  function parse3(element, { document: document2 }) {
    const tabs = Array.from(element.querySelectorAll(".cmp-tabs__tab"));
    const panels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    const cells = [];
    tabs.forEach((tab, i) => {
      const label = tab.textContent.trim();
      const panel = panels[i];
      let contentCell = [];
      if (panel) {
        if (panel.querySelector(".cmp-image-list__item")) {
          const cardGrid = buildImageListCards(panel, document2);
          if (cardGrid) contentCell = [cardGrid];
        } else {
          contentCell = buildProseContent(panel);
        }
      }
      if (label) {
        cells.push([label, contentCell.length ? contentCell : ""]);
      }
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "tabs-content",
      cells
    });
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

  // tools/importer/transformers/wknd-share.js
  var PINTEREST_HREF = "https://www.pinterest.com/pin/create/button/";
  var SHARE_HEADING_RE = /share this adventure/i;
  function transform3(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    const doc = element.ownerDocument;
    const heading = [...element.querySelectorAll("h1, h2, h3, h4, h5, h6")].find((h) => SHARE_HEADING_RE.test(h.textContent));
    const links = [];
    element.querySelectorAll(".sharing").forEach((sharing) => {
      sharing.querySelectorAll('a[href^="http"]').forEach((a) => {
        const href = a.getAttribute("href") || "";
        const label = a.textContent.trim();
        if (href && label) links.push({ href, label });
      });
      sharing.remove();
    });
    if (!links.length && heading) {
      links.push({ href: PINTEREST_HREF, label: "Pinterest" });
    }
    if (!links.length || !heading) return;
    const p = doc.createElement("p");
    links.forEach(({ href, label }, i) => {
      if (i > 0) p.append(doc.createTextNode(" "));
      const a = doc.createElement("a");
      a.setAttribute("href", href);
      a.textContent = label;
      p.append(a);
    });
    const titleWrapper = heading.closest(".title, .cmp-title") || heading;
    titleWrapper.after(p);
  }

  // tools/importer/import-adventures.js
  var parsers = {
    "carousel-hero": parse,
    "columns-details": parse2,
    "tabs-content": parse3
  };
  var PAGE_TEMPLATE = {
    name: "adventures",
    description: "Adventure detail page: hero carousel, title, attribute spec list, and tabbed content.",
    urls: [
      "https://wknd.site/us/en/adventures/bali-surf-camp.html"
    ],
    blocks: [
      {
        name: "carousel-hero",
        instances: [".carousel.cmp-carousel--mini", ".carousel.cmp-carousel--hero", ".cmp-carousel--mini"]
      },
      {
        name: "columns-details",
        instances: [".cmp-contentfragment", "article.cmp-contentfragment"]
      },
      {
        name: "tabs-content",
        instances: [".tabs.panelcontainer"]
      }
    ],
    sections: [
      {
        id: "rc1",
        name: "Breadcrumb",
        selector: [".breadcrumb"],
        style: null,
        blocks: [],
        defaultContent: [".breadcrumb"]
      },
      {
        id: "rc2",
        name: "Hero carousel",
        selector: [".carousel.cmp-carousel--mini"],
        style: null,
        blocks: ["carousel-hero"],
        defaultContent: []
      },
      {
        id: "rc4",
        name: "Adventure title and details",
        selector: ["main.cmp-layout-container--fixed"],
        style: null,
        blocks: ["columns-details"],
        defaultContent: [".title.cmp-title--underline"]
      },
      {
        id: "rc5",
        name: "Content tabs",
        selector: [".tabs.panelcontainer"],
        style: null,
        blocks: ["tabs-content"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    transform3,
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
  var import_adventures_default = {
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
  return __toCommonJS(import_adventures_exports);
})();
