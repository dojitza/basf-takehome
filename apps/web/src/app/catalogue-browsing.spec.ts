import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

// Provisional wire contract; assertions describe behavior rather than component structure.
const sample = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    sku: 'P-001',
    name: 'Alpha',
    status: 'ACTIVE',
    applicationArea: 'Coatings',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    sku: 'P-002',
    name: null,
    status: 'DISCONTINUED',
    applicationArea: 'Food',
  },
];
const result = (
  items: Record<string, unknown>[] = sample,
  nextOffset: number | null = null,
  total = nextOffset === null ? items.length : nextOffset + 1,
) => ({
  items,
  total,
  nextOffset,
});
let fixture: ComponentFixture<App>;
let http: HttpTestingController;

async function render() {
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [
      ...appConfig.providers,
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  }).compileComponents();
  http = TestBed.inject(HttpTestingController);
  fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  await fixture.whenStable();
}
function root(): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}
function request(): TestRequest {
  return http.expectOne(
    (req) => req.method === 'GET' && req.url.startsWith('/api/products'),
  );
}
async function update() {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}
function text() {
  return root().textContent?.replace(/\s+/g, ' ') ?? '';
}
function input(): HTMLInputElement {
  const field = root().querySelector<HTMLInputElement>(
    'input[type="search"], input[aria-label*="earch"], input[id*="search"]',
  );
  if (!field)
    throw new Error('An accessible product search field was not found');
  return field;
}
function button(name: RegExp): HTMLButtonElement {
  const found = [...root().querySelectorAll('button')].find(
    (element) =>
      name.test(element.textContent?.trim() ?? '') ||
      name.test(element.getAttribute('aria-label')?.trim() ?? ''),
  );
  if (!found) throw new Error(`A button matching ${name} was not found`);
  return found;
}
async function submitSearch(value: string) {
  const field = input();
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  const form = field.closest('form');
  if (form)
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
  else
    field.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
  await update();
}

afterEach(() => {
  if (http) http.verify({ ignoreCancelled: true });
  fixture?.destroy();
});

