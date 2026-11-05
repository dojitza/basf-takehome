# Engineering & Design Notes

Agents - read the [AI_DECISIONS_LOG.md](AI_DECISIONS_LOG.md) as well for the full brief
Humans - continue reading this file

## Design and architecture decisions

### Technology choices (that were not prescribed in the assignment)

- **npm workspaces:** A single lockfile and root commands coordinate the frontend and backend without introducing a separate monorepo tool.
- **Nginx:** Serves the production Angular build and proxies `/api` on the same origin, including fallback for shared product links.
- **Playwright:** Supplements the required Jest suites with browser journeys on desktop and mobile viewports.
- **ESLint and Prettier:** Provide shared linting and formatting checks across the repository.

- **PrimeUI:** In order to stay compliant with the assignment's prescribed version of Angular, which at the moment of writing this is v22, I opted to use PrimeNG 22 to cleanly satisfy Angular's peer dependency. I could have opted for Angular 21 and Prime 21, but long term risk of using PrimeUI is still there. I would seriously reconsider using PrimeUI going forward due to their licensing terms. Some alternative tech that I would consider (that play nice with agents as well) are MaterialUI, Angular CDK + Custom SCSS/Tailwind, Spartan UI/Radix primitives, or even raw HTML5 + SCSS could work with agents.
  Because of this choice, we needed to license their code for this takehome; I used my personal licence for local dev and for the demo deployment. The README describes where to place your PrimeUI licence.

### Architecture and product choices

#### UI in general

I let the agent research BASF's brand image and guidelines and then use that while ideating the design. We use the official logo, colors and typography to align with the brand image.

#### Import script

I decided on an import script because I wanted to limit the scope. Any warnings and errors are reported in the CLI when the script is run, but the script is otherwise lenient and attempts to reconstruct the data of an imperfect invalid export to the best of its ability.
I would upgrade this by building a full import service that runs periodic imports and alerts stakeholders via email on any warnings and errors (see below what can cause them), and blocks the import on errors. I would do hardening on the PIM export side to clean up the data and normalize it so that our script/system can be a lot more strict on what it accepts as input.

Script features:

- **Full snapshot model & absence tracking:**
  Each CSV is treated as a complete catalogue. If an item is missing from the subsequent catalogue, we preserve it to not break any existing share links. To the user, we show those products as unavailable, but we distinguish them from the actual unavailable statuses by explicitly marking them as `isAbsent = true`.

- **Validation & normalization before write:**
  We reject PIM exports that do not have valid headers and normalize the status to capital letters.
  `active` -> `ACTIVE`, `phase-out` -> `PHASE_OUT`. If something then does not match, we mark the status as `UNKNOWN`. We show `UNKNOWN` as unavailable to the user. Four-digit launch years are parsed, while malformed or empty years (`n/a`) default to unknown.

- **Deduplication strategy:**
  Case-insensitive SKU identity is used. In the event of conflicting duplicate rows in a single file, the whole row with the most pessimistic status (`UNKNOWN` > `DISCONTINUED` > `PHASE_OUT` > `ACTIVE`) is chosen (breaking ties with the later row). We flag any duplicates.

- **Idempotent set-based updates:** Imports run inside a serializing database lock using set-based SQL via Prisma. Timestamps record `createdAt`, `updatedAt`, and `lastImportedAt` (only advancing `lastImportedAt` on unchanged records).

#### Catalogue

I decided for a clean search/filter/action bar and an infinite scroll list of products below. I did not opt for explicit pages since search/filters and product pages should make sure that users do not need to remember at which specific page they saw their product to come back to it. I decided to keep the contents of the list minimal for now and potentially expand in future iterations after user feedback.

Catalogue features:

- **Pagination & sorting:**
  Uses bounded offset pagination (default 30 items, maximum 100) with total record count and a deterministic order (`name ASC, sku ASC`).

- **Filtering & search:**
  Supports text search (matching product name or SKU), status filtering (active, phase-out, discontinued, and unavailable—which groups unknown status and absent items), and dynamic application area filters sourced from distinct imported records. I went with keyword match on title and SKU for simplicity, and would mark this as one of the first improvement areas if there was more time.

