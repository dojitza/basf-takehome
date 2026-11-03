# Catalogue browsing — working plan

Status: discussion in progress. The outcome, scope, product behavior and component choices below are proposals, not implemented or approved requirements.

## Proposed outcome

A customer can browse imported products and search by name or SKU on desktop and mobile. The agreed direction is accessible automatic incremental loading; the API queries bounded batches in PostgreSQL. Product details, advanced filters and user reviews are later slices.

## Proposed end-to-end flow

This describes the read journey under discussion. The import exists today; the browsing screen, API and query do not. Request parameters, presentation and exact error behavior remain open.

```mermaid
sequenceDiagram
    actor Customer
    participant UI as Angular + PrimeNG
    participant API as NestJS API
    participant DB as PostgreSQL via Prisma

    Note over DB: Previously populated by the manual CSV import
    Customer->>UI: Open catalogue, search, or scroll for more
    UI->>UI: Show loading state
    UI->>API: Request products with search and batch parameters
    API->>API: Validate and normalize request
    alt Invalid request
        API-->>UI: Validation error
        UI-->>Customer: Explain the problem
    else Valid request
        API->>DB: Query matching products and total count
        alt Database query succeeds
            DB-->>API: Bounded page and count
            API-->>UI: Products and pagination metadata
            alt Products found
                UI-->>Customer: Show product results; load more automatically on scroll
            else No products found
                UI-->>Customer: Show empty or no-match state
            end
        else Database query fails
            DB-->>API: Query error
            API-->>UI: Service error
            UI-->>Customer: Show error and retry action
        end
    end
```

The frontend requests bounded batches; the API applies search, visibility rules and ordering before pagination. PrimeNG provides controls and presentation primitives; Angular owns request and display state. Details such as URL state, matching and which products are visible are still decisions, not implied by this diagram.

## Sharing and proposed frontend architecture

Agreed direction: a product link should open that product directly; a catalogue link should restore the current search, filters and sort. Exact shared scroll position remains undecided. The human also wants sharing an individual review; review flow and URL format remain to be designed. Avoid assumptions about review loading or anchors until that flow is agreed.

The following architecture is proposed for discussion; not implemented or approved:

- Angular Router owns addressable views: catalogue now, product details later, and eventually a stable way to identify a particular review. The catalogue URL carries committed search, filter and sort state, allowing reload, sharing, back and forward. Exact route names and serialization are provisional.
- A catalogue page coordinates the view. Product results and controls are focused components; mobile search and filter/sort drawer can be separate presentation components where their behavior warrants it. Reuse PrimeNG components rather than build a generic component framework. Whole-row links become functional when product details exist; do not create dead links.
- A feature-scoped state service coordinates URL state with transient UI state: draft input, open panels, loaded batches, loading/error/end states and requests. On query changes, reset results and cancel/ignore stale requests; prevent duplicate simultaneous batch loads. The API client owns HTTP details and typed response mapping. Consider built-in Angular signals and RxJS without introducing global state management prematurely.
- The API returns bounded batches and a continuation mechanism with stable ordering; frontend loading triggers as the customer scrolls, with an accessible manual request/retry fallback. Define behavior for keyboard and screen readers, loading announcements, end of results and return-to-list position. Exact pagination contract and restoration approach require discussion with backend and review of scale.
- Recent searches are local convenience state, not shared URL state. Storage medium, retention, deletion, behavior when storage is unavailable and whether it belongs in the first slice are open.
- Test behavior in frontend Jest (URL state, request races and meaningful UI states), backend integration where data access matters, and a small Playwright journey through isolated services. Review desktop/mobile interaction and keyboard behavior. Scope and fixtures require agreement before implementation.

## Proposed test coverage

The [behavioral test list](catalogue-browsing-tests.md) expands the proposed coverage across frontend state and integration, backend requests, real PostgreSQL and five Playwright journeys. It records unresolved contract decisions and separates conditional/review/detail coverage. The human requested implementing the list; conditional and later tests are logged in TODO.md. No browsing tests have been implemented or run at the time of the plan commit.

## Using the design references

The desktop and mobile images are visual references, not pixel-perfect implementation targets. Prefer PrimeNG's existing components, default behavior and accessibility features wherever they fit the agreed product behavior. Use the references to guide decisions where PrimeNG does not provide a component or an opinion, such as product-row content, layout and responsive composition. Apply the brand direction without recreating controls unnecessarily. The images contain illustrative data and are not behavioral specifications; verify accessibility and responsive behavior in the implementation.

