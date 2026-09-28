# listing

Query-driven list of pages. Cards are built at runtime from `/query-index.json`,
so publishing a new page under the source folder makes it appear in every
listing — no code change and no re-authoring.

## Authoring (Document Authoring)

A two-column settings table:

| Listing |                  |
| ------- | ---------------- |
| Source  | /us/en/magazine/ |
| Sort    | newest           |
| Limit   | 4                |

- **Source** (required): folder whose pages are listed (the folder page itself is excluded).
- **Sort**: `newest` (most recently published first, default), `title` (A–Z) or `title-desc` (Z–A).
- **Limit**: maximum number of cards; leave out to list every page.

Rendered as a `cards-article` grid (image, linked title, description).

## Variants

### Listing (tabs)

Same settings, plus one row per tab: tab label in the first cell and the
activities it shows in the second (comma-separated, matched against the index
`activity` column; leave empty to show every page). Rendered as `tabs-content`.

| Listing (tabs) |                   |
| -------------- | ----------------- |
| Source         | /us/en/adventures/ |
| Sort           | title             |
| All            |                   |
| Climbing       | Rock Climbing     |
| Travel         | Social, Camping   |

## Index fields used

`path`, `title`, `description`, `image`, `lastModified`, and `activity` (for
the tabs variant; read from the first row of an adventure's `columns-details`
block by the site's index configuration).
