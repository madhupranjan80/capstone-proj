/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-details.
 * Base block: columns
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.cmp-contentfragment)
 * Generated: 2026-09-21
 *
 * Adventure attribute spec list. Source is a <dl class="cmp-contentfragment__elements">
 * with repeating <div class="cmp-contentfragment__element"> each holding a <dt> label
 * and a <dd> value. Emits one 2-column table row per label/value pair: [label, value].
 * The block's decorate() adds .columns-details-label to cell 0 and .columns-details-value
 * to cell 1, so every row must have exactly these two cells.
 * The contentfragment __title (h3) is skipped — it duplicates the page H1.
 */
export default function parse(element, { document }) {
  // Each attribute element carries a <dt> label and a <dd> value.
  const items = Array.from(
    element.querySelectorAll('.cmp-contentfragment__element'),
  );

  const cells = [];
  items.forEach((item) => {
    const label = item.querySelector('.cmp-contentfragment__element-title, dt');
    const value = item.querySelector('.cmp-contentfragment__element-value, dd');
    const labelText = label ? label.textContent.trim() : '';
    const valueText = value ? value.textContent.trim() : '';
    // Only emit rows that have at least a label; keep 2 columns consistently.
    if (labelText || valueText) {
      cells.push([labelText, valueText]);
    }
  });

  // Empty-block guard: nothing extractable (e.g. wrong contentfragment instance).
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-details',
    cells,
  });
  element.replaceWith(block);
}
