import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

const id = '00000000-0000-4000-8000-000000000001';
const detail = {
  id,
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

async function update() {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}
function button(label: RegExp): HTMLButtonElement {
  const found = [
    ...(fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>),
  ].find(
    (b) =>
      label.test(b.textContent?.trim() ?? '') ||
      label.test(b.getAttribute('aria-label') ?? ''),
  );
  if (!found) throw new Error(`Missing button ${label}`);
  return found;
}
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
  await TestBed.inject(Router).navigateByUrl(`/products/${id}`);
  await update();
  http.expectOne(`/api/products/${id}`).flush(detail);
  await update();
}
afterEach(() => {
  fixture?.destroy();
  TestBed.resetTestingModule();
});

describe('reviews on product details', () => {
  it('shows the empty state and write action after loading an empty summary', async () => {
    await render();
    http
      .expectOne((req) => req.url === `/api/products/${id}/reviews`)
      .flush({
        items: [],
        nextCursor: null,
        summary: { count: 0, average: null },
      });
    await update();
    expect(fixture.nativeElement.textContent).toContain(
      'No customer reviews yet',
    );
    expect(button(/write a review/i)).toBeTruthy();
  });
  it('keeps product and write action available after the reviews request fails and retries', async () => {
    await render();
    http
      .expectOne((req) => req.url === `/api/products/${id}/reviews`)
      .flush('unavailable', { status: 503, statusText: 'Unavailable' });
    await update();
    expect(fixture.nativeElement.textContent).toContain('Alpha');
    expect(button(/write a review/i)).toBeTruthy();
    button(/retry/i).click();
    await update();
    http
      .expectOne((req) => req.url === `/api/products/${id}/reviews`)
      .flush({
        items: [],
        nextCursor: null,
        summary: { count: 0, average: null },
      });
    await update();
    expect(fixture.nativeElement.textContent).toContain(
      'No customer reviews yet',
    );
  });
  it('rejects submitting without a rating', async () => {
    await render();
    http
      .expectOne((req) => req.url === `/api/products/${id}/reviews`)
      .flush({
        items: [],
        nextCursor: null,
        summary: { count: 0, average: null },
      });
    await update();
    button(/write a review/i).click();
    await update();
    button(/submit/i).click();
    await update();
    expect(fixture.nativeElement.textContent).toContain(
      'Please select a rating between 1 and 5 stars',
    );
    http.expectNone(
      (req) =>
        req.method === 'POST' && req.url === `/api/products/${id}/reviews`,
    );
  });
  it('shows the aggregate across all reviews and the anonymous fallback', async () => {
    await render();
    http
      .expectOne((req) => req.url === `/api/products/${id}/reviews`)
      .flush({
        items: [
          {
            id: 'review-1',
            rating: 5,
            reviewerName: null,
            comment: 'Helpful',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        nextCursor: null,
        summary: { count: 2, average: 4.5 },
      });
    await update();
    expect(fixture.nativeElement.textContent).toContain('4.5');
    expect(fixture.nativeElement.textContent).toContain('Anonymous customer');
    expect(fixture.nativeElement.textContent).toContain('Helpful');
  });

  it('keeps loaded reviews visible when loading the next batch fails and allows retry', async () => {
    await render();
    http
      .expectOne((req) => req.url === `/api/products/${id}/reviews`)
      .flush({
        items: [
          {
            id: 'review-1',
            rating: 5,
            reviewerName: 'Alex',
            comment: 'First review',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        nextCursor: 'next-page',
        summary: { count: 2, average: 4.5 },
      });
    await update();
    button(/load more/i).click();
    await update();
    http
      .expectOne(
        (req) =>
          req.url === `/api/products/${id}/reviews` &&
          req.params.get('cursor') === 'next-page',
      )
      .flush('unavailable', { status: 503, statusText: 'Unavailable' });
    await update();
    expect(fixture.nativeElement.textContent).toContain('First review');
    button(/retry/i).click();
    await update();
    http
      .expectOne(
        (req) =>
          req.url === `/api/products/${id}/reviews` &&
          req.params.get('cursor') === 'next-page',
      )
      .flush({
        items: [
          {
            id: 'review-2',
            rating: 4,
            reviewerName: 'Bea',
            comment: 'Second review',
            createdAt: '2025-12-31T00:00:00.000Z',
          },
        ],
        nextCursor: null,
        summary: { count: 2, average: 4.5 },
      });
    await update();
    expect(fixture.nativeElement.textContent).toContain('First review');
    expect(fixture.nativeElement.textContent).toContain('Second review');
  });
});
