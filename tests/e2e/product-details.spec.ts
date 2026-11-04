import { expect, test, type Page } from '@playwright/test';

const results = (page: Page) =>
  page.getByRole('list', { name: /products|results/i });

const p001Id = '00000000-0000-4000-8000-000000000001';
const p002Id = '00000000-0000-4000-8000-000000000002';
const p003Id = '00000000-0000-4000-8000-000000000003';
const p004Id = '00000000-0000-4000-8000-000000000004';
const p121AbsentDiscontinuedId = '00000000-0000-4000-8000-000000000121';
const p122UnnamedMissingId = '00000000-0000-4000-8000-000000000122';

test.beforeEach(({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
});

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test.describe(`product navigation at ${viewport.width}px`, () => {
    test.use({ viewport });

    test('opens a whole-row product link, moves focus to the heading, carries criteria and returns to the top', async ({
      page,
      browser,
      baseURL,
    }) => {
      await page.goto('/?search=Fixture%20Product%200&sort=name-desc');
      const list = results(page);
      await expect(list).toBeVisible();
      const firstRow = list.getByRole('listitem').first();
      const product = firstRow.getByRole('link');
      await expect(product).toBeVisible();

      // Whole-row link check: anchor covers the row geometry and nests no buttons/inputs.
      const rowBox = await firstRow.boundingBox();
      const linkBox = await product.boundingBox();
      expect(rowBox).not.toBeNull();
      expect(linkBox).not.toBeNull();
      expect(linkBox!.width).toBeGreaterThanOrEqual(rowBox!.width * 0.85);
      expect(linkBox!.height).toBeGreaterThanOrEqual(rowBox!.height * 0.85);
      await expect(product.locator('button, input')).toHaveCount(0);

      const productName = (await product.textContent())?.trim();
      const href = await product.getAttribute('href');
      expect(href).toMatch(/\/products\//);
      expect(new URL(href!, baseURL).searchParams.get('search')).toBe(
        'Fixture Product 0',
      );
      expect(new URL(href!, baseURL).searchParams.get('sort')).toBe(
        'name-desc',
      );
      await product.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/products\//);
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
      expect(productName).toContain((await heading.textContent())?.trim());
      await expect
        .poll(() =>
          page.evaluate(() => {
            const h1 = document.querySelector('h1');
            return (
              document.activeElement === h1 ||
              Boolean(h1?.contains(document.activeElement))
            );
          }),
        )
        .toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);

      const shared = page.url();
      const other = await browser.newContext({ baseURL, viewport });
      try {
        const recipient = await other.newPage();
        recipient.on('pageerror', (error) => {
          throw error;
        });
        await recipient.goto(shared);
        await recipient.reload();
        await expect(
          recipient.getByRole('heading', { level: 1 }),
        ).toBeVisible();
        const logo = recipient.getByRole('img', { name: /basf/i });
        await expect(logo).toBeVisible();
        expect(
          await logo.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
        ).toBe(true);
        await recipient
          .getByRole('link', { name: /back to catalogue/i })
          .click();
        await expect(results(recipient)).toBeVisible();
        expect(new URL(recipient.url()).searchParams.get('search')).toBe(
          'Fixture Product 0',
        );
        expect(new URL(recipient.url()).searchParams.get('sort')).toBe(
          'name-desc',
        );
        expect(await recipient.evaluate(() => window.scrollY)).toBe(0);
      } finally {
        await other.close();
      }
      await page.goBack();
      await expect(list).toBeVisible();
      expect(new URL(page.url()).searchParams.get('sort')).toBe('name-desc');
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });

    test('a missing product shows Product not found without Retry and offers a return preserving carried criteria', async ({
      page,
    }) => {
      await page.goto(
        '/products/00000000-0000-4000-8000-000000000999?search=Fixture&status=ACTIVE&applicationArea=Coatings&sort=name-desc',
      );
      await expect(
        page.getByRole('heading', { name: /product not found/i }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: /retry/i })).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.getByRole('link', { name: /back to catalogue/i }).click();
      await expect(results(page)).toBeVisible();
      const returnedUrl = new URL(page.url());
      expect(returnedUrl.searchParams.get('search')).toBe('Fixture');
      expect(returnedUrl.searchParams.getAll('status')).toEqual(['ACTIVE']);
      expect(returnedUrl.searchParams.getAll('applicationArea')).toEqual([
        'Coatings',
      ]);
      expect(returnedUrl.searchParams.get('sort')).toBe('name-desc');
    });

    test('a failed detail request offers retry and return with carried criteria without stale details', async ({
      page,
    }) => {
      await page.goto('/?search=Fixture&status=ACTIVE');
      const links = results(page).getByRole('link');
      await expect(links.first()).toBeVisible();
      await links.first().click();
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
      const previousName = (await heading.textContent())?.trim();
      expect(previousName).toBe('Fixture Product 001');

      await page.goBack();
      await expect(links.nth(1)).toBeVisible();
      await page.route('**/api/products/*', (route) =>
        route.fulfill({ status: 503, body: 'unavailable' }),
      );
      await links.nth(1).click();
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
      await expect(page.getByText(previousName!, { exact: true })).toHaveCount(
        0,
      );
      const backLink = page.getByRole('link', { name: /back to catalogue/i });
      await expect(backLink).toBeVisible();
      const backHref = await backLink.getAttribute('href');
      expect(backHref).toContain('search=Fixture');
      expect(backHref).toContain('status=ACTIVE');

      await page.unrouteAll();
      await page.getByRole('button', { name: /retry/i }).click();
      await expect(
        page.getByRole('heading', { level: 1, name: 'Fixture Product 007' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: /retry/i })).toHaveCount(0);
    });
  });
}

