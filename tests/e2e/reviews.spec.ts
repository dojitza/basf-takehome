import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

const seededReviewsProduct = '/products/00000000-0000-4000-8000-000000000020';
const absentProduct = '/products/00000000-0000-4000-8000-000000000121';

test.beforeEach(({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
});

for (const [viewportIndex, viewport] of [
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
].entries()) {
  const isMobile = viewport.width <= 600;
  // Dedicated fixture products per viewport prevent cross-test state pollution.
  const emptyValidationProduct = `/products/00000000-0000-4000-8000-00000000001${viewportIndex * 4 + 1}`;
  const errorRecoveryProduct = `/products/00000000-0000-4000-8000-00000000001${viewportIndex * 4 + 2}`;
  const submissionProduct = `/products/00000000-0000-4000-8000-00000000001${viewportIndex * 4 + 3}`;
  const retryProduct = `/products/00000000-0000-4000-8000-00000000001${viewportIndex * 4 + 4}`;

  test.describe(`reviews at ${viewport.width}px`, () => {
    test.use({ viewport });
    test.setTimeout(10000);

    test('closes a blank form without confirmation, validates rating, and protects a dirty draft across rating and text', async ({
      page,
    }) => {
      await page.goto(emptyValidationProduct);
      await expect(
        page.getByText(
          'No customer reviews yet. Be the first to share your experience with this product.',
        ),
      ).toBeVisible();

      const trigger = page.getByRole('button', { name: /write a review/i });
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Verify desktop centered modal vs mobile full-screen sheet with Back to product
      const box = await dialog.boundingBox();
      expect(box).not.toBeNull();
      if (isMobile) {
        expect(box!.width).toBeGreaterThanOrEqual(viewport.width - 2);
        const backBtn = dialog.getByRole('button', {
          name: /back to product/i,
        });
        await expect(backBtn).toBeVisible();
        await backBtn.click();
      } else {
        expect(box!.width).toBeLessThan(viewport.width);
        await page.keyboard.press('Escape');
      }

      // Closing a blank form requires no confirmation and returns focus to Write a review
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();

      // Reopen, submit with 0 stars -> inline validation error
      await trigger.click();
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: /submit/i }).click();
      await expect(
        dialog.getByText('Please select a rating between 1 and 5 stars'),
      ).toBeVisible();

      // Selecting a rating alone makes the draft dirty and clears the rating error
      await dialog.getByRole('radio', { name: /3 stars?/i }).check();
      await expect(
        dialog.getByText('Please select a rating between 1 and 5 stars'),
      ).toHaveCount(0);
      await dialog.getByLabel(/name/i).fill('Alex');

      await page.keyboard.press('Escape');
      const confirmation = page
        .getByRole('dialog')
        .filter({ has: page.getByRole('button', { name: /keep editing/i }) });
      await expect(confirmation).toBeVisible();
      await confirmation.getByRole('button', { name: /keep editing/i }).click();
      await expect(dialog.getByLabel(/name/i)).toHaveValue('Alex');

      await page.keyboard.press('Escape');
      await confirmation
        .getByRole('button', { name: /discard review/i })
        .click();
      await expect(trigger).toBeFocused();

      await trigger.click();
      await expect(page.getByRole('dialog').getByLabel(/name/i)).toHaveValue(
        '',
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });

    test('keeps the product and write action available when reviews fail, then retries', async ({
      page,
    }) => {
      let reads = 0;
      await page.route('**/api/products/*/reviews*', async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        if (++reads === 1)
          return route.fulfill({ status: 503, body: 'Unavailable' });
        return route.continue();
      });
      await page.goto(errorRecoveryProduct);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(
        page.getByRole('button', { name: /write a review/i }),
      ).toBeVisible();
      await page.getByRole('button', { name: /retry/i }).click();
      await expect.poll(() => reads).toBeGreaterThanOrEqual(2);
      await expect(
        page.getByText(
          'No customer reviews yet. Be the first to share your experience with this product.',
        ),
      ).toBeVisible();
    });

    test('submits an anonymous review, transitions from empty state, and updates aggregate rating and count', async ({
      page,
    }) => {
      const comment = `Review ${randomUUID()}`;
      await page.goto(submissionProduct);
      await expect(
        page.getByText(
          'No customer reviews yet. Be the first to share your experience with this product.',
        ),
      ).toBeVisible();

      await page.getByRole('button', { name: /write a review/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('radio', { name: /5 stars?/i }).check();
      await dialog.getByLabel(/experience|comment/i).fill(comment);
      await dialog.getByRole('button', { name: /submit/i }).click();

      await expect(
        page.getByText('Thank you! Your review has been submitted'),
      ).toBeVisible();
      await expect(
        page.getByText(
          'No customer reviews yet. Be the first to share your experience with this product.',
        ),
      ).toHaveCount(0);
      await expect(page.getByText(comment, { exact: true })).toBeVisible();
      await expect(page.getByText('Anonymous customer').first()).toBeVisible();
      await expect(page.getByText(/1\s*review\b/i).first()).toBeVisible();
    });

    test('retains editable values after a failed submission, reuses submissionId on unchanged retry, and generates a new ID after editing', async ({
      page,
    }) => {
      const ids: string[] = [];
      await page.route('**/api/products/*/reviews', async (route) => {
        if (route.request().method() !== 'POST') return route.continue();
        ids.push(route.request().postDataJSON().submissionId as string);
        if (ids.length <= 2)
          return route.fulfill({ status: 503, body: 'Unavailable' });
        return route.continue();
      });
      await page.goto(retryProduct);
      const trigger = page.getByRole('button', { name: /write a review/i });
      await expect(trigger).toBeVisible();
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('radio', { name: /4 stars?/i }).check();
      await dialog.getByLabel(/name/i).fill('Retry customer');
      await dialog.getByLabel(/experience|comment/i).fill('Original comment');
      await dialog.getByRole('button', { name: /submit/i }).click();

      await expect(dialog.getByLabel(/name/i)).toHaveValue('Retry customer');
      await expect(dialog.getByLabel(/name/i)).toBeEditable();
      await expect(dialog.getByText(/error|unable|failed/i)).toBeVisible();

      // Unchanged retry reuses ids[0]
      await dialog.getByRole('button', { name: /submit|retry/i }).click();
      await expect.poll(() => ids.length).toBe(2);
      expect(ids[1]).toEqual(ids[0]);
      await expect(dialog.getByText(/error|unable|failed/i)).toBeVisible();

      // Editing after failure generates a new submissionId (ids[2] !== ids[1])
      await dialog
        .getByLabel(/experience|comment/i)
        .fill('Edited after uncertain failure');
      await dialog.getByRole('button', { name: /submit|retry/i }).click();

      await expect(
        page.getByText('Thank you! Your review has been submitted'),
      ).toBeVisible();
      await expect(
        page.getByText('Edited after uncertain failure', { exact: true }),
      ).toBeVisible();
      expect(ids).toHaveLength(3);
      expect(ids[2]).not.toEqual(ids[1]);
    });

    test('orders reviews newest first, loads the next batch with Load more, and recovers when a subsequent batch fails', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        window.IntersectionObserver =
          undefined as unknown as typeof IntersectionObserver;
      });
      let cursorFailures = 0;
      await page.route('**/api/products/*/reviews*', async (route) => {
        const reqUrl = new URL(route.request().url());
        if (
          route.request().method() === 'GET' &&
          reqUrl.searchParams.has('cursor') &&
          ++cursorFailures === 1
        ) {
          return route.fulfill({ status: 503, body: 'Unavailable' });
        }
        return route.continue();
      });

      await page.goto(seededReviewsProduct);
      await expect(page.getByText('4.5').first()).toBeVisible();
      await expect(page.getByText(/12\s*reviews/i).first()).toBeVisible();
      await expect(
        page.getByText('Seeded Review 12', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText('Seeded Review 03', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText('Seeded Review 02', { exact: true }),
      ).toHaveCount(0);

      // Verify newest-first visual ordering (Seeded Review 12 appears above Seeded Review 03)
      const topY12 = await page
        .getByText('Seeded Review 12', { exact: true })
        .boundingBox();
      const topY03 = await page
        .getByText('Seeded Review 03', { exact: true })
        .boundingBox();
      expect(topY12!.y).toBeLessThan(topY03!.y);

      // First Load more fails -> existing 10 reviews stay visible, retry loads remaining 2
      await page.getByRole('button', { name: /load more/i }).click();
      await expect(
        page.getByText('Seeded Review 12', { exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: /retry|load more/i }).click();

      await expect(
        page.getByText('Seeded Review 02', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText('Seeded Review 01', { exact: true }),
      ).toBeVisible();
    });
  });
}

test('allows reading and submitting a review on a product absent from the latest import', async ({
  page,
}) => {
  const comment = `Absent product review ${randomUUID()}`;
  await page.goto(absentProduct);
  await expect(
    page.getByRole('heading', { name: 'Fixture Product 121 Absent' }),
  ).toBeVisible();
  await expect(page.getByText('Unavailable').first()).toBeVisible();

  const trigger = page.getByRole('button', { name: /write a review/i });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: /5 stars?/i }).check();
  await dialog.getByLabel(/name/i).fill('Field Engineer');
  await dialog.getByLabel(/experience|comment/i).fill(comment);
  await dialog.getByRole('button', { name: /submit/i }).click();

  await expect(
    page.getByText('Thank you! Your review has been submitted'),
  ).toBeVisible();
  await expect(page.getByText(comment, { exact: true })).toBeVisible();
  await expect(page.getByText('Field Engineer')).toBeVisible();
});
