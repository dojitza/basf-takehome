import { expect, test, type Page } from '@playwright/test';

const products = (page: Page) =>
  page.getByRole('list', { name: /products|results/i });
const rows = (page: Page) => products(page).getByRole('listitem');
const search = (page: Page) =>
  page
    .getByRole('searchbox', { name: /search|product|sku/i })
    .or(page.getByRole('textbox', { name: /search|product|sku/i }));
const next = (page: Page) =>
  page.getByRole('button', { name: /load (next|more)/i });

async function openCatalogue(page: Page) {
  await page.goto('/');
  await expect(products(page)).toContainText('Fixture Product 001');
}

async function scrollToLastRow(page: Page) {
  await rows(page).last().scrollIntoViewIfNeeded();
}

test('a catalogue search and selected criteria survive sharing and reload', async ({
  page,
  browser,
  baseURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openCatalogue(page);
  await page.getByRole('button', { name: /^search$/i }).click();
  await search(page).fill('Fixture Product 006');
  await search(page).press('Enter');
  await expect(products(page)).toContainText('Fixture Product 006');
  await expect(products(page)).not.toContainText('Fixture Product 001');
  await page.getByRole('button', { name: /filter/i }).click();
  const dialog = page.getByRole('dialog', { name: /filter/i });
  await dialog.getByRole('checkbox', { name: /discontinued/i }).check();
  await dialog.getByRole('checkbox', { name: /^food$/i }).check();
  await dialog.getByRole('button', { name: /apply/i }).click();
  await page.getByRole('button', { name: /sort/i }).click();
  const sorting = page.getByRole('dialog', { name: /sort/i });
  await sorting.getByRole('radio', { name: /name.*z.*a/i }).check();
  await sorting.getByRole('button', { name: /apply/i }).click();
  await expect(products(page)).toContainText('Fixture Product 006');
  await expect
    .poll(() => new URL(page.url()).searchParams.get('search'))
    .toBe('Fixture Product 006');
  const shared = page.url();
  const other = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
  });
  try {
    const recipient = await other.newPage();
    await recipient.goto(shared);
    await expect(products(recipient)).toContainText('Fixture Product 006');
    await expect(
      recipient.getByRole('button', { name: /remove.*discontinued/i }),
    ).toBeVisible();
    await expect(
      recipient.getByRole('button', { name: /remove.*food/i }),
    ).toBeVisible();
    await expect(recipient.getByText(/discontinued/i).first()).toBeVisible();
    await recipient.reload();
    await expect(products(recipient)).toContainText('Fixture Product 006');
    await expect(
      recipient.getByRole('button', { name: /remove.*food/i }),
    ).toBeVisible();
    await recipient.getByRole('button', { name: /sort/i }).click();
    const restoredSort = recipient.getByRole('dialog', { name: /sort/i });
    await expect(
      restoredSort.getByRole('radio', { name: /name.*z.*a/i }),
    ).toBeChecked();
    await recipient.keyboard.press('Escape');
    await recipient.setViewportSize({ width: 1280, height: 720 });
    await expect(search(recipient)).toHaveValue('Fixture Product 006');
    await search(recipient).fill('Fixture Product 012');
    await expect(products(recipient)).toContainText('Fixture Product 012');
    await search(recipient).press('Tab');
    await expect
      .poll(() => new URL(recipient.url()).searchParams.get('search'))
      .toBe('Fixture Product 012');
    await recipient.goBack();
    await expect(search(recipient)).toHaveValue('Fixture Product 006');
    await expect(products(recipient)).toContainText('Fixture Product 006');
  } finally {
    await other.close();
  }
});

test('automatically appends batches, supports the manual path, and stops at the end', async ({
  page,
}) => {
  const fixtureCount = 120;
  await openCatalogue(page);
  let count = await rows(page).count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(fixtureCount);
  await scrollToLastRow(page);
  await expect.poll(() => rows(page).count()).toBeGreaterThan(count);

  // Start a fresh traversal so the manual path is exercised even if the
  // automatically loaded batch happened to contain the remaining products.
  await openCatalogue(page);
  count = await rows(page).count();
  await next(page).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => rows(page).count()).toBeGreaterThan(count);
  while ((await rows(page).count()) < fixtureCount) {
    count = await rows(page).count();
    await scrollToLastRow(page);
    await expect.poll(() => rows(page).count()).toBeGreaterThan(count);
  }
  await expect(rows(page)).toHaveCount(fixtureCount);
  await expect(
    page.getByText(/all products loaded|end of results|no more products/i),
  ).toBeVisible();
});

