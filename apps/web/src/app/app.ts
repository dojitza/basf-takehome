import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

type Product = {
  sku: string;
  name: string | null;
  status: string;
  presentInLatestImport?: boolean;
  applicationArea: string | null;
  chemicalName?: string | null;
  function?: string | null;
};
type Page = {
  items: Product[];
  total: number;
  nextOffset: number | null;
  applicationAreas?: string[];
};
type Criteria = {
  search: string;
  status: string[];
  applicationArea: string[];
  sort: string;
};
const statuses = ['ACTIVE', 'PHASE_OUT', 'DISCONTINUED', 'UNAVAILABLE'];
const initial = (): Criteria => ({
  search: '',
  status: [],
  applicationArea: [],
  sort: 'name',
});

@Component({
  selector: 'app-root',
  imports: [FormsModule, ButtonModule, InputTextModule, TagModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnDestroy {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly subscriptions = new Subscription();
  private request?: Subscription;
  private observer?: IntersectionObserver;
  private lastTrigger?: HTMLElement;
  private generation = 0;
  @ViewChild('sentinel') set sentinel(
    value: ElementRef<HTMLElement> | undefined,
  ) {
    this.observer?.disconnect();
    if (value && typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting) && !this.error)
            this.loadMore();
        },
        { rootMargin: '100px' },
      );
      this.observer.observe(value.nativeElement);
    }
  }
  criteria = initial();
  draft = initial();
  searchInput = '';
  mobileSearch = false;
  panel: 'filter' | 'sort' | null = null;
  products: Product[] = [];
  areas: string[] = [];
  readonly statuses = statuses;
  total = 0;
  nextOffset: number | null = null;
  loading = false;
  error = false;
  warning = false;
  private loadedKey = '';

  constructor() {
    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        const rawStatuses = params.getAll('status');
        const sort = params.get('sort') || 'name';
        this.warning =
          rawStatuses.some((value) => !statuses.includes(value)) ||
          !['name', 'name-desc'].includes(sort);
        this.criteria = {
          search: (params.get('search') || '').trim(),
          status: rawStatuses.filter((value) => statuses.includes(value)),
          applicationArea: params.getAll('applicationArea').filter(Boolean),
          sort: ['name', 'name-desc'].includes(sort) ? sort : 'name',
        };
        this.searchInput = this.criteria.search;
        this.refreshIfChanged();
        this.changeDetector.markForCheck();
      }),
    );
  }
  ngOnDestroy() {
    this.request?.unsubscribe();
    this.subscriptions.unsubscribe();
    this.observer?.disconnect();
  }
  private key() {
    return JSON.stringify(this.criteria);
  }
  private refreshIfChanged() {
    if (this.key() !== this.loadedKey) this.refresh();
  }
  private refresh() {
    this.loadedKey = this.key();
    this.generation++;
    this.request?.unsubscribe();
    this.products = [];
    this.total = 0;
    this.nextOffset = 0;
    this.error = false;
    this.loading = false;
    this.loadMore();
  }
  loadMore() {
    if (this.loading || this.nextOffset === null) return;
    const offset = this.nextOffset;
    const generation = this.generation;
    this.loading = true;
    this.error = false;
    this.changeDetector.markForCheck();
    let params = new HttpParams()
      .set('limit', 30)
      .set('offset', offset)
      .set('sort', this.criteria.sort);
    if (this.criteria.search)
      params = params.set('search', this.criteria.search);
    for (const status of this.criteria.status)
      params = params.append('status', status);
    for (const area of this.criteria.applicationArea)
      params = params.append('applicationArea', area);
    this.request = this.http.get<Page>('/api/products', { params }).subscribe({
      next: (page) => {
        if (generation !== this.generation) return;
        if (
          page.applicationAreas &&
          this.criteria.applicationArea.some(
            (area) => !page.applicationAreas?.includes(area),
          )
        ) {
          this.warning = true;
          this.areas = page.applicationAreas;
          this.criteria = {
            ...this.criteria,
            applicationArea: this.criteria.applicationArea.filter((area) =>
              page.applicationAreas?.includes(area),
            ),
          };
          this.loading = false;
          this.refresh();
          return;
        }
        this.products = [...this.products, ...page.items];
        this.total = page.total;
        this.nextOffset = page.nextOffset;
        if (page.applicationAreas) this.areas = page.applicationAreas;
        else
          this.areas = [
            ...new Set([
              ...this.areas,
              ...page.items
                .map((item) => item.applicationArea)
                .filter((area): area is string => !!area),
            ]),
          ].sort();
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        if (generation !== this.generation) return;
        this.loading = false;
        this.error = true;
        this.changeDetector.markForCheck();
      },
    });
  }
  onTyping(value: string) {
    this.searchInput = value;
  }
  commitSearch() {
    this.criteria = { ...this.criteria, search: this.searchInput.trim() };
    this.searchInput = this.criteria.search;
    const wasMobile = this.mobileSearch;
    this.mobileSearch = false;
    if (wasMobile) this.lastTrigger?.focus();
    this.refreshIfChanged();
    this.navigate();
  }
  openSearch(trigger: HTMLElement) {
    this.lastTrigger = trigger;
    this.mobileSearch = true;
    setTimeout(() =>
      document.querySelector<HTMLElement>('#mobile-search')?.focus(),
    );
  }
  closeSearch() {
    this.mobileSearch = false;
    this.searchInput = this.criteria.search;
    this.lastTrigger?.focus();
  }
  clearSearch() {
    this.searchInput = '';
    this.commitSearch();
  }
  clearFilters() {
    this.searchInput = '';
    this.criteria = {
      ...this.criteria,
      search: '',
      status: [],
      applicationArea: [],
    };
    this.refreshIfChanged();
    this.navigate();
  }
  clearSort() {
    this.criteria = { ...this.criteria, sort: 'name' };
    this.refreshIfChanged();
    this.navigate();
  }
  private navigate() {
    void this.router.navigate([], {
      queryParams: {
        search: this.criteria.search || null,
        status: this.criteria.status.length ? this.criteria.status : null,
        applicationArea: this.criteria.applicationArea.length
          ? this.criteria.applicationArea
          : null,
        sort: this.criteria.sort === 'name' ? null : this.criteria.sort,
      },
    });
  }
  openPanel(panel: 'filter' | 'sort', trigger: HTMLElement) {
    this.lastTrigger = trigger;
    this.draft = {
      ...this.criteria,
      status: [...this.criteria.status],
      applicationArea: [...this.criteria.applicationArea],
    };
    this.panel = panel;
    setTimeout(() =>
      document
        .querySelector<HTMLElement>(
          '[role="dialog"] input, [role="dialog"] button',
        )
        ?.focus(),
    );
  }
  closePanel() {
    this.panel = null;
    this.lastTrigger?.focus();
  }
  applyPanel() {
    this.criteria = { ...this.draft };
    this.closePanel();
    this.refreshIfChanged();
    this.navigate();
  }
  toggle(group: 'status' | 'applicationArea', value: string, checked: boolean) {
    this.draft = {
      ...this.draft,
      [group]: checked
        ? [...this.draft[group], value]
        : this.draft[group].filter((item) => item !== value),
    };
  }
  resetPanel() {
    this.draft =
      this.panel === 'filter'
        ? { ...this.draft, status: [], applicationArea: [] }
        : { ...this.draft, sort: 'name' };
  }
  remove(group: 'status' | 'applicationArea', value: string) {
    this.criteria = {
      ...this.criteria,
      [group]: this.criteria[group].filter((item) => item !== value),
    };
    this.refreshIfChanged();
    this.navigate();
  }
  label(status: string) {
    return (
      (
        {
          ACTIVE: 'Active',
          PHASE_OUT: 'Phase-out',
          DISCONTINUED: 'Discontinued',
          UNAVAILABLE: 'Unavailable',
          UNKNOWN: 'Unavailable',
        } as Record<string, string>
      )[status] || status
    );
  }
  displayStatus(product: Product) {
    return product.presentInLatestImport === false
      ? 'Unavailable'
      : this.label(product.status);
  }
  tagSeverity(product: Product): 'secondary' | 'warn' | 'danger' {
    if (product.presentInLatestImport === false) return 'secondary';
    if (product.status === 'PHASE_OUT') return 'warn';
    if (product.status === 'DISCONTINUED') return 'danger';
    return 'secondary';
  }
  onDialogKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.mobileSearch) this.closeSearch();
      else this.closePanel();
      return;
    }
    if (event.key !== 'Tab') return;
    const dialog = event.currentTarget as HTMLElement;
    const controls = [
      ...dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled])',
      ),
    ];
    if (!controls.length) return;
    if (event.shiftKey && document.activeElement === controls[0]) {
      event.preventDefault();
      controls.at(-1)?.focus();
    } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
      event.preventDefault();
      controls[0].focus();
    }
  }
}