describe('catalogue browsing', () => {
  it('shows loading before results, without showing an empty state prematurely', async () => {
    await render();
    const pending = request();
    expect(
      root().querySelector('[aria-busy="true"], [role="status"]'),
    ).not.toBeNull();
    expect(text()).not.toMatch(/no products|no results/i);
    pending.flush(result());
    await update();
    expect(text()).toContain('Alpha');
    expect(text()).toContain('P-001');
    expect(text()).toMatch(/discontinued/i);
    expect(text()).toContain('P-002');
  });

  it('presents unknown or absent products as unavailable without confusing them with discontinued', async () => {
    await render();
    request().flush(
      result([
        {
          ...sample[0],
          sku: 'P-003',
          name: 'Mystery Formula',
          status: 'UNKNOWN',
          presentInLatestImport: true,
        },
        {
          ...sample[0],
          sku: 'P-004',
          name: 'Former Discontinued Item',
          status: 'DISCONTINUED',
          presentInLatestImport: false,
        },
        {
          ...sample[1],
          sku: 'P-005',
          name: null,
          status: 'DISCONTINUED',
          presentInLatestImport: true,
          chemicalName: 'Polyol',
        },
      ]),
    );
    await update();
    const items = [...root().querySelectorAll('li.product')];
    expect(items).toHaveLength(3);
    expect(items[0].querySelector('p-tag')?.textContent?.trim()).toBe(
      'Unavailable',
    );
    expect(items[1].querySelector('p-tag')?.textContent?.trim()).toBe(
      'Unavailable',
    );
    expect(items[2].textContent).toContain('Unnamed product');
    expect(items[2].textContent).toContain('Polyol');
    expect(items[2].querySelector('p-tag')?.textContent?.trim()).toBe(
      'Discontinued',
    );
  });

  it('keeps desktop results and URL unchanged after a pause until search is submitted', async () => {
    await render();
    request().flush(result());
    await update();
    jest.useFakeTimers();
    try {
      const field = input();
      field.value = 'alpha';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      http.expectNone((req) => req.url.startsWith('/api/products'));
      await jest.advanceTimersByTimeAsync(1500);
      fixture.detectChanges();
      http.expectNone((req) => req.url.startsWith('/api/products'));
      expect(text()).toContain('P-002');
      expect(TestBed.inject(Location).path()).not.toContain('search=');
    } finally {
      jest.useRealTimers();
    }
    await submitSearch('alpha');
    const pending = request();
    expect(pending.request.params.get('search')).toBe('alpha');
    pending.flush(result([sample[0]]));
    await update();
    expect(text()).toContain('Alpha');
    expect(text()).not.toContain('P-002');
  });

  it('applies a desktop search when the field loses focus', async () => {
    await render();
    request().flush(result());
    await update();
    const field = input();
    field.value = ' alpha ';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('blur'));
    await update();
    const pending = request();
    expect(pending.request.params.get('search')).toBe('alpha');
    pending.flush(result([sample[0]]));
    await update();
    expect(TestBed.inject(Location).path()).toContain('search=alpha');
  });

  it('shows an empty catalogue state when no products exist', async () => {
    await render();
    request().flush(result([]));
    await update();
    expect(text()).toMatch(/no products|catalogue is empty/i);
    expect(root().querySelector('[role="alert"]')).toBeNull();
  });

  it('distinguishes no matches and permits clearing the search', async () => {
    await render();
    request().flush(result());
    await update();
    await submitSearch('missing');
    request().flush(result([]));
    await update();
    expect(text()).toMatch(/no (matching|results|products)/i);
    button(/clear (search|filters)/i).click();
    await update();
    request().flush(result());
    await update();
    expect(text()).toContain('Alpha');
  });

  it.each([
    '/?status=ACTIVE&sort=name-desc',
    '/?search=missing&status=ACTIVE&applicationArea=Food&sort=name-desc',
  ])('clears search and filters while preserving sort from %s', async (url) => {
    await render();
    request().flush(result());
    await update();
    await TestBed.inject(Router).navigateByUrl(url);
    await update();
    request().flush(result([]));
    await update();
    button(/clear filters/i).click();
    await update();
    const pending = request();
    expect(pending.request.params.has('search')).toBe(false);
    expect(pending.request.params.has('status')).toBe(false);
    expect(pending.request.params.has('applicationArea')).toBe(false);
    expect(pending.request.params.get('sort')).toBe('name-desc');
    pending.flush(result());
    await update();
    expect(TestBed.inject(Location).path()).toBe('?sort=name-desc');
    expect(input().value).toBe('');
  });

  it('retains criteria and retries an initial request after an error', async () => {
    await render();
    request().flush(result());
    await update();
    await TestBed.inject(Router).navigateByUrl(
      '/?search=Alpha&status=ACTIVE&applicationArea=Coatings&sort=name-desc',
    );
    await update();
    const failed = request();
    expect(failed.request.params.get('search')).toBe('Alpha');
    expect(failed.request.params.getAll('status')).toEqual(['ACTIVE']);
    expect(failed.request.params.getAll('applicationArea')).toEqual([
      'Coatings',
    ]);
    expect(failed.request.params.get('sort')).toBe('name-desc');
    failed.flush(
      { message: 'Unavailable' },
      { status: 503, statusText: 'Unavailable' },
    );
    await update();
    expect(root().querySelector('[role="alert"]')).not.toBeNull();
    expect(input().value).toBe('Alpha');
    expect(button(/remove active/i)).toBeDefined();
    expect(button(/remove coatings/i)).toBeDefined();
    expect(button(/remove sort/i)).toBeDefined();
    button(/retry/i).click();
    await update();
    const retried = request();
    expect(retried.request.params.get('search')).toBe('Alpha');
    expect(retried.request.params.getAll('status')).toEqual(['ACTIVE']);
    expect(retried.request.params.getAll('applicationArea')).toEqual([
      'Coatings',
    ]);
    expect(retried.request.params.get('sort')).toBe('name-desc');
    retried.flush(result([sample[0]]));
    await update();
    expect(text()).toContain('Alpha');
  });

  it('preserves previously loaded results after a later-batch error and retries once', async () => {
    await render();
    request().flush(result([sample[0]], 1));
    await update();
    button(/load (next|more)/i).click();
    await update();
    request().flush(
      { message: 'Unavailable' },
      { status: 503, statusText: 'Unavailable' },
    );
    await update();
    expect(text()).toContain('Alpha');
    expect(root().querySelector('[role="alert"]')).not.toBeNull();
    http.expectNone((req) => req.url.startsWith('/api/products'));
    button(/retry/i).click();
    await update();
    request().flush(result([sample[1]], null, 2));
    await update();
    expect(text()).toContain('Alpha');
    expect(text()).toContain('P-002');
  });

  it('announces loading another batch without repeating the product list or stealing focus', async () => {
    await render();
    request().flush(result([sample[0]], 1, 3));
    await update();
    const load = button(/load (next|more)/i);
    load.focus();
    load.click();
    await update();
    const pending = request();
    const live = root().querySelector<HTMLElement>(
      '[role="status"], [aria-live="polite"]',
    );
    expect(live).not.toBeNull();
    expect(live?.textContent).toMatch(/load/i);
    expect(live?.textContent).not.toContain('Alpha');
    pending.flush(result([sample[1]], 2, 3));
    await update();
    expect(document.activeElement).toBe(load);
    expect(text()).toContain('Alpha');
    expect(text()).toContain('P-002');
  });

  it('ignores a stale success from an older query', async () => {
    await render();
    request().flush(result());
    await update();
    await submitSearch('old');
    const old = request();
    await submitSearch('new');
    const current = request();
    current.flush(result([{ ...sample[0], name: 'New result' }]));
    await update();
    if (!old.cancelled)
      old.flush(result([{ ...sample[0], name: 'Old result' }]));
    await update();
    expect(text()).toContain('New result');
    expect(text()).not.toContain('Old result');
  });

  it('ignores a late error from the previous query', async () => {
    await render();
    request().flush(result());
    await update();
    await submitSearch('old');
    const old = request();
    await submitSearch('new');
    request().flush(result([{ ...sample[0], name: 'New result' }]));
    await update();
    if (!old.cancelled)
      old.flush(
        { message: 'Old failure' },
        { status: 503, statusText: 'Unavailable' },
      );
    await update();
    expect(text()).toContain('New result');
    expect(root().querySelector('[role="alert"]')).toBeNull();
  });

  it('restores committed search criteria from a direct URL and updates the URL after search', async () => {
    await render();
    request().flush(result());
    await update();
    await TestBed.inject(Router).navigateByUrl('/?search=Alpha%20%26%20Co');
    await update();
    const direct = request();
    expect(direct.request.params.get('search')).toBe('Alpha & Co');
    direct.flush(result([]));
    await update();
    expect(input().value).toBe('Alpha & Co');
    await submitSearch('Crème');
    const changed = request();
    expect(changed.request.params.get('search')).toBe('Crème');
    changed.flush(result([]));
    await update();
    expect(
      new URL(
        TestBed.inject(Location).path(),
        'http://localhost',
      ).searchParams.get('search'),
    ).toBe('Crème');
  });

  it('warns about unsupported URL criteria and uses defaults without discarding a valid search', async () => {
    await render();
    request().flush(result());
    await update();
    await TestBed.inject(Router).navigateByUrl(
      '/?search=Alpha&status=INVALID&sort=invalid',
    );
    await update();
    const pending = request();
    expect(pending.request.params.get('search')).toBe('Alpha');
    expect(pending.request.params.get('status')).not.toBe('INVALID');
    expect(pending.request.params.get('sort')).not.toBe('invalid');
    pending.flush(result([sample[0]]));
    await update();
    expect(text()).toMatch(/invalid|unsupported/i);
    expect(text()).toContain('Alpha');
  });

  it('ignores an unknown application area from a shared link, warns, and cleans the URL', async () => {
    await render();
    request().flush({ ...result(), applicationAreas: ['Coatings', 'Food'] });
    await update();
    await TestBed.inject(Router).navigateByUrl('/?applicationArea=Unknown');
    await update();
    request().flush({ ...result([]), applicationAreas: ['Coatings', 'Food'] });
    await update();
    const fallback = request();
    expect(fallback.request.params.has('applicationArea')).toBe(false);
    fallback.flush({ ...result(), applicationAreas: ['Coatings', 'Food'] });
    await update();
    expect(text()).toMatch(/invalid|unsupported/i);
    expect(text()).toContain('Alpha');
    expect(TestBed.inject(Location).path()).not.toContain(
      'applicationArea=Unknown',
    );
  });

  it('deduplicates repeated filter parameters in the URL without duplicate chips or inflated counts', async () => {
    await render();
    request().flush({ ...result(), applicationAreas: ['Coatings', 'Food'] });
    await update();
    await TestBed.inject(Router).navigateByUrl(
      '/?status=ACTIVE&status=ACTIVE&applicationArea=Coatings&applicationArea=Coatings',
    );
    await update();
    const pending = request();
    expect(pending.request.params.getAll('status')).toEqual(['ACTIVE']);
    expect(pending.request.params.getAll('applicationArea')).toEqual([
      'Coatings',
    ]);
    pending.flush({ ...result(), applicationAreas: ['Coatings', 'Food'] });
    await update();
    const removeActive = [...root().querySelectorAll('button')].filter((el) =>
      /remove active/i.test(el.getAttribute('aria-label') ?? ''),
    );
    expect(removeActive).toHaveLength(1);
    button(/^filters$/i).click();
    await update();
    expect(button(/apply/i).textContent).toContain('Apply (2)');
  });

  it('does not commit an unsubmitted desktop search draft when clicking the remove-search chip', async () => {
    await render();
    request().flush(result());
    await update();
    await TestBed.inject(Router).navigateByUrl('/?search=Alpha');
    await update();
    request().flush(result([sample[0]]));
    await update();
    const field = input();
    field.value = 'Beta draft';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    const removeChip = button(/remove search alpha/i);
    // Clicking another button blurs the focused search input before click fires.
    field.dispatchEvent(new Event('blur'));
    removeChip.click();
    await update();
    const requests = http.match((req) => req.url.startsWith('/api/products'));
    expect(requests).toHaveLength(1);
    expect(requests[0].request.params.has('search')).toBe(false);
    requests[0].flush(result());
    await update();
  });

  it('manages filter and sort drawer drafts and resets without issuing requests until applied', async () => {
    await render();
    request().flush({ ...result(), applicationAreas: ['Coatings', 'Food'] });
    await update();
    const filterTrigger = button(/^filters$/i);
    filterTrigger.click();
    await update();
    const dialog = root().querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog?.getAttribute('aria-label')).toMatch(/filter/i);
    const activeCheckbox = [
      ...(dialog?.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]',
      ) ?? []),
    ].find((box) => /active/i.test(box.parentElement?.textContent ?? ''));
    expect(activeCheckbox).toBeDefined();
    activeCheckbox!.checked = true;
    activeCheckbox!.dispatchEvent(new Event('change', { bubbles: true }));
    await update();
    expect(button(/apply/i).textContent).toContain('Apply (1)');
    http.expectNone((req) => req.url.startsWith('/api/products'));
    button(/clear filters/i).click();
    await update();
    expect(activeCheckbox!.checked).toBe(false);
    expect(button(/apply/i).textContent).toContain('Apply (0)');
    activeCheckbox!.checked = true;
    activeCheckbox!.dispatchEvent(new Event('change', { bubbles: true }));
    await update();
    button(/^close$/i).click();
    await update();
    http.expectNone((req) => req.url.startsWith('/api/products'));

    filterTrigger.click();
    await update();
    const reopenedCheckbox = [
      ...(root()
        .querySelector<HTMLElement>('[role="dialog"]')
        ?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? []),
    ].find((box) => /active/i.test(box.parentElement?.textContent ?? ''))!;
    expect(reopenedCheckbox.checked).toBe(false);
    reopenedCheckbox.checked = true;
    reopenedCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    await update();
    button(/apply/i).click();
    await update();
    const applied = request();
    expect(applied.request.params.getAll('status')).toEqual(['ACTIVE']);
    applied.flush({
      ...result([sample[0]]),
      applicationAreas: ['Coatings', 'Food'],
    });
    await update();
    expect(TestBed.inject(Location).path()).toContain('status=ACTIVE');
  });

  it('exposes aria-expanded on drawer triggers and an accurate backdrop label when sorting', async () => {
    await render();
    request().flush({ ...result(), applicationAreas: ['Coatings', 'Food'] });
    await update();
    const filterTrigger = button(/^filters$/i);
    const sortTrigger = button(/^sort$/i);
    expect(filterTrigger.getAttribute('aria-expanded')).toBe('false');
    expect(sortTrigger.getAttribute('aria-expanded')).toBe('false');
    sortTrigger.click();
    await update();
    expect(sortTrigger.getAttribute('aria-expanded')).toBe('true');
    const backdrop = root().querySelector<HTMLButtonElement>('.backdrop');
    expect(backdrop?.getAttribute('aria-label')).toMatch(/close (sort|panel)/i);
  });

  it('manages the mobile full-screen search lifecycle and preserves active filters', async () => {
    await render();
    request().flush(result());
    await update();
    await TestBed.inject(Router).navigateByUrl('/?search=Alpha&status=ACTIVE');
    await update();
    request().flush(result([sample[0]]));
    await update();
    button(/^search$/i).click();
    await update();
    const mobileInput =
      root().querySelector<HTMLInputElement>('#mobile-search');
    expect(mobileInput).not.toBeNull();
    expect(mobileInput?.value).toBe('Alpha');
    mobileInput!.value = 'Discarded draft';
    mobileInput!.dispatchEvent(new Event('input', { bubbles: true }));
    button(/close search/i).click();
    await update();
    http.expectNone((req) => req.url.startsWith('/api/products'));
    expect(TestBed.inject(Location).path()).toContain('search=Alpha');

    button(/^search$/i).click();
    await update();
    const reopened = root().querySelector<HTMLInputElement>('#mobile-search')!;
    expect(reopened.value).toBe('Alpha');
    reopened.value = 'Beta';
    reopened.dispatchEvent(new Event('input', { bubbles: true }));
    reopened
      .closest('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await update();
    const committed = request();
    expect(committed.request.params.get('search')).toBe('Beta');
    expect(committed.request.params.getAll('status')).toEqual(['ACTIVE']);
    committed.flush(result([sample[0]]));
    await update();
  });

  it('loads automatically via IntersectionObserver, suppresses observer loads on error, and re-observes after retry', async () => {
    let callback: IntersectionObserverCallback | undefined;
    const observe = jest.fn();
    const disconnect = jest.fn();
    const originalObserver = window.IntersectionObserver;
    window.IntersectionObserver = jest.fn(
      (cb: IntersectionObserverCallback) => {
        callback = cb;
        return {
          observe,
          disconnect,
          unobserve: jest.fn(),
          takeRecords: () => [],
          root: null,
          rootMargin: '100px',
          thresholds: [0],
        };
      },
    ) as unknown as typeof IntersectionObserver;
    try {
      await render();
      request().flush(result([sample[0]], 1, 2));
      await update();
      expect(observe).toHaveBeenCalledTimes(1);
      callback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      await update();
      const second = request();
      expect(second.request.params.get('offset')).toBe('1');
      second.flush(
        { message: 'Failed' },
        { status: 503, statusText: 'Unavailable' },
      );
      await update();
      callback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      await update();
      http.expectNone((req) => req.url.startsWith('/api/products'));
      button(/retry/i).click();
      await update();
      request().flush(result([sample[1]], null, 2));
      await update();
      expect(text()).toContain('P-002');
    } finally {
      window.IntersectionObserver = originalObserver;
    }
  });

  it('does not issue duplicate requests when manual loading is triggered repeatedly', async () => {
    await render();
    request().flush(result([sample[0]], 1));
    await update();
    const load = button(/load (next|more)/i);
    load.click();
    load.click();
    await update();
    const pending = http.match((req) => req.url.startsWith('/api/products'));
    expect(pending).toHaveLength(1);
    pending[0].flush(result([sample[1]], null, 2));
    await update();
    expect(text().match(/P-002/g)).toHaveLength(1);
  });

  it('stops loading at the end of results and starts again for a new search', async () => {
    await render();
    request().flush(result());
    await update();
    expect(
      [...root().querySelectorAll('button')].some(
        (element) =>
          /load (next|more)/i.test(element.textContent ?? '') &&
          !element.disabled,
      ),
    ).toBe(false);
    await submitSearch('alpha');
    request().flush(result([sample[0]]));
    await update();
    expect(text()).toContain('Alpha');
  });

  it('clears previous results when committing a different search', async () => {
    await render();
    request().flush(result([{ ...sample[0], name: 'Old result' }]));
    await update();
    await submitSearch('new');
    const pending = request();
    expect(text()).not.toContain('Old result');
    pending.flush(result([{ ...sample[0], name: 'New result' }]));
    await update();
    expect(text()).toContain('New result');
  });

  it.each(['success', 'failure'] as const)(
    'ignores an old next-batch %s after the query changes',
    async (outcome) => {
      await render();
      request().flush(result([sample[0]], 1));
      await update();
      button(/load (next|more)/i).click();
      await update();
      const oldBatch = request();
      await submitSearch('new');
      request().flush(result([{ ...sample[0], name: 'New result' }]));
      await update();
      if (!oldBatch.cancelled) {
        if (outcome === 'success')
          oldBatch.flush(result([{ ...sample[1], name: 'Stale batch' }]));
        else
          oldBatch.flush(
            { message: 'Old failure' },
            { status: 503, statusText: 'Unavailable' },
          );
      }
      await update();
      expect(text()).toContain('New result');
      expect(text()).not.toContain('Stale batch');
      expect(root().querySelector('[role="alert"]')).toBeNull();
    },
  );

  it('does not show invented application navigation and links each product row to its detail route', async () => {
    await render();
    request().flush(result());
    await update();
    const links = [...root().querySelectorAll('nav a')];
    expect(
      links.some((link) =>
        /^(applications|resources|contact)$/i.test(
          link.textContent?.trim() ?? '',
        ),
      ),
    ).toBe(false);
    const productLinks = [
      ...root().querySelectorAll<HTMLAnchorElement>('.products a'),
    ];
    expect(productLinks).toHaveLength(sample.length);
    expect(productLinks.map((link) => link.getAttribute('href'))).toEqual([
      `/products/${sample[0].id}`,
      `/products/${sample[1].id}`,
    ]);
  });

  it('renders source text as text rather than executable markup', async () => {
    await render();
    request().flush(
      result([{ ...sample[0], name: '<img src=x onerror=alert(1)>' }]),
    );
    await update();
    expect(text()).toContain('<img src=x onerror=alert(1)>');
    expect(root().querySelector('img[onerror]')).toBeNull();
  });
});
