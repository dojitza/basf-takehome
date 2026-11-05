import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

const product = '/products/00000000-0000-4000-8000-000000000001';

test.beforeEach(({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
});

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test.describe(`reviews at ${viewport.width}px`, () => {
    test.use({ viewport });
    test.setTimeout(7000);

    test('validates rating and protects an unfinished review', async ({
      page,
    }) => {
      await page.goto(product);
      const trigger = page.getByRole('button', { name: /write a review/i });
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: /submit/i }).click();
      await expect(
        dialog.getByText('Please select a rating between 1 and 5 stars'),
      ).toBeVisible();
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
      await page.goto(product);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(
        page.getByRole('button', { name: /write a review/i }),
      ).toBeVisible();
      await page.getByRole('button', { name: /retry/i }).click();
      await expect.poll(() => reads).toBeGreaterThanOrEqual(2);
      await expect(
        page.getByRole('button', { name: /write a review/i }),
      ).toBeVisible();
    });

    test('submits a review and shows it and the success message', async ({
      page,
    }) => {
      const comment = `Review ${randomUUID()}`;
      await page.goto(product);
      await page.getByRole('button', { name: /write a review/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('radio', { name: /5 stars?/i }).check();
      await dialog.getByLabel(/experience|comment/i).fill(comment);
      await dialog.getByRole('button', { name: /submit/i }).click();
      await expect(
        page.getByText('Thank you! Your review has been submitted'),
      ).toBeVisible();
      await expect(page.getByText(comment, { exact: true })).toBeVisible();
      await expect(page.getByText('Anonymous customer').first()).toBeVisible();
    });

    test('retains editable values after a failed submission and reuses the ID on unchanged retry', async ({
      page,
    }) => {
      const ids: string[] = [];
      await page.route('**/api/products/*/reviews', async (route) => {
        if (route.request().method() !== 'POST') return route.continue();
        ids.push(route.request().postDataJSON().submissionId as string);
        if (ids.length === 1)
          return route.fulfill({ status: 503, body: 'Unavailable' });
        return route.continue();
      });
      await page.goto(product);
      await page.getByRole('button', { name: /write a review/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('radio', { name: /4 stars?/i }).check();
      await dialog.getByLabel(/name/i).fill('Retry customer');
      await dialog.getByRole('button', { name: /submit/i }).click();
      await expect(dialog.getByLabel(/name/i)).toHaveValue('Retry customer');
      await expect(dialog.getByLabel(/name/i)).toBeEditable();
      await expect(dialog.getByText(/error|unable|failed/i)).toBeVisible();
      await dialog.getByRole('button', { name: /submit|retry/i }).click();
      await expect(
        page.getByText('Thank you! Your review has been submitted'),
      ).toBeVisible();
      expect(ids).toHaveLength(2);
      expect(ids[0]).toEqual(ids[1]);
    });
  });
}
