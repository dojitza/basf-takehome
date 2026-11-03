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
    sku: 'P-001',
    name: 'Alpha',
    status: 'ACTIVE',
    applicationArea: 'Coatings',
  },
  { sku: 'P-002', name: null, status: 'DISCONTINUED', applicationArea: 'Food' },
];
const result = (
  items = sample,
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
  const found = [...root().querySelectorAll('button')].find((element) =>
    name.test(
      `${element.textContent ?? ''} ${element.getAttribute('aria-label') ?? ''}`,
    ),
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
          name: 'Unavailable',
          status: 'UNAVAILABLE',
        },
        { ...sample[1], sku: 'P-004', name: 'Stopped', status: 'DISCONTINUED' },
      ]),
    );
    await update();
    expect(text()).toMatch(/unavailable/i);
    expect(text()).toMatch(/discontinued/i);
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
    request().flush(
      { message: 'Unavailable' },
      { status: 503, statusText: 'Unavailable' },
    );
    await update();
    expect(root().querySelector('[role="alert"]')).not.toBeNull();
    button(/retry/i).click();
    await update();
    request().flush(result());
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

  it('ignores an unknown application area from a shared link and warns', async () => {
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

  it('does not show invented application navigation', async () => {
    await render();
    for (const pending of http.match((req) =>
      req.url.startsWith('/api/products'),
    ))
      pending.flush(result());
    await update();
    const links = [...root().querySelectorAll('nav a')];
    expect(
      links.some((link) =>
        /^(applications|resources|contact)$/i.test(
          link.textContent?.trim() ?? '',
        ),
      ),
    ).toBe(false);
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
