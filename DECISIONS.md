# Engineering & Design Notes

## Design and architecture decisions

### Technology choices (that were not prescribed in the assignement)

- **npm workspaces:** A single lockfile and root commands coordinate the frontend and backend without introducing a separate monorepo tool.
- **Nginx:** Serves the production Angular build and proxies `/api` on the same origin, including fallback for shared product links.
- **Playwright:** Supplements the required Jest suites with browser journeys on desktop and mobile viewports.
- **ESLint and Prettier:** Provide shared linting and formatting checks across the repository.

### Architecture

## Product trade-offs

## Future work

- Better filtering, sorting and searching, both design and completeness wise.
- Better safeguards against adversarial and large volume data - moderation and more optimized calculation of average review value, prevent fake reviews, single person reviewing x times, etc.
- Explore a denser desktop catalogue layout, including a data grid approach
- Show reviews in the catalogue, not only in detailed view
- Show aggregate review more prominently, not only at the bottom, especially in the mobile view.
- Load test with expected 50k and define indexes to make sure database is quick enough