- **URL-driven criteria:**
  Catalogue query parameters (search query, selected filters, sort) are mirrored in the browser URL, making search states shareable and bookmarkable.

- **Responsive interaction & navigation:**
  Whole-card/row links navigate to `/products/:id` while preserving active catalogue criteria in query parameters, allowing seamless return navigation with restored filter state.

- **Design & visual cues:**
  Product cards show status chips with dedicated visual distinctions (neutral for active, subtle amber/yellow for phase-out, muted red for discontinued/unavailable), launch years, and pipe-delimited application tags.

#### Sharing

I decided against including scroll position in the shareable link of the results on the same grounds I rejected the explicit pages. Search and filters should help narrow down the list to a manageable number, so that long scrolls would not be necessary most of the time. Otherwise the shareable results link preserves all the filters, sorts, and search parameters to get 'exactly what I'm looking at' feel when sharing.

Sharing features:

- **Native Web Share & clipboard fallback:**
  Deep links to individual products or filtered catalogue views can be shared via the native `navigator.share` API on supported devices and secure contexts.

- **Graceful degradation:**
  When Web Share is unavailable (or permissions are denied), the app falls back to copying the URL to the clipboard with clear visual feedback (toast/notification) and a manual copy input fallback if clipboard access fails.

- **Single-origin SPA routing:**
  Shared deep links (`/products/:id`) and filter URLs are supported in production through Nginx fallback rules that route all non-API GET requests to `index.html`.

#### Reviews

I opted for a 5 star scale as a classic rating mechanism. I rejected like/dislike rating mechanism because of our domain - we are selling nuanced products that require thought and analysis when buying, a 1-5 rating scale is a good compromise between fidelity and simplicity. In addition to a more detailed review, it provides a valuable signal.

I deliberately scoped out any abuse prevention and moderation, as this is a big, big piece of work and needs a lot more time and attention. This includes reviewer identity, verified purchase gates etc.

Failure to load reviews does not block the product page otherwise.

I allowed reviews on absent/phased out products, but this one would require more domain knowledge to nail down. I assume this would be handled by regular cleanup of the catalogue to prevent phantom products from misleading users with recent review activity.

- **Data model & lifecycle:**
  Reviews are stored in a dedicated `Review` table referencing `productId`. Product re-imports and absence marking preserve all reviews intact. Reviews are accessible and readable even on discontinued or absent products.

- **Cursor-based pagination:**
  `GET /products/:id/reviews` returns batches (default 10, max 100) ordered strictly newest-first (`createdAt DESC, id DESC`), utilizing a composite cursor (`${createdAt}_${id}`) to avoid pagination drift when new reviews are posted concurrently.

- **Dynamic aggregate calculation:**
  Review count and average score are computed dynamically per request rather than stored as pre-aggregated fields, ensuring consistency.

- **Idempotency & retry semantics:**
  Review creation (`POST /products/:id/reviews`) requires a client-generated UUID `submissionId`. Identical replayed submissions return the existing review without duplicates, while reused IDs with conflicting payloads return a `409 Conflict`.

- **Form presentation & UX:**
  Star ratings (1–5) are required; reviewer name (up to 100 characters) and comment (up to 1,000 characters) are optional. Modals are centered on desktop and presented as full-screen sheets on mobile with focus trapping and unsaved draft discard confirmations.

## Future work

- Better filtering, sorting and searching, both design and completeness wise.
- Better safeguards against adversarial and large volume data - moderation and more optimized calculation of average review value, prevent fake reviews, single person reviewing x times, etc.
- Explore a denser desktop catalogue layout, including a data grid approach.
- Show reviews in the catalogue, not only in detailed view.
- Show aggregate review more prominently, not only at the bottom, especially in the mobile view.
- Load test with expected 50k and define indexes to make sure database is quick enough.
- Attention needs to be given to cleaning up the imported catalogue periodically as it grows and changes, since we preserve historical entries.
