import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

const id1 = '00000000-0000-4000-8000-000000000001';
const id2 = '00000000-0000-4000-8000-000000000002';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const detailRecord = {
  id: id1,
  sku: 'P-001',
  name: 'Alpha',
  chemicalName: null,
  description: null,
  function: null,
  applicationArea: null,
  region: null,
  certifications: [],
  launchYear: null,
  status: 'ACTIVE',
  presentInLatestImport: true,
};

let fixture: ComponentFixture<App>;
let http: HttpTestingController;
let router: Router;

function root(): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function text(): string {
  return root().textContent?.replace(/\s+/g, ' ') ?? '';
}

async function update() {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function findButton(
  label: RegExp,
  container: ParentNode = root(),
): HTMLButtonElement | undefined {
  return [
    ...(container.querySelectorAll('button') as NodeListOf<HTMLButtonElement>),
  ].find(
    (b) =>
      label.test(b.textContent?.trim() ?? '') ||
      label.test(b.getAttribute('aria-label')?.trim() ?? ''),
  );
}

function button(
  label: RegExp,
  container: ParentNode = root(),
): HTMLButtonElement {
  const found = findButton(label, container);
  if (!found) throw new Error(`Missing button ${label}`);
  return found;
}

function findDialog(): HTMLElement | null {
  return root().querySelector<HTMLElement>('[role="dialog"]');
}

function selectRating(stars: number) {
  const dialog = findDialog() ?? root();
  const pattern = new RegExp(`^${stars}\\s*stars?`, 'i');
  const radioInput = [
    ...dialog.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  ].find((input) => {
    const aria = input.getAttribute('aria-label') ?? '';
    const parentText = input.closest('label')?.textContent?.trim() ?? '';
    const idAttr = input.id
      ? (dialog
          .querySelector(`label[for="${input.id}"]`)
          ?.textContent?.trim() ?? '')
      : '';
    return (
      pattern.test(aria) ||
      pattern.test(parentText) ||
      pattern.test(idAttr) ||
      input.value === String(stars)
    );
  });
  if (radioInput) {
    radioInput.checked = true;
    radioInput.dispatchEvent(new Event('change', { bubbles: true }));
    radioInput.click();
    return;
  }
  const roleRadio = [
    ...dialog.querySelectorAll<HTMLElement>('[role="radio"], button'),
  ].find(
    (el) =>
      pattern.test(el.getAttribute('aria-label') ?? '') ||
      pattern.test(el.textContent?.trim() ?? ''),
  );
  if (!roleRadio) throw new Error(`Missing star control for ${stars} stars`);
  roleRadio.click();
}

function nameInput(): HTMLInputElement {
  const dialog = findDialog() ?? root();
  const input =
    [...dialog.querySelectorAll<HTMLInputElement>('input')].find(
      (el) => el.type !== 'radio' && el.type !== 'checkbox',
    ) ?? null;
  if (!input) throw new Error('Missing reviewer name input');
  return input;
}

function commentInput(): HTMLTextAreaElement {
  const dialog = findDialog() ?? root();
  const textarea = dialog.querySelector<HTMLTextAreaElement>('textarea');
  if (!textarea) throw new Error('Missing review comment textarea');
  return textarea;
}

function fillControl(
  control: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  control.value = value;
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
}

function dismissDialog() {
  const dialog = findDialog();
  const closeBtn = dialog
    ? findButton(/back to product|cancel|close/i, dialog)
    : undefined;
  if (closeBtn) {
    closeBtn.click();
    return;
  }
  (dialog ?? document).dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
}

function expectReviewsGet(productId = id1, cursor?: string): TestRequest {
  const matches = http
    .match(
      (req) =>
        req.method === 'GET' &&
        req.url === `/api/products/${productId}/reviews` &&
        (cursor === undefined
          ? !req.params.has('cursor')
          : req.params.get('cursor') === cursor),
    )
    .filter((req) => !req.cancelled);
  expect(matches).toHaveLength(1);
  return matches[0];
}

function expectReviewPost(productId = id1): TestRequest {
  const matches = http
    .match(
      (req) =>
        req.method === 'POST' &&
        req.url === `/api/products/${productId}/reviews`,
    )
    .filter((req) => !req.cancelled);
  expect(matches).toHaveLength(1);
  return matches[0];
}

async function render(productOverride: Partial<typeof detailRecord> = {}) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [
      ...appConfig.providers,
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  }).compileComponents();
  http = TestBed.inject(HttpTestingController);
  router = TestBed.inject(Router);
  fixture = TestBed.createComponent(App);
  const targetId = productOverride.id ?? id1;
  await router.navigateByUrl(`/products/${targetId}`);
  await update();
  http
    .expectOne(`/api/products/${targetId}`)
    .flush({ ...detailRecord, ...productOverride });
  await update();
}