test('clipboard failure exposes the applied catalogue link with failure feedback and without claiming success', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.goto('/?search=Fixture');
  await expect(results(page)).toBeVisible();
  const copy = page.getByRole('button', { name: /copy link/i });
  await expect(copy).toBeVisible();
  await copy.click();
  await expect(page.getByText(/link copied|copied to clipboard/i)).toHaveCount(
    0,
  );
  await expect(
    page.getByText(/unable to copy|copy failed|manual|copy the link/i).first(),
  ).toBeVisible();
  const link = page.getByRole('textbox', { name: /link/i });
  await expect(link).toBeVisible();
  await expect(link).toHaveValue(/search=Fixture/);
  const dismiss = page.getByRole('button', { name: /dismiss/i }).first();
  await expect(dismiss).toBeVisible();
  await dismiss.click();
  await expect(link).toHaveCount(0);
});

test('detail page explains retained absent products and renders all missing-value placeholders from PostgreSQL', async ({
  page,
}) => {
  await page.goto(`/products/${p122UnnamedMissingId}`);
  await expect(page.getByRole('heading', { name: 'P-122' })).toBeVisible();
  await expect(page.getByText('Unavailable', { exact: true })).toBeVisible();
  await expect(page.getByText(/latest (import|catalogue)/i)).toBeVisible();
  await expect(page.getByText('Not provided', { exact: true })).toHaveCount(6);
  await expect(page.getByText('None listed', { exact: true })).toBeVisible();
  await expect(page.getByText(/uncertified/i)).toHaveCount(0);

  // Also check P-121 where source status is DISCONTINUED but presentInLatestImport is false:
  // Unavailable and the absent explanation must take precedence over Discontinued.
  await page.goto(`/products/${p121AbsentDiscontinuedId}`);
  await expect(
    page.getByRole('heading', { name: 'Fixture Product 121 Absent' }),
  ).toBeVisible();
  await expect(page.getByText('Unavailable', { exact: true })).toBeVisible();
  await expect(page.getByText(/latest (import|catalogue)/i)).toBeVisible();
});