test('mobile search and filters remain usable without page overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.clock.install();
  let productRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/products') productRequests++;
  });
  await openCatalogue(page);
  await page.getByRole('button', { name: /^search$/i }).click();
  const beforeTyping = productRequests;
  await search(page).fill('Uncommitted draft');
  await page.clock.fastForward(1500);
  expect(productRequests).toBe(beforeTyping);
  await page.clock.resume();
  await page.getByRole('button', { name: /back|close/i }).click();
  await expect(products(page)).toContainText('Fixture Product 001');
  expect(new URL(page.url()).searchParams.get('search')).toBeNull();
  await page.getByRole('button', { name: /^search$/i }).click();
  await search(page).fill('Fixture Product');
  await search(page).press('Enter');
  await expect.poll(() => productRequests).toBeGreaterThan(beforeTyping);
  await expect(products(page)).toContainText('Fixture Product 001');
  await page.getByRole('button', { name: /filter/i }).click();
  const dialog = page.getByRole('dialog', { name: /filter/i });
  const active = dialog.getByRole('checkbox', { name: /^active$/i });
  const original = await active.isChecked();
  await active.setChecked(!original);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: /filter/i }).click();
  const reopened = page.getByRole('dialog', { name: /filter/i });
  const restored = reopened.getByRole('checkbox', { name: /^active$/i });
  expect(await restored.isChecked()).toBe(original);
  await restored.check();
  await reopened.getByRole('checkbox', { name: /phase.out/i }).check();
  await reopened.getByRole('checkbox', { name: /^coatings$/i }).check();
  await reopened.getByRole('checkbox', { name: /^food$/i }).check();
  await reopened.getByRole('button', { name: /apply/i }).click();
  const activeSelections = page
    .getByRole('region', { name: /active (filters|selections)/i })
    .or(page.getByRole('group', { name: /active (filters|selections)/i }));
  await expect(activeSelections).toBeVisible();
  const canScroll = await activeSelections.evaluate((element) => {
    const before = element.scrollLeft;
    element.scrollLeft = element.scrollWidth;
    return (
      element.scrollWidth > element.clientWidth && element.scrollLeft > before
    );
  });
  expect(canScroll).toBe(true);
  const activePill = page.getByRole('button', { name: /remove.*active/i });
  const coatingsPill = page.getByRole('button', { name: /remove.*coatings/i });
  await expect(activePill).toBeVisible();
  await expect(coatingsPill).toBeVisible();
  await activePill.click();
  await expect(activePill).not.toBeVisible();
  await expect(coatingsPill).toBeVisible();
  await page.getByRole('button', { name: /filter/i }).click();
  const clearing = page.getByRole('dialog', { name: /filter/i });
  await clearing.getByRole('button', { name: /clear/i }).click();
  await clearing.getByRole('button', { name: /apply/i }).click();
  await expect(coatingsPill).not.toBeVisible();
  await expect
    .poll(() => new URL(page.url()).searchParams.get('search'))
    .toBe('Fixture Product');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('keyboard focus enters and leaves the filter drawer and remains stable when results append', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openCatalogue(page);
  const filter = page.getByRole('button', { name: /filter/i });
  for (
    let i = 0;
    i < 30 &&
    !(await filter.evaluate((element) => element === document.activeElement));
    i++
  ) {
    await page.keyboard.press('Tab');
  }
  await expect(filter).toBeFocused();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: /filter/i });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    )
    .toBe(true);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(filter).toBeFocused();
  const before = await rows(page).count();
  await scrollToLastRow(page);
  await expect.poll(() => rows(page).count()).toBeGreaterThan(before);
  await expect(filter).toBeFocused();
});

test('a failed next batch preserves results and can be retried', async ({
  page,
}) => {
  let requests = 0;
  await page.route('**/api/products**', async (route) => {
    requests++;
    if (requests === 2) await route.abort('failed');
    else await route.continue();
  });
  await openCatalogue(page);
  const before = await rows(page).count();
  await scrollToLastRow(page);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(rows(page)).toHaveCount(before);
  await page.getByRole('button', { name: /retry/i }).click();
  await expect.poll(() => rows(page).count()).toBeGreaterThan(before);
});
