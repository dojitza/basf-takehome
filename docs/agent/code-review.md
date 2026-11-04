# Future code review passes

Status: deferred. These criteria guide future reviews; they are not findings about the current implementation or authorization to begin refactoring.

Review frontend and backend together, including data contracts and persistence behavior. Prioritize concrete correctness and maintainability issues:

- Readability: clear names, understandable control flow and comments explaining non-obvious decisions.
- Responsibilities: cohesive components and services, explicit state ownership and appropriate UI, application and persistence boundaries. Split code when responsibilities warrant it, not simply because a file is long.
- Duplication: consolidate repeated rules that must stay consistent. Avoid abstractions for merely similar code that may evolve independently.
- Correctness: validation, error handling, asynchronous state, query consistency and data integrity, including review preservation across imports.
- Verification: meaningful tests of observable behavior, edge cases and regressions; browser checks when interactions or mobile usability change.

## Suggested workflow for a future agreed review

1. Report concrete findings with code locations, impact and the smallest useful fix. Separate defects from optional improvements.
2. Agree a small batch before material structural changes. Preserve behavior unless a change is explicitly agreed.
3. Implement the batch, independently review the diff and run appropriate checks.
4. Report changes, verification and remaining gaps for human review.
5. Repeat while material findings remain, with at most five passes if selected. Stop when remaining suggestions are cosmetic or speculative.

Reviewer/fixer delegation, including a possible Luna fixer at max reasoning, was discussed as an option. It is deferred and must be explicitly selected when the review starts; no delegation has been performed for this documentation task.
