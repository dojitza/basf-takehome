import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

const id1 = '00000000-0000-4000-8000-000000000001';
const id2 = '00000000-0000-4000-8000-000000000002';

const catalogueItems = [
  {
    id: id1,
    sku: 'P-001',
    name: 'Alpha Dispersion',
    status: 'ACTIVE',
    presentInLatestImport: true,
    applicationArea: 'Coatings',
    chemicalName: 'Acrylic dispersion',
    function: 'Binder',
  },
  {
    id: id2,
    sku: 'P-002',
    name: null,
    status: 'DISCONTINUED',
    presentInLatestImport: true,
    applicationArea: 'Food',
    chemicalName: null,
    function: null,
  },
];

const detailRecord = {
  id: id1,
  sku: 'P-001',
  name: 'Alpha Dispersion',
  chemicalName: 'Acrylic dispersion',
  description: 'Aqueous dispersion for industrial coatings.',
  function: 'Binder',
  applicationArea: 'Coatings',
  region: 'Europe',
  certifications: ['ISO 9001', 'REACH', 'EcoCert'],
  launchYear: 2021,
  status: 'ACTIVE',
  presentInLatestImport: true,
};

const listResponse = (
  items = catalogueItems,
  nextOffset: number | null = null,
  total = nextOffset === null ? items.length : nextOffset + 1,
  applicationAreas = ['Coatings', 'Food'],
) => ({
  items,
  total,
  nextOffset,
  applicationAreas,
});

let fixture: ComponentFixture<App>;
let http: HttpTestingController;
let router: Router;
let location: Location;
const originalShare = navigator.share;
const originalClipboard = navigator.clipboard;

async function render(initialUrl = '/') {
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
  location = TestBed.inject(Location);
  fixture = TestBed.createComponent(App);
  await router.navigateByUrl(initialUrl);
  await update();
}

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

function expectListRequest(): TestRequest {
  const active = http
    .match((req) => req.method === 'GET' && req.url === '/api/products')
    .filter((req) => !req.cancelled);
  expect(active).toHaveLength(1);
  return active[0];
}

function expectDetailRequest(id = id1): TestRequest {
  const active = http
    .match((req) => req.method === 'GET' && req.url === `/api/products/${id}`)
    .filter((req) => !req.cancelled);
  expect(active).toHaveLength(1);
  return active[0];
}

function findButton(name: RegExp): HTMLButtonElement | undefined {
  return [...root().querySelectorAll('button')].find(
    (element) =>
      name.test(element.textContent?.trim() ?? '') ||
      name.test(element.getAttribute('aria-label')?.trim() ?? ''),
  );
}

function button(name: RegExp): HTMLButtonElement {
  const found = findButton(name);
  if (!found) throw new Error(`A button matching ${name} was not found`);
  return found;
}

function link(name: RegExp): HTMLAnchorElement {
  const found = [...root().querySelectorAll<HTMLAnchorElement>('a')].find(
    (element) =>
      name.test(element.textContent?.trim() ?? '') ||
      name.test(element.getAttribute('aria-label')?.trim() ?? ''),
  );
  if (!found) throw new Error(`A link matching ${name} was not found`);
  return found;
}

afterEach(() => {
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: originalShare,
  });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: originalClipboard,
  });
  if (http) http.verify({ ignoreCancelled: true });
  fixture?.destroy();
});

