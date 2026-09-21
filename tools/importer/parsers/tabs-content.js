/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-content.
 * Base block: tabs
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.tabs.panelcontainer)
 * Generated: 2026-09-21
 *
 * Tabbed panel (Overview / Itinerary / What to Bring). Source is a .cmp-tabs with an
 * <ol class="cmp-tabs__tablist"> of <li class="cmp-tabs__tab"> labels and matching
 * <div class="cmp-tabs__tabpanel"> panels. Emits one 2-column row per tab:
 * [tab label, panel content]. The block's decorate() takes each row's first child as
 * the tab label and treats the row (panel) as the tabpanel, so cell 0 = label text,
 * cell 1 = the panel content nodes (paragraphs, images, lists).
 * The per-panel contentfragment __title (h3) is skipped — it duplicates the page H1.
 */
export default function parse(element, { document }) {
  const tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  const cells = [];
  tabs.forEach((tab, i) => {
    const label = tab.textContent.trim();
    const panel = panels[i];

    const contentCell = [];
    if (panel) {
      // Panel content lives inside the contentfragment's __elements container.
      // Fall back to the panel itself for non-contentfragment panels.
      const contentRoot = panel.querySelector('.cmp-contentfragment__elements')
        || panel.querySelector('.cmp-contentfragment')
        || panel;

      // Drop the duplicated contentfragment title (h3) before extracting.
      contentRoot
        .querySelectorAll('.cmp-contentfragment__title')
        .forEach((h) => h.remove());

      // Pull meaningful content nodes: paragraphs, headings, lists, images.
      const nodes = Array.from(
        contentRoot.querySelectorAll('p, ul, ol, h2, h3, h4, h5, h6, img'),
      ).filter((node) => {
        // Keep images always; keep text nodes only when they carry content.
        if (node.tagName === 'IMG') return true;
        return node.textContent.trim().length > 0;
      });

      contentCell.push(...nodes);
    }

    // Only emit a tab row when it has a label; keep 2 columns consistently.
    if (label) {
      cells.push([label, contentCell.length ? contentCell : '']);
    }
  });

  // Empty-block guard: no tabs found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'tabs-content',
    cells,
  });
  element.replaceWith(block);
}