test('native sharing is hidden when unsupported and handles cancellation gracefully when supported', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto('/?search=Fixture');
  await expect(results(page)).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^share( results)?$/i }),
  ).toHaveCount(0);
  await expect(page.getByRole('button', { name: /copy link/i })).toBeVisible();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (data: ShareData) => {
        (window as unknown as { sharedUrl: string }).sharedUrl = data.url ?? '';
        return Promise.reject(new DOMException('Cancelled', 'AbortError'));
      },
    });
  });
  await page.reload();
  await expect(results(page)).toBeVisible();
  const share = page.getByRole('button', { name: /^share( results)?$/i });
  await expect(share).toBeVisible();
  await share.click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { sharedUrl: string }).sharedUrl,
      ),
    )
    .toContain('search=Fixture');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('copying a catalogue link includes applied filters and sort with success feedback and excludes batch offset', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (value: string) => {
          (window as unknown as { copiedUrl: string }).copiedUrl = value;
          return Promise.resolve();
        },
      },
    });
  });
  await page.goto(
    '/?search=Fixture&status=ACTIVE&applicationArea=Coatings&sort=name-desc',
  );
  await expect(results(page)).toBeVisible();
  const copy = page.getByRole('button', { name: /copy link/i });
  await expect(copy).toBeVisible();
  await copy.click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { copiedUrl: string }).copiedUrl,
      ),
    )
    .toBeTruthy();
  const copied = new URL(
    await page.evaluate(
      () => (window as unknown as { copiedUrl: string }).copiedUrl,
    ),
  );
  expect(copied.searchParams.get('search')).toBe('Fixture');
  expect(copied.searchParams.getAll('status')).toEqual(['ACTIVE']);
  expect(copied.searchParams.getAll('applicationArea')).toEqual(['Coatings']);
  expect(copied.searchParams.get('sort')).toBe('name-desc');
  expect(copied.searchParams.has('offset')).toBe(false);
  expect(copied.searchParams.has('limit')).toBe(false);
  const successBanner = page.getByText(/link copied|copied to clipboard/i);
  await expect(successBanner).toBeVisible();

  const dismissBtn = page.getByRole('button', {
    name: /dismiss notification/i,
  });
  await expect(dismissBtn).toBeVisible();
  await dismissBtn.click();
  await expect(successBanner).toHaveCount(0);
});

test('direct product from PostgreSQL shows every customer field without metadata or review placeholders and returns to the default catalogue', async ({
  page,
}) => {
  await page.goto(`/products/${p001Id}`);
  await expect(
    page.getByRole('heading', { name: 'Fixture Product 001' }),
  ).toBeVisible();
  for (const value of [
    'P-001',
    'Acrylic dispersion',
    'Aqueous acrylic dispersion for industrial coatings.',
    'Film-forming binder',
    'Coatings',
    'Europe',
    'ISO 9001',
    'EcoCert',
    '2021',
    'Active',
  ]) {
    await expect(page.getByText(value, { exact: false }).first()).toBeVisible();
  }
  await expect(page.getByText(p001Id)).toHaveCount(0);
  await expect(
    page.getByText(/review|rating|add to cart|order now|in stock/i),
  ).toHaveCount(0);
  await page.getByRole('link', { name: /back to catalogue/i }).click();
  await expect(results(page)).toBeVisible();
  expect(new URL(page.url()).search).toBe('');
});

test('unknown status from PostgreSQL explains unconfirmed availability', async ({
  page,
}) => {
  await page.goto(`/products/${p004Id}`);
  await expect(
    page.getByRole('heading', { name: 'Fixture Product 004' }),
  ).toBeVisible();
  await expect(page.getByText('Unavailable', { exact: true })).toBeVisible();
  await expect(page.getByText(/unconfirmed|not confirmed/i)).toBeVisible();
});

test('sharing a product preserves its identity and criteria in a fresh session even when it no longer matches', async ({
  page,
  browser,
  baseURL,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (value: string) => {
          (window as unknown as { copiedUrl: string }).copiedUrl = value;
          return Promise.resolve();
        },
      },
    });
  });
  await page.goto(
    `/products/${p001Id}?search=not-a-match&status=DISCONTINUED&applicationArea=Food&sort=name-desc`,
  );
  await expect(
    page.getByRole('heading', { name: 'Fixture Product 001' }),
  ).toBeVisible();
  const copy = page.getByRole('button', { name: /copy link/i });
  await expect(copy).toBeVisible();
  await copy.click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { copiedUrl: string }).copiedUrl,
      ),
    )
    .toBeTruthy();
  const shared = await page.evaluate(
    () => (window as unknown as { copiedUrl: string }).copiedUrl,
  );
  const parsed = new URL(shared);
  expect(parsed.pathname).toBe(`/products/${p001Id}`);
  expect(parsed.searchParams.get('search')).toBe('not-a-match');
  expect(parsed.searchParams.get('status')).toBe('DISCONTINUED');
  expect(parsed.searchParams.get('applicationArea')).toBe('Food');
  expect(parsed.searchParams.get('sort')).toBe('name-desc');
  const context = await browser.newContext({ baseURL });
  try {
    const recipient = await context.newPage();
    recipient.on('pageerror', (error) => {
      throw error;
    });
    await recipient.goto(shared);
    await expect(
      recipient.getByRole('heading', { name: 'Fixture Product 001' }),
    ).toBeVisible();
    await recipient.getByRole('link', { name: /back to catalogue/i }).click();
    await expect.poll(() => new URL(recipient.url()).pathname).toBe('/');
    expect(new URL(recipient.url()).searchParams.get('search')).toBe(
      'not-a-match',
    );
    expect(new URL(recipient.url()).searchParams.get('status')).toBe(
      'DISCONTINUED',
    );
    expect(new URL(recipient.url()).searchParams.get('applicationArea')).toBe(
      'Food',
    );
    expect(new URL(recipient.url()).searchParams.get('sort')).toBe('name-desc');
  } finally {
    await context.close();
  }
});

