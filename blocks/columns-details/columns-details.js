export default function decorate(block) {
  // Each row is a label/value pair: first cell = label, second cell = value.
  [...block.children].forEach((row) => {
    row.classList.add('columns-details-item');
    const cells = [...row.children];
    if (cells[0]) cells[0].classList.add('columns-details-label');
    if (cells[1]) cells[1].classList.add('columns-details-value');
  });
}