## PrimeNG building blocks

The app already has PrimeNG 22.1.4 and the Aura preset. Use its default components as the starting point. Adapt their theme and any application-specific layout using the supplied brand reference; the visual treatment remains to be agreed. The installed public types expose the following:

- InputText for search; optionally IconField and Button if needed.
- DataView for a list template with lazy loading and pagination, or a simple semantic list with the standalone Paginator. DataView supplies the container and pagination, not the product content or layout; its installed API exposes lazy loading and total record count.
- Tag for a textual product status; Message for errors; Skeleton or ProgressSpinner for loading. Empty-state text and the retry action still need application behavior.
- Table is an alternative with lazy loading and built-in pagination; assess its mobile fit before choosing it. Card is available if individual cards help, but is not required.

References: [DataView](https://primeng.dev/dataview), [Paginator](https://primeng.dev/paginator), [Table](https://primeng.dev/table), [InputText](https://primeng.dev/inputtext), [Tag](https://primeng.dev/tag), [Message](https://primeng.dev/message).

## Brand reference received

The updated `basf-digital-product-reference.zip` contains a secondary working reference, example CSS tokens, six raster logo variants and a presentation template; it contains no font files. The logo files are CMYK JPEGs (1181 × 591), each showing a white lockup over a colored rectangular background. The reference describes them as intended for white backgrounds; confirm the intended use and digital suitability before applying them. The presentation is a visual reference, not an application component library. It distinguishes corporate color values from suggested software-specific tokens. It suggests restrained use of a selected corporate color, flat surfaces, subtle geometry and clear hierarchy; The official font page lists static Roboto for digital applications and provides a Roboto download; the download contents have not yet been checked. New Helvetica requires appropriate licensing, and the page restricts Arial outside office/Microsoft contexts, so do not treat the archive’s Arial fallback suggestion as a brand-approved choice. Check contrast and communicate status in words as well as color.

The reference notes that software spacing, radii, breakpoints and component details are product decisions, and that BASF identity/logo use and licensed font files require appropriate authorization. Do not recreate the logo or assume those suggested tokens are official UI standards. Product-specific PrimeNG theme and layout choices remain to be discussed; no theme changes or assets have been applied.

## Desktop direction

[Desktop design reference](catalogue-desktop-design-reference.png) illustrates the compact catalogue and automatic loading direction in a desktop-only ImageGen rendering. The revised concept reduces repeated blue labels, uses neutral supporting text and explores a whole-row hover treatment. The content and interactions shown are illustrative; human review is pending.

Do not include invented navigation links or an empty mobile hamburger; there are currently no corresponding routes. The human prefers each whole product row as the click target for its eventual details view. Use an accessible link with a clear keyboard focus indicator and generous touch target; avoid nesting unrelated interactive controls within it.

## Mobile direction

[Mobile design reference](catalogue-mobile-design-reference.png) illustrates the catalogue, filter/sort drawer and full-screen search. It is a concept, not a precise specification; product data and branding are illustrative.

The human likes a filter/sort drawer with pill controls and a horizontally scrolling row of active selections, plus a full-screen search view with recent searches. Optimize drawer controls for mobile: comfortably sized touch targets and spacing, readable labels, a scrollable panel that fits the viewport, and accessible focus/keyboard behavior. Details such as the exact filter choices, apply behavior and recent-search persistence remain open. The concept has not been implemented.

## Design and behavior still to decide

- Page layout, product information and responsive arrangement; how a product with no name is identified.
- Which availability states appear by default, their labels and explanatory text, and how customers eventually find products absent from the latest import. Status must be understandable without relying on color alone.
- Whether search is submitted or runs while typing, matching rules and clearing behavior; batch size, stable ordering, and how a new search resets results. Automatic loading must also have keyboard-accessible loading and retry, announcements, and sensible return-to-results behavior.
- Loading, empty catalogue, no matches, request failure and retry states, with accessible labels, focus behavior and announcements.
- How to serialize shareable catalogue state, when to deliver it, and how to restore a user’s position after returning from details; avoid presenting a link as functional until product details exist.
- API contract, validation, server-side pagination and suitable query performance for the expected catalogue size; verify choices with representative data instead of assuming that UI pagination makes queries efficient.
- Test boundaries, deterministic isolated browser fixtures and desktop/mobile browser review.

## Proposed representative behavior

A search for SKU P-10151 returns one product marked discontinued. A search without matches displays an understandable empty state; a failed request offers a way to retry. These are examples for discussion, not finalized acceptance criteria.