test('shared catalogue uses applied search instead of an uncommitted input or unapplied filter draft', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (value: string) => {
          (window as unknown as { copiedUrl: string }).copiedUrl = value;
          return Promise.resolve();
        },
      },
    });
  });
  await page.goto('/?search=Fixture');
  await expect(results(page)).toBeVisible();
  await page.getByRole('button', { name: /^filters$/i }).click();
  const dialog = page.getByRole('dialog', { name: /filter/i });
  await dialog.getByRole('checkbox', { name: /^active$/i }).check();
  await dialog.getByRole('button', { name: /close/i }).click();

  const field = page.getByRole('searchbox', { name: /search|product|sku/i });
  await field.fill('uncommitted draft');
  // Open the share action without committing blur: keyboard focus can also leave the input.
  await page
    .getByRole('button', { name: /copy link/i })
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { copiedUrl: string }).copiedUrl,
      ),
    )
    .toBeTruthy();
  const shared = new URL(
    await page.evaluate(
      () => (window as unknown as { copiedUrl: string }).copiedUrl,
    ),
  );
  expect(shared.searchParams.get('search')).toBe('Fixture');
  expect(shared.searchParams.has('status')).toBe(false);
});

test('invalid carried criteria do not prevent details or returning with valid criteria', async ({
  page,
}) => {
  await page.goto(
    `/products/${p001Id}?search=Fixture&status=ACTIVE&status=BOGUS&applicationArea=Coatings&applicationArea=UnknownArea&sort=invalid`,
  );
  await expect(
    page.getByRole('heading', { name: 'Fixture Product 001' }),
  ).toBeVisible();
  await page.getByRole('link', { name: /back to catalogue/i }).click();
  await expect(results(page)).toBeVisible();
  await expect
    .poll(() => new URL(page.url()).searchParams.getAll('applicationArea'))
    .toEqual(['Coatings']);
  expect(new URL(page.url()).searchParams.get('search')).toBe('Fixture');
  expect(new URL(page.url()).searchParams.getAll('status')).toEqual(['ACTIVE']);
  expect(new URL(page.url()).searchParams.get('sort')).toBeNull();
  await expect(
    page.getByText(/invalid|ignored|unsupported/i).first(),
  ).toBeVisible();
});