describe('product details, sharing and navigation (v0.2.0)', () => {
  it('renders each catalogue row as an accessible link with committed criteria and without uncommitted drafts or batch offsets', async () => {
    await render(
      '/?search=Alpha&status=ACTIVE&applicationArea=Coatings&sort=name-desc',
    );
    expectListRequest().flush(listResponse(catalogueItems, 30, 60));
    await update();

    // Load a second batch and edit search and filter drafts without committing them.
    button(/load (next|more)/i).click();
    await update();
    expectListRequest().flush(
      listResponse(
        [
          {
            ...catalogueItems[1],
            id: '00000000-0000-4000-8000-000000000003',
            sku: 'P-003',
          },
        ],
        null,
        60,
      ),
    );
    await update();

    const searchField = root().querySelector<HTMLInputElement>(
      'input[type="search"], input[aria-label*="earch"], input[id*="search"]',
    )!;
    searchField.value = 'uncommitted draft';
    searchField.dispatchEvent(new Event('input', { bubbles: true }));
    button(/^filters$/i).click();
    await update();
    const discontinuedBox = [
      ...root().querySelectorAll<HTMLInputElement>(
        '[role="dialog"] input[type="checkbox"]',
      ),
    ].find((box) => /discontinued/i.test(box.parentElement?.textContent ?? ''));
    discontinuedBox!.checked = true;
    discontinuedBox!.dispatchEvent(new Event('change', { bubbles: true }));
    button(/^close$/i).click();
    await update();

    const rowLinks = [
      ...root().querySelectorAll<HTMLAnchorElement>('.products a'),
    ];
    expect(rowLinks.length).toBeGreaterThanOrEqual(2);
    const parsed = new URL(rowLinks[0].getAttribute('href')!, 'http://example');
    expect(parsed.pathname).toBe(`/products/${id1}`);
    expect(parsed.searchParams.get('search')).toBe('Alpha');
    expect(parsed.searchParams.getAll('status')).toEqual(['ACTIVE']);
    expect(parsed.searchParams.getAll('applicationArea')).toEqual(['Coatings']);
    expect(parsed.searchParams.get('sort')).toBe('name-desc');
    expect(parsed.searchParams.has('offset')).toBe(false);
    expect(parsed.searchParams.has('limit')).toBe(false);
  });

  it('loads product details, displays all customer-facing fields without metadata or invented controls, and focuses the heading', async () => {
    await render(`/products/${id1}`);
    const pending = expectDetailRequest(id1);
    expect(
      root().querySelector('[aria-busy="true"], [role="status"]'),
    ).not.toBeNull();
    expect(text()).not.toMatch(/product not found|unable to load/i);

    pending.flush(detailRecord);
    await update();

    const heading = root().querySelector('h1');
    expect(heading?.textContent?.trim()).toBe('Alpha Dispersion');
    expect(
      document.activeElement === heading ||
        Boolean(heading?.contains(document.activeElement)),
    ).toBe(true);

    for (const expected of [
      'P-001',
      'Acrylic dispersion',
      'Aqueous dispersion for industrial coatings.',
      'Binder',
      'Coatings',
      'Europe',
      'ISO 9001',
      'REACH',
      'EcoCert',
      '2021',
      'Active',
    ]) {
      expect(text()).toContain(expected);
    }

    // Must not expose internal UUID, timestamps/import flags, review placeholders, or invented actions/catalogue controls.
    expect(text()).not.toContain(id1);
    expect(text()).not.toMatch(
      /presentInLatestImport|lastImportedAt|createdAt|updatedAt/i,
    );
    expect(text()).not.toMatch(
      /review|rating|add to cart|order now|request quote|contact sales|in stock|out of stock/i,
    );
    expect(
      root().querySelector('input[type="search"], #desktop-search'),
    ).toBeNull();
  });

  it('uses SKU as the heading when name is missing and explains missing properties and empty certifications', async () => {
    await render(`/products/${id2}`);
    expectDetailRequest(id2).flush({
      id: id2,
      sku: 'P-UNNAMED',
      name: null,
      chemicalName: null,
      description: null,
      function: null,
      applicationArea: null,
      region: null,
      certifications: [],
      launchYear: null,
      status: 'ACTIVE',
      presentInLatestImport: true,
    });
    await update();

    expect(root().querySelector('h1')?.textContent?.trim()).toBe('P-UNNAMED');
    // All 6 optional text/number properties (chemicalName, description, function, applicationArea, region, launchYear) show "Not provided".
    const notProvidedMatches = text().match(/Not provided/g) ?? [];
    expect(notProvidedMatches).toHaveLength(6);
    expect(text()).toContain('None listed');
    expect(text()).not.toMatch(/uncertified/i);
  });

  it.each([
    ['ACTIVE', true, 'Active', null],
    ['PHASE_OUT', true, 'Phase-out', null],
    ['DISCONTINUED', true, 'Discontinued', null],
    ['UNKNOWN', true, 'Unavailable', /unconfirmed|not confirmed/i],
    [
      'ACTIVE',
      false,
      'Unavailable',
      /absent.*latest (catalogue|import)|not in.*latest (catalogue|import)/i,
    ],
    [
      'PHASE_OUT',
      false,
      'Unavailable',
      /absent.*latest (catalogue|import)|not in.*latest (catalogue|import)/i,
    ],
    [
      'DISCONTINUED',
      false,
      'Unavailable',
      /absent.*latest (catalogue|import)|not in.*latest (catalogue|import)/i,
    ],
    [
      'UNKNOWN',
      false,
      'Unavailable',
      /absent.*latest (catalogue|import)|not in.*latest (catalogue|import)/i,
    ],
  ] as const)(
    'maps status=%s and presentInLatestImport=%s to %s with the agreed availability explanation',
    async (status, presentInLatestImport, expectedBadge, explanation) => {
      await render(`/products/${id1}`);
      expectDetailRequest(id1).flush({
        ...detailRecord,
        status,
        presentInLatestImport,
      });
      await update();

      expect(root().querySelector('p-tag')?.textContent?.trim()).toBe(
        expectedBadge,
      );
      if (explanation) {
        expect(text()).toMatch(explanation);
      }
      expect(text()).not.toMatch(/in stock|out of stock|orderable/i);
    },
  );

  it('renders executable markup in product detail fields as literal text', async () => {
    await render(`/products/${id1}`);
    expectDetailRequest(id1).flush({
      ...detailRecord,
      name: '<script>window.__xss = 1</script>',
      description: '<img src=x onerror=alert(1)>',
      certifications: ['<b>ISO</b>'],
    });
    await update();

    expect(text()).toContain('<script>window.__xss = 1</script>');
    expect(text()).toContain('<img src=x onerror=alert(1)>');
    expect(text()).toContain('<b>ISO</b>');
    expect(root().querySelector('img[onerror]')).toBeNull();
  });

  describe('property-based criteria serialization and normalization invariants', () => {
    it('round-trips arbitrary valid criteria identically across row links, detail return links, and catalogue queries while omitting defaults', async () => {
      let seed = 0x13572468;
      const rand = () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const searches = [
        '',
        '   ',
        'Alpha',
        '  Alpha & Beta + 100%  ',
        'Crème / Polymer #1 ?query=no',
        'SKU-001=test',
      ];
      const allStatuses = [
        'ACTIVE',
        'PHASE_OUT',
        'DISCONTINUED',
        'UNAVAILABLE',
      ];
      const allAreas = ['Coatings', 'Food'];

      await render('/');
      expectListRequest().flush(listResponse());
      await update();

      for (let run = 0; run < 16; run++) {
        const rawSearch = searches[Math.floor(rand() * searches.length)];
        const expectedSearch = rawSearch.trim();
        const pickedStatuses: string[] = [];
        for (const s of allStatuses) {
          if (rand() > 0.5) {
            pickedStatuses.push(s);
            if (rand() > 0.7) pickedStatuses.push(s); // duplicate
          }
        }
        const expectedStatuses = [...new Set(pickedStatuses)];

        const pickedAreas: string[] = [];
        for (const a of allAreas) {
          if (rand() > 0.5) {
            pickedAreas.push(a);
            if (rand() > 0.7) pickedAreas.push(a); // duplicate
          }
        }
        const expectedAreas = [...new Set(pickedAreas)];
        const sort = rand() > 0.5 ? 'name-desc' : 'name';

        const query = new URLSearchParams();
        if (rawSearch) query.set('search', rawSearch);
        for (const s of pickedStatuses) query.append('status', s);
        for (const a of pickedAreas) query.append('applicationArea', a);
        if (rand() > 0.3 || sort !== 'name') query.set('sort', sort);

        const queryString = query.toString();
        await router.navigateByUrl(
          `/products/${id1}${queryString ? `?${queryString}` : ''}`,
        );
        await update();
        const detailPending = http.match(
          (req) => req.url === `/api/products/${id1}`,
        );
        for (const req of detailPending) req.flush(detailRecord);
        await update();

        const backHref = link(/back to catalogue/i).getAttribute('href')!;
        const backUrl = new URL(backHref, 'http://example');
        expect(backUrl.pathname).toBe('/');
        expect(backUrl.searchParams.get('search')).toBe(expectedSearch || null);
        expect(backUrl.searchParams.getAll('status')).toEqual(expectedStatuses);
        expect(backUrl.searchParams.getAll('applicationArea')).toEqual(
          expectedAreas,
        );
        expect(backUrl.searchParams.get('sort')).toBe(
          sort === 'name-desc' ? 'name-desc' : null,
        );

        link(/back to catalogue/i).click();
        await update();
        const listReq = expectListRequest();
        expect(listReq.request.params.get('offset')).toBe('0');
        expect(listReq.request.params.get('limit')).toBe('30');
        expect(listReq.request.params.get('search')).toBe(
          expectedSearch || null,
        );
        expect(listReq.request.params.getAll('status') ?? []).toEqual(
          expectedStatuses,
        );
        expect(listReq.request.params.getAll('applicationArea') ?? []).toEqual(
          expectedAreas,
        );
        expect(listReq.request.params.get('sort')).toBe(sort);
        listReq.flush(listResponse());
        await update();
      }
    });

    it.each([
      [
        'oversized search (>200 chars)',
        `search=${'x'.repeat(201)}&status=ACTIVE&sort=name-desc`,
        {
          search: null,
          status: ['ACTIVE'],
          applicationArea: [],
          sort: 'name-desc',
        },
      ],
      [
        'repeated scalar search parameters',
        'search=first&search=second&status=PHASE_OUT',
        {
          search: null,
          status: ['PHASE_OUT'],
          applicationArea: [],
          sort: 'name',
        },
      ],
      [
        'repeated scalar sort parameters',
        'search=Alpha&sort=name-desc&sort=name',
        {
          search: 'Alpha',
          status: [],
          applicationArea: [],
          sort: 'name',
        },
      ],
      [
        'whitespace-only applicationArea and unsupported status/sort',
        'search=Alpha&status=BOGUS&status=ACTIVE&applicationArea=%20%20&applicationArea=Coatings&sort=bogus',
        {
          search: 'Alpha',
          status: ['ACTIVE'],
          applicationArea: ['Coatings'],
          sort: 'name',
        },
      ],
    ])(
      'normalizes %s on both catalogue and detail-return routes before querying the API and warns the customer',
      async (_description, rawQuery, expected) => {
        await render(`/?${rawQuery}`);
        const catalogueReq = expectListRequest();
        expect(catalogueReq.request.params.get('search')).toBe(expected.search);
        expect(catalogueReq.request.params.getAll('status') ?? []).toEqual(
          expected.status,
        );
        expect(
          catalogueReq.request.params.getAll('applicationArea') ?? [],
        ).toEqual(expected.applicationArea);
        expect(catalogueReq.request.params.get('sort')).toBe(expected.sort);
        catalogueReq.flush(listResponse());
        await update();
        expect(text()).toMatch(/invalid|unsupported|ignored/i);

        await router.navigateByUrl(`/products/${id1}?${rawQuery}`);
        await update();
        expectDetailRequest(id1).flush(detailRecord);
        await update();

        link(/back to catalogue/i).click();
        await update();

        const req = expectListRequest();
        expect(req.request.params.get('search')).toBe(expected.search);
        expect(req.request.params.getAll('status') ?? []).toEqual(
          expected.status,
        );
        expect(req.request.params.getAll('applicationArea') ?? []).toEqual(
          expected.applicationArea,
        );
        expect(req.request.params.get('sort')).toBe(expected.sort);
        req.flush(listResponse());
        await update();

        expect(text()).toMatch(/invalid|unsupported|ignored/i);
      },
    );

    it.each([200, 404, 503] as const)(
      'preserves candidate applicationArea values across a %i detail response so the catalogue validates them upon return',
      async (detailStatus) => {
        await render(
          `/products/${id1}?search=Alpha&applicationArea=Coatings&applicationArea=UnknownCandidate`,
        );
        const detailReq = expectDetailRequest(id1);
        if (detailStatus === 200) {
          detailReq.flush(detailRecord);
        } else {
          detailReq.flush(
            { message: detailStatus === 404 ? 'Not found' : 'Unavailable' },
            {
              status: detailStatus,
              statusText: detailStatus === 404 ? 'Not Found' : 'Unavailable',
            },
          );
        }
        await update();

        const backLink = link(/back to catalogue/i);
        const backUrl = new URL(
          backLink.getAttribute('href')!,
          'http://example',
        );
        expect(backUrl.searchParams.getAll('applicationArea')).toEqual([
          'Coatings',
          'UnknownCandidate',
        ]);

        backLink.click();
        await update();

        const initialListReq = expectListRequest();
        expect(initialListReq.request.params.getAll('applicationArea')).toEqual(
          ['Coatings', 'UnknownCandidate'],
        );
        initialListReq.flush(listResponse([], null, 0, ['Coatings', 'Food']));
        await update();

        const cleanedListReq = expectListRequest();
        expect(cleanedListReq.request.params.getAll('applicationArea')).toEqual(
          ['Coatings'],
        );
        cleanedListReq.flush(
          listResponse([catalogueItems[0]], null, 1, ['Coatings', 'Food']),
        );
        await update();

        expect(text()).toMatch(/invalid|unsupported|ignored/i);
        expect(location.path()).not.toContain('UnknownCandidate');
        expect(location.path()).toContain('applicationArea=Coatings');
      },
    );
  });

  describe('concurrency and stale-response handling', () => {
    it('immediately clears previous product details when navigating to another product and ignores late responses or errors', async () => {
      await render(`/products/${id1}`);
      expectDetailRequest(id1).flush(detailRecord);
      await update();
      expect(text()).toContain('Alpha Dispersion');

      // Navigate to a second product while its request remains in-flight.
      await router.navigateByUrl(`/products/${id2}`);
      await update();
      const secondReq = expectDetailRequest(id2);

      // Previous product details must be cleared immediately during loading.
      expect(text()).not.toContain('Alpha Dispersion');
      expect(
        root().querySelector('[aria-busy="true"], [role="status"]'),
      ).not.toBeNull();

      // Navigate back to id1 before id2 resolves.
      await router.navigateByUrl(`/products/${id1}`);
      await update();
      const thirdReq = expectDetailRequest(id1);
      thirdReq.flush(detailRecord);
      await update();
      expect(text()).toContain('Alpha Dispersion');

      // Late response from id2 (if not already cancelled) must not overwrite id1.
      if (!secondReq.cancelled) {
        secondReq.flush({
          ...detailRecord,
          id: id2,
          sku: 'P-STALE',
          name: 'Stale Product',
        });
        await update();
      }
      expect(text()).toContain('Alpha Dispersion');
      expect(text()).not.toContain('Stale Product');
    });

    it('ignores a late detail error after navigating to another product or returning to the catalogue', async () => {
      await render(`/products/${id1}`);
      const firstReq = expectDetailRequest(id1);

      await router.navigateByUrl(`/products/${id2}`);
      await update();
      const secondReq = expectDetailRequest(id2);
      secondReq.flush({
        ...detailRecord,
        id: id2,
        sku: 'P-002',
        name: 'Current Product',
      });
      await update();

      if (!firstReq.cancelled) {
        firstReq.flush(
          { message: 'Server error' },
          { status: 503, statusText: 'Service Unavailable' },
        );
        await update();
      }
      expect(text()).toContain('Current Product');
      expect(root().querySelector('[role="alert"]')).toBeNull();
      expect(findButton(/retry/i)).toBeUndefined();
    });

    it('guards against duplicate concurrent requests when Retry is clicked repeatedly', async () => {
      await render(`/products/${id1}`);
      expectDetailRequest(id1).flush(
        { message: 'Unavailable' },
        { status: 503, statusText: 'Service Unavailable' },
      );
      await update();

      const retry = button(/retry/i);
      retry.click();
      retry.click();
      await update();

      const inFlight = http.match((req) => req.url === `/api/products/${id1}`);
      expect(inFlight).toHaveLength(1);
      inFlight[0].flush(detailRecord);
      await update();
      expect(text()).toContain('Alpha Dispersion');
    });
  });

  describe('fault injection: API failures, clipboard failures, and Web Share capabilities', () => {
    it('distinguishes 404 Product not found (no Retry) from 503/network service failures (with Retry)', async () => {
      await render(`/products/${id1}?search=Alpha&status=ACTIVE`);
      expectDetailRequest(id1).flush(
        { message: 'Not Found' },
        { status: 404, statusText: 'Not Found' },
      );
      await update();

      expect(text()).toMatch(/product not found/i);
      expect(findButton(/retry/i)).toBeUndefined();
      const back404 = new URL(
        link(/back to catalogue/i).getAttribute('href')!,
        'http://example',
      );
      expect(back404.searchParams.get('search')).toBe('Alpha');
      expect(back404.searchParams.getAll('status')).toEqual(['ACTIVE']);

      // Navigate to a second product that encounters a network error, then retry.
      await router.navigateByUrl(`/products/${id2}?search=Alpha&status=ACTIVE`);
      await update();
      expectDetailRequest(id2).error(new ProgressEvent('error'));
      await update();

      expect(text()).not.toMatch(/product not found/i);
      expect(root().querySelector('[role="alert"]')).not.toBeNull();
      const retry = button(/retry/i);
      expect(retry).toBeDefined();

      retry.click();
      await update();
      expectDetailRequest(id2).flush({
        ...detailRecord,
        id: id2,
        sku: 'P-002',
        name: 'Recovered Product',
      });
      await update();
      expect(text()).toContain('Recovered Product');
      expect(findButton(/retry/i)).toBeUndefined();
    });

    it('hides native Share when navigator.share is unsupported and handles AbortError vs non-abort rejection when supported', async () => {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: undefined,
      });
      await render(`/products/${id1}?search=Alpha`);
      expectDetailRequest(id1).flush(detailRecord);
      await update();

      expect(findButton(/^share$/i)).toBeUndefined();
      expect(button(/copy link/i)).toBeDefined();

      fixture.destroy();
      let sharedData: ShareData | undefined;
      let shouldAbort = true;
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: jest.fn((data: ShareData) => {
          sharedData = data;
          return shouldAbort
            ? Promise.reject(new DOMException('Cancelled', 'AbortError'))
            : Promise.reject(new Error('Share target failed'));
        }),
      });

      await render(`/products/${id1}?search=Alpha&sort=name-desc`);
      expectDetailRequest(id1).flush(detailRecord);
      await update();

      const shareBtn = button(/^share$/i);
      shareBtn.click();
      await update();

      expect(sharedData?.url).toBeDefined();
      const sharedUrl = new URL(sharedData!.url!);
      expect(sharedUrl.pathname).toBe(`/products/${id1}`);
      expect(sharedUrl.searchParams.get('search')).toBe('Alpha');
      expect(sharedUrl.searchParams.get('sort')).toBe('name-desc');
      expect(root().querySelector('[role="alert"]')).toBeNull();
      expect(text()).not.toMatch(/copied to clipboard|link copied/i);

      // Non-abort share error should not throw an unhandled rejection or claim success.
      shouldAbort = false;
      shareBtn.click();
      await update();
      expect(text()).not.toMatch(/copied to clipboard|link copied/i);
    });

    it.each(['undefined-clipboard', 'rejected-write'] as const)(
      'provides failure feedback and a selectable manual link without claiming success on %s',
      async (mode) => {
        if (mode === 'undefined-clipboard') {
          Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: undefined,
          });
        } else {
          Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
              writeText: jest.fn(() =>
                Promise.reject(
                  new DOMException('Permission denied', 'NotAllowedError'),
                ),
              ),
            },
          });
        }

        await render(
          `/products/${id1}?search=Alpha&status=ACTIVE&sort=name-desc`,
        );
        expectDetailRequest(id1).flush(detailRecord);
        await update();

        const copyBtn = button(/copy link/i);
        copyBtn.click();
        await update();

        expect(text()).not.toMatch(/link copied|copied to clipboard/i);
        expect(text()).toMatch(
          /unable to copy|copy failed|manual|copy the link/i,
        );
        const manualInput = root().querySelector<HTMLInputElement>(
          'input[aria-label*="link" i], input[readonly]',
        );
        expect(manualInput).not.toBeNull();
        const manualUrl = new URL(manualInput!.value);
        expect(manualUrl.pathname).toBe(`/products/${id1}`);
        expect(manualUrl.searchParams.get('search')).toBe('Alpha');
        expect(manualUrl.searchParams.getAll('status')).toEqual(['ACTIVE']);
        expect(manualUrl.searchParams.get('sort')).toBe('name-desc');

        const dismissBtn = button(/dismiss/i);
        expect(dismissBtn).toBeDefined();
        dismissBtn.click();
        await update();
        expect(
          root().querySelector('input[aria-label*="link" i], input[readonly]'),
        ).toBeNull();
        expect(document.activeElement).toBe(copyBtn);
      },
    );

    it('copies the link when clipboard.writeText succeeds and allows dismissing the success banner with focus returned to Copy link', async () => {
      let copiedText = '';
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: jest.fn((text: string) => {
            copiedText = text;
            return Promise.resolve();
          }),
        },
      });

      await render(
        `/products/${id1}?search=Alpha&status=ACTIVE&sort=name-desc`,
      );
      expectDetailRequest(id1).flush(detailRecord);
      await update();

      const copyBtn = button(/copy link/i);
      copyBtn.click();
      await update();

      expect(text()).toMatch(/link copied to clipboard/i);
      expect(copiedText).toContain(`/products/${id1}`);

      const dismissBtn = button(/dismiss notification/i);
      expect(dismissBtn).toBeDefined();
      dismissBtn.click();
      await update();

      expect(text()).not.toMatch(/link copied to clipboard/i);
      expect(document.activeElement).toBe(copyBtn);
    });

    it('exposes Back to catalogue while loading without showing Share/Copy link, and focuses the error heading on 503', async () => {
      await render(`/products/${id1}?search=Alpha&sort=name-desc`);

      // While detail request is still in-flight:
      const backWhileLoading = link(/back to catalogue/i);
      expect(backWhileLoading).toBeDefined();
      expect(findButton(/copy link/i)).toBeUndefined();
      expect(findButton(/^share$/i)).toBeUndefined();

      expectDetailRequest(id1).flush(
        { message: 'Database unavailable' },
        { status: 503, statusText: 'Service Unavailable' },
      );
      await update();

      const heading = root().querySelector<HTMLElement>('h1');
      expect(heading?.textContent).toMatch(/unable to load product/i);
      expect(document.activeElement).toBe(heading);

      // Returning to catalogue from the error recovery link focuses the catalogue heading.
      link(/back to catalogue/i).click();
      await update();
      const listReq = expectListRequest();
      expect(listReq.request.params.get('search')).toBe('Alpha');
      expect(listReq.request.params.get('sort')).toBe('name-desc');
      listReq.flush(listResponse([catalogueItems[0]]));
      await update();

      const catalogueHeading = root().querySelector<HTMLElement>('h1');
      expect(catalogueHeading?.textContent).toMatch(/products/i);
      expect(document.activeElement).toBe(catalogueHeading);
    });

    it('does not commit an uncommitted desktop search draft on mousedown when clicking a product row or Copy link to results, and preserves copy feedback on unchanged search blur', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: jest.fn(() => Promise.resolve()),
        },
      });

      await render('/?search=Alpha');
      const initialListReq = expectListRequest();
      expect(initialListReq.request.params.get('search')).toBe('Alpha');
      initialListReq.flush(listResponse([catalogueItems[0]]));
      await update();

      const copyResultsBtn = button(/copy link to results/i);
      copyResultsBtn.click();
      await update();
      expect(text()).toMatch(/link copied to clipboard/i);

      // Focusing and blurring desktop search without changing text preserves the copied banner:
      const searchInput =
        root().querySelector<HTMLInputElement>('#desktop-search')!;
      searchInput.dispatchEvent(new Event('focus'));
      searchInput.dispatchEvent(new Event('blur'));
      await update();
      expect(text()).toMatch(/link copied to clipboard/i);

      // Typing an uncommitted draft and mousedown + clicking a product row opens the product
      // with applied criteria ('Alpha') without firing a new list search request:
      searchInput.value = 'UncommittedDraft';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await update();

      const productAnchor = link(/alpha/i);
      productAnchor.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true }),
      );
      searchInput.dispatchEvent(new Event('blur'));
      await update();

      // Product row is still intact and no new catalogue search request was sent:
      http.expectNone((req) => req.url === '/api/products');
      productAnchor.click();
      await update();

      expectDetailRequest(id1).flush(detailRecord);
      await update();
      expect(location.path()).toBe(`/products/${id1}?search=Alpha`);
    });
  });
});