afterEach(() => {
  if (http) http.verify({ ignoreCancelled: true });
  fixture?.destroy();
  TestBed.resetTestingModule();
});

describe('reviews on product details (v0.3.0)', () => {
  it('shows the exact empty state and write action without Load more or null/NaN when 0 reviews exist', async () => {
    await render();
    expectReviewsGet().flush({
      items: [],
      nextCursor: null,
      summary: { count: 0, average: null },
    });
    await update();

    expect(text()).toContain(
      'No customer reviews yet. Be the first to share your experience with this product.',
    );
    expect(button(/write a review/i)).toBeTruthy();
    expect(findButton(/load more/i)).toBeUndefined();
    expect(text()).not.toMatch(/\bnull\b|\bNaN\b/);
  });

  it('shows the aggregate average and count across all reviews, renders Anonymous customer fallback, and escapes executable markup', async () => {
    await render();
    expectReviewsGet().flush({
      items: [
        {
          id: '00000000-0000-4000-8000-000000000901',
          rating: 5,
          reviewerName: null,
          comment: 'Helpful <script>window.__xss = 1</script>',
          createdAt: '2026-01-02T00:00:00.000Z',
        },
        {
          id: '00000000-0000-4000-8000-000000000902',
          rating: 4,
          reviewerName: '<img src=x onerror=alert(1)>',
          comment: null,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      nextCursor: null,
      summary: { count: 14, average: 4.3 },
    });
    await update();

    expect(text()).toContain('4.3');
    expect(text()).toMatch(/14\s*reviews/i);
    expect(text()).toContain('Anonymous customer');
    expect(text()).toContain('Helpful <script>window.__xss = 1</script>');
    expect(text()).toContain('<img src=x onerror=alert(1)>');
    expect(root().querySelector('img[onerror]')).toBeNull();
    expect(text()).not.toContain('00000000-0000-4000-8000-000000000901');
  });

  it('remains available for reading and writing on absent and discontinued products', async () => {
    await render({
      status: 'DISCONTINUED',
      presentInLatestImport: false,
    });
    expectReviewsGet().flush({
      items: [
        {
          id: 'review-absent-1',
          rating: 4,
          reviewerName: 'Pat',
          comment: 'Still used in legacy formulation.',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      nextCursor: null,
      summary: { count: 1, average: 4 },
    });
    await update();

    expect(text()).toContain('Still used in legacy formulation.');
    const writeBtn = button(/write a review/i);
    expect(writeBtn.disabled).toBe(false);
    writeBtn.click();
    await update();
    expect(findDialog()).not.toBeNull();
  });

  it('keeps product details and Write a review usable when initial reviews fail, and guards Retry against duplicate clicks', async () => {
    await render();
    expectReviewsGet().flush('unavailable', {
      status: 503,
      statusText: 'Unavailable',
    });
    await update();

    expect(text()).toContain('Alpha');
    const writeBtn = button(/write a review/i);
    expect(writeBtn).toBeTruthy();

    // Opening and closing the blank review dialog still works while the list is in an error state.
    writeBtn.click();
    await update();
    expect(findDialog()).not.toBeNull();
    dismissDialog();
    await update();
    expect(findDialog()).toBeNull();

    // Clicking Retry twice while in-flight sends only a single GET request.
    const retryBtn = button(/retry/i);
    retryBtn.click();
    retryBtn.click();
    await update();

    expectReviewsGet().flush({
      items: [],
      nextCursor: null,
      summary: { count: 0, average: null },
    });
    await update();
    expect(text()).toContain('No customer reviews yet');
  });

  it('keeps loaded reviews visible when loading the next batch fails, guards Load more/Retry against duplicate clicks, and appends on retry', async () => {
    await render();
    expectReviewsGet().flush({
      items: [
        {
          id: 'review-1',
          rating: 5,
          reviewerName: 'Alex',
          comment: 'First review',
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      nextCursor: 'next-page',
      summary: { count: 2, average: 4.5 },
    });
    await update();

    const loadMoreBtn = button(/load more/i);
    loadMoreBtn.click();
    loadMoreBtn.click();
    await update();

    expectReviewsGet(id1, 'next-page').flush('unavailable', {
      status: 503,
      statusText: 'Unavailable',
    });
    await update();

    expect(text()).toContain('First review');
    const retryBtn = button(/retry/i);
    retryBtn.click();
    retryBtn.click();
    await update();

    expectReviewsGet(id1, 'next-page').flush({
      items: [
        {
          id: 'review-2',
          rating: 4,
          reviewerName: 'Bea',
          comment: 'Second review',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      nextCursor: null,
      summary: { count: 2, average: 4.5 },
    });
    await update();

    expect(text()).toContain('First review');
    expect(text()).toContain('Second review');
    expect(findButton(/load more/i)).toBeUndefined();
  });

  it('closes a blank review form without confirmation and restores focus to Write a review', async () => {
    await render();
    expectReviewsGet().flush({
      items: [],
      nextCursor: null,
      summary: { count: 0, average: null },
    });
    await update();

    const writeBtn = button(/write a review/i);
    writeBtn.click();
    await update();
    expect(findDialog()).not.toBeNull();

    dismissDialog();
    await update();

    expect(findDialog()).toBeNull();
    expect(findButton(/keep editing/i)).toBeUndefined();
    expect(findButton(/discard review/i)).toBeUndefined();
    expect(document.activeElement).toBe(writeBtn);
  });

  it.each(['rating-only', 'name-only', 'comment-only'] as const)(
    'prompts for discard confirmation when %s has been entered, supports Keep editing and Discard review, and resets draft on discard',
    async (dirtyMode) => {
      await render();
      expectReviewsGet().flush({
        items: [],
        nextCursor: null,
        summary: { count: 0, average: null },
      });
      await update();

      const writeBtn = button(/write a review/i);
      writeBtn.click();
      await update();

      if (dirtyMode === 'rating-only') {
        selectRating(3);
      } else if (dirtyMode === 'name-only') {
        fillControl(nameInput(), 'Alex');
      } else {
        fillControl(commentInput(), 'Draft experience');
      }
      await update();

      dismissDialog();
      await update();

      const keepBtn = button(/keep editing/i);
      const discardBtn = button(/discard review/i);
      expect(keepBtn).toBeTruthy();
      expect(discardBtn).toBeTruthy();

      // Keep editing preserves the entered draft and returns to the form.
      keepBtn.click();
      await update();
      expect(findButton(/discard review/i)).toBeUndefined();
      expect(findDialog()).not.toBeNull();
      if (dirtyMode === 'name-only') {
        expect(nameInput().value).toBe('Alex');
      } else if (dirtyMode === 'comment-only') {
        expect(commentInput().value).toBe('Draft experience');
      }

      // Dismiss again and confirm Discard review.
      dismissDialog();
      await update();
      button(/discard review/i).click();
      await update();

      expect(findDialog()).toBeNull();
      expect(document.activeElement).toBe(writeBtn);

      // Reopening starts with a clean blank form.
      writeBtn.click();
      await update();
      expect(nameInput().value).toBe('');
      expect(commentInput().value).toBe('');
    },
  );

  it('rejects submitting without a rating, clears the error when a rating is selected, and enforces field max lengths', async () => {
    await render();
    expectReviewsGet().flush({
      items: [],
      nextCursor: null,
      summary: { count: 0, average: null },
    });
    await update();

    button(/write a review/i).click();
    await update();

    expect(nameInput().maxLength).toBe(100);
    expect(commentInput().maxLength).toBe(1000);

    button(/submit/i).click();
    await update();

    expect(text()).toContain('Please select a rating between 1 and 5 stars');
    http.expectNone(
      (req) =>
        req.method === 'POST' && req.url === `/api/products/${id1}/reviews`,
    );

    selectRating(4);
    await update();
    expect(text()).not.toContain(
      'Please select a rating between 1 and 5 stars',
    );
  });

  it('disables form controls while submission is in-flight, closes modal, shows success banner, and reloads first batch and aggregate on success', async () => {
    await render();
    expectReviewsGet().flush({
      items: [],
      nextCursor: null,
      summary: { count: 0, average: null },
    });
    await update();

    button(/write a review/i).click();
    await update();

    selectRating(5);
    fillControl(nameInput(), 'Samira');
    fillControl(commentInput(), 'Excellent stability.');
    await update();

    const submitBtn = button(/submit/i);
    submitBtn.click();
    // Clicking again while in-flight must not send a second POST.
    submitBtn.click();
    await update();

    const postReq = expectReviewPost();
    expect(postReq.request.body).toMatchObject({
      rating: 5,
      reviewerName: 'Samira',
      comment: 'Excellent stability.',
    });
    expect(postReq.request.body.submissionId).toMatch(UUID_REGEX);
    expect(nameInput().disabled).toBe(true);
    expect(commentInput().disabled).toBe(true);
    expect(submitBtn.disabled).toBe(true);

    postReq.flush(
      {
        id: 'new-review-1',
        rating: 5,
        reviewerName: 'Samira',
        comment: 'Excellent stability.',
        createdAt: '2026-03-01T10:00:00.000Z',
      },
      { status: 201, statusText: 'Created' },
    );
    await update();

    // Form closes and triggers a fresh first-batch reload.
    expect(findDialog()).toBeNull();
    expect(text()).toContain('Thank you! Your review has been submitted');

    expectReviewsGet().flush({
      items: [
        {
          id: 'new-review-1',
          rating: 5,
          reviewerName: 'Samira',
          comment: 'Excellent stability.',
          createdAt: '2026-03-01T10:00:00.000Z',
        },
      ],
      nextCursor: null,
      summary: { count: 1, average: 5 },
    });
    await update();

    expect(text()).toContain('Samira');
    expect(text()).toContain('Excellent stability.');
    expect(text()).toMatch(/1\s*review\b/i);
  });

  it('shows the review-loading error without claiming submission failed if the post-submit refresh GET fails', async () => {
    await render();
    expectReviewsGet().flush({
      items: [],
      nextCursor: null,
      summary: { count: 0, average: null },
    });
    await update();

    button(/write a review/i).click();
    await update();
    selectRating(4);
    await update();
    button(/submit/i).click();
    await update();

    expectReviewPost().flush(
      {
        id: 'new-review-2',
        rating: 4,
        reviewerName: null,
        comment: null,
        createdAt: '2026-03-01T10:00:00.000Z',
      },
      { status: 201, statusText: 'Created' },
    );
    await update();

    // Refresh GET fails with 503:
    expectReviewsGet().flush('unavailable', {
      status: 503,
      statusText: 'Unavailable',
    });
    await update();

    expect(findDialog()).toBeNull();
    expect(text()).toContain('Thank you! Your review has been submitted');
    expect(button(/retry/i)).toBeTruthy();
  });

  it('reuses submissionId when retrying unchanged normalized content after a failure, and generates a new submissionId when edited or on a subsequent review', async () => {
    await render();
    expectReviewsGet().flush({
      items: [],
      nextCursor: null,
      summary: { count: 0, average: null },
    });
    await update();

    button(/write a review/i).click();
    await update();
    selectRating(4);
    fillControl(nameInput(), 'Alex');
    fillControl(commentInput(), 'Initial draft');
    await update();

    // 1. First submission fails with 503
    button(/submit/i).click();
    await update();
    const firstPost = expectReviewPost();
    const firstId = firstPost.request.body.submissionId as string;
    expect(firstId).toMatch(UUID_REGEX);
    firstPost.flush('unavailable', {
      status: 503,
      statusText: 'Unavailable',
    });
    await update();

    expect(findDialog()).not.toBeNull();
    expect(nameInput().disabled).toBe(false);
    expect(commentInput().disabled).toBe(false);
    expect(nameInput().value).toBe('Alex');
    expect(commentInput().value).toBe('Initial draft');
    expect(text()).toMatch(/error|unable|failed/i);

    // 2. Adding only surrounding whitespace preserves the same normalized content -> reuses firstId
    fillControl(nameInput(), '  Alex  ');
    fillControl(commentInput(), '  Initial draft\n');
    await update();
    button(/submit|retry/i, findDialog()!).click();
    await update();
    const secondPost = expectReviewPost();
    const secondId = secondPost.request.body.submissionId as string;
    expect(secondId).toBe(firstId);
    secondPost.flush('unavailable', {
      status: 503,
      statusText: 'Unavailable',
    });
    await update();

    // 3. Editing the comment to different normalized content -> generates a new submissionId
    fillControl(commentInput(), 'Updated after failure');
    await update();
    button(/submit|retry/i, findDialog()!).click();
    await update();
    const thirdPost = expectReviewPost();
    const thirdId = thirdPost.request.body.submissionId as string;
    expect(thirdId).toMatch(UUID_REGEX);
    expect(thirdId).not.toBe(firstId);
    thirdPost.flush(
      {
        id: 'review-saved-1',
        rating: 4,
        reviewerName: 'Alex',
        comment: 'Updated after failure',
        createdAt: '2026-03-01T10:00:00.000Z',
      },
      { status: 201, statusText: 'Created' },
    );
    await update();
    expectReviewsGet().flush({
      items: [
        {
          id: 'review-saved-1',
          rating: 4,
          reviewerName: 'Alex',
          comment: 'Updated after failure',
          createdAt: '2026-03-01T10:00:00.000Z',
        },
      ],
      nextCursor: null,
      summary: { count: 1, average: 4 },
    });
    await update();

    // 4. Opening the dialog again for another review generates a brand-new submissionId
    button(/write a review/i).click();
    await update();
    selectRating(5);
    await update();
    button(/submit/i, findDialog()!).click();
    await update();
    const fourthPost = expectReviewPost();
    const fourthId = fourthPost.request.body.submissionId as string;
    expect(fourthId).toMatch(UUID_REGEX);
    expect(fourthId).not.toBe(thirdId);
    fourthPost.flush(
      {
        id: 'review-saved-2',
        rating: 5,
        reviewerName: null,
        comment: null,
        createdAt: '2026-03-01T10:01:00.000Z',
      },
      { status: 201, statusText: 'Created' },
    );
    await update();
    expectReviewsGet().flush({
      items: [],
      nextCursor: null,
      summary: { count: 2, average: 4.5 },
    });
    await update();
  });

  it('cancels or ignores stale review responses and errors when navigating to another product', async () => {
    await render();
    const firstReviewsReq = expectReviewsGet(id1);

    // Navigate to product 2 before product 1's reviews resolve.
    await router.navigateByUrl(`/products/${id2}`);
    await update();
    http.expectOne(`/api/products/${id2}`).flush({
      ...detailRecord,
      id: id2,
      sku: 'P-002',
      name: 'Beta',
    });
    await update();

    const secondReviewsReq = expectReviewsGet(id2);
    secondReviewsReq.flush({
      items: [
        {
          id: 'beta-review',
          rating: 5,
          reviewerName: 'Bea',
          comment: 'Beta review content',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      nextCursor: null,
      summary: { count: 1, average: 5 },
    });
    await update();

    if (!firstReviewsReq.cancelled) {
      firstReviewsReq.flush({
        items: [
          {
            id: 'stale-alpha-review',
            rating: 1,
            reviewerName: 'Stale Reviewer',
            comment: 'Stale Alpha review should never appear on Beta',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        nextCursor: null,
        summary: { count: 99, average: 1 },
      });
      await update();
    }

    expect(text()).toContain('Beta review content');
    expect(text()).not.toContain(
      'Stale Alpha review should never appear on Beta',
    );
    expect(text()).not.toContain('99');
  });
});