test('a slow detail request shows loading, clears prior details, and cannot overwrite or error on a newer product', async ({
  page,
}) => {
  const slowId = '00000000-0000-4000-8000-000000000005';
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const requestStarted = new Promise<void>((resolve) => {
    started = resolve;
  });
  let finished!: () => void;
  const requestFinished = new Promise<void>((resolve) => {
    finished = resolve;
  });
  await page.route(`**/api/products/${slowId}`, async (route) => {
    started();
    await gate;
    await route
      .fulfill({
        json: {
          id: slowId,
          sku: 'P-005',
          name: 'Outdated product',
          chemicalName: null,
          description: null,
          function: null,
          applicationArea: 'Coatings',
          region: null,
          certifications: [],
          launchYear: null,
          status: 'ACTIVE',
          presentInLatestImport: true,
        },
      })
      .catch(() => {});
    finished();
  });
  try {
    await page.goto(`/products/${p001Id}`);
    await expect(
      page.getByRole('heading', { name: 'Fixture Product 001' }),
    ).toBeVisible();
    // Create a second router history entry, then navigate back while its request is pending.
    await page.evaluate((id) => {
      history.pushState({}, '', `/products/${id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, slowId);
    await Promise.race([
      requestStarted,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('detail request did not start')),
          2500,
        ),
      ),
    ]);
    await expect(
      page.getByRole('heading', { name: 'Fixture Product 001' }),
    ).toHaveCount(0);
    await expect(
      page.locator('[aria-busy="true"], [role="status"]').first(),
    ).toBeVisible();
    await page.goBack();
    await expect(
      page.getByRole('heading', { name: 'Fixture Product 001' }),
    ).toBeVisible();
    release();
    await requestFinished;
    await expect(
      page.getByRole('heading', { name: 'Outdated product' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Fixture Product 001' }),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  } finally {
    release();
  }
});

for (const [id, name, status, label, description] of [
  [
    p002Id,
    'Fixture Product 002',
    'PHASE_OUT',
    /phase.out/i,
    'Fixture description for P-002.',
  ],
  [
    p003Id,
    'Fixture Product 003',
    'DISCONTINUED',
    /discontinued/i,
    'Fixture description for P-003.',
  ],
] as const) {
  test(`the ${status} detail from PostgreSQL remains readable with its status`, async ({
    page,
  }) => {
    await page.goto(`/products/${id}`);
    await expect(page.getByRole('heading', { name })).toBeVisible();
    await expect(page.getByText(label).first()).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
  });
}

test('product native share carries product identity and catalogue criteria on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (data: ShareData) => {
        (window as unknown as { sharedUrl: string }).sharedUrl = data.url ?? '';
        return Promise.resolve();
      },
    });
  });
  await page.goto(`/products/${p001Id}?search=Fixture&status=ACTIVE`);
  await expect(
    page.getByRole('heading', { name: 'Fixture Product 001' }),
  ).toBeVisible();
  const share = page.getByRole('button', { name: /^share$/i });
  await expect(share).toBeVisible();
  await share.click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { sharedUrl: string }).sharedUrl,
      ),
    )
    .toBeTruthy();
  const shared = new URL(
    await page.evaluate(
      () => (window as unknown as { sharedUrl: string }).sharedUrl,
    ),
  );
  expect(shared.pathname).toBe(`/products/${p001Id}`);
  expect(shared.searchParams.get('search')).toBe('Fixture');
  expect(shared.searchParams.get('status')).toBe('ACTIVE');
});

test('both Back to catalogue and Browser Back after loading additional batches restore criteria and start at the top with one batch', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.IntersectionObserver =
      undefined as unknown as typeof IntersectionObserver;
  });
  await page.goto('/?sort=name-desc');
  const list = results(page);
  const rows = list.getByRole('listitem');
  await expect(rows.first()).toBeVisible();
  const firstBatchCount = await rows.count();
  await page.getByRole('button', { name: /load (next|more)/i }).click();
  await expect.poll(() => rows.count()).toBeGreaterThan(firstBatchCount);

  const link = rows.last().getByRole('link');
  await expect(link).toBeVisible();
  await link.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await link.click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // 1. Return via Back to catalogue link
  await page.getByRole('link', { name: /back to catalogue/i }).click();
  await expect(rows.first()).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(new URL(page.url()).searchParams.get('sort')).toBe('name-desc');
  await expect(rows).toHaveCount(firstBatchCount);

  // 2. Load another batch, scroll down, open a product, and return via Browser Back
  await page.getByRole('button', { name: /load (next|more)/i }).click();
  await expect.poll(() => rows.count()).toBeGreaterThan(firstBatchCount);
  await rows.last().getByRole('link').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await rows.last().getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.goBack();
  await expect(rows.first()).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(new URL(page.url()).searchParams.get('sort')).toBe('name-desc');
  await expect(rows).toHaveCount(firstBatchCount);
});

test('copying product link falls back to a selectable link with failure feedback when clipboard is unavailable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto(`/products/${p001Id}?search=Fixture`);
  await expect(
    page.getByRole('heading', { name: 'Fixture Product 001' }),
  ).toBeVisible();
  const copy = page.getByRole('button', { name: /copy link/i });
  await expect(copy).toBeVisible();
  await copy.click();
  await expect(page.getByText(/link copied|copied to clipboard/i)).toHaveCount(
    0,
  );
  await expect(
    page.getByText(/unable to copy|copy failed|manual|copy the link/i).first(),
  ).toBeVisible();
  const manual = page.getByRole('textbox', { name: /link/i });
  await expect(manual).toBeVisible();
  const shared = new URL(await manual.inputValue());
  expect(shared.pathname).toBe(`/products/${p001Id}`);
  expect(shared.searchParams.get('search')).toBe('Fixture');
  await manual.selectText();
  expect(
    await manual.evaluate(
      (input: HTMLInputElement) => input.selectionEnd! - input.selectionStart!,
    ),
  ).toBeGreaterThan(0);
});
