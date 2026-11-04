import { HttpClient, HttpParams } from '@angular/common/http';
import { Location } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import {
  ALLOWED_STATUSES,
  criteriaToQueryParams,
  displayStatus,
  initialCriteria,
  parseCriteria,
  statusLabel,
  statusSeverity,
} from '../criteria';
import { ShareController } from '../sharing';

type Product = {
  id: string;
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

@Component({
  selector: 'app-catalogue',
  imports: [FormsModule, RouterLink, ButtonModule, InputTextModule, TagModule],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.scss',
})
export class CatalogueComponent implements AfterViewChecked, OnDestroy {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly location = inject(Location);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly subscriptions = new Subscription();
  private readonly shareController = new ShareController();
  private request?: Subscription;
  private observer?: IntersectionObserver;
  private lastTrigger?: HTMLElement;
  private generation = 0;
  private shouldFocusHeading = false;

  @ViewChild('heading') headingElement?: ElementRef<HTMLElement>;

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

  criteria = initialCriteria();
  draft = initialCriteria();
  searchInput = '';
  mobileSearch = false;
  panel: 'filter' | 'sort' | null = null;
  products: Product[] = [];
  areas: string[] = [];
  readonly statuses = ALLOWED_STATUSES;
  total = 0;
  nextOffset: number | null = null;
  loading = false;
  error = false;
  warning = false;
  private loadedKey = '';
  private searchBlurGeneration = 0;

  get canShare(): boolean {
    return this.shareController.canShare;
  }

  get copiedMessage(): boolean {
    return this.shareController.copiedMessage;
  }

  get copyFailed(): boolean {
    return this.shareController.copyFailed;
  }

  get manualLink(): string {
    return this.shareController.manualLink;
  }

  get criteriaQueryParams() {
    return criteriaToQueryParams(this.criteria);
  }

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const prevUrl = nav?.previousNavigation?.finalUrl?.toString();
    const fromDetailNav =
      prevUrl?.startsWith('/products') || prevUrl?.includes('/products');
    const locationState = this.location.getState() as
      { warning?: boolean; fromDetail?: boolean } | undefined;
    if (locationState?.fromDetail || fromDetailNav) {
      this.shouldFocusHeading = true;
    }

    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        const parsed = parseCriteria(params);
        const state = this.location.getState() as
          { warning?: boolean; fromDetail?: boolean } | undefined;
        const transientWarning = Boolean(state?.warning);
        this.warning = parsed.hasWarning || transientWarning;
        if (transientWarning) {
          const path = this.location.path();
          const cleanState = { ...(state || {}) };
          delete cleanState.warning;
          this.location.replaceState(path, '', cleanState);
        }
        this.criteria = parsed.criteria;
        this.searchInput = this.criteria.search;
        this.shareController.reset();
        this.refreshIfChanged();
        this.changeDetector.markForCheck();
      }),
    );
  }

  ngAfterViewChecked() {
    if (this.shouldFocusHeading && this.headingElement && !this.loading) {
      this.shouldFocusHeading = false;
      this.headingElement.nativeElement.focus();
    }
  }

  ngOnDestroy() {
    this.request?.unsubscribe();
    this.searchBlurGeneration++;
    this.subscriptions.unsubscribe();
    this.shareController.destroy();
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
          void this.router
            .navigate([], {
              queryParams: {
                applicationArea: this.criteria.applicationArea.length
                  ? this.criteria.applicationArea
                  : null,
              },
              queryParamsHandling: 'merge',
              replaceUrl: true,
            })
            .then(() => {
              this.warning = true;
              this.changeDetector.markForCheck();
            });
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

  scheduleSearchCommit() {
    this.searchBlurGeneration++;
    const generation = this.searchBlurGeneration;
    void Promise.resolve().then(() => {
      if (generation === this.searchBlurGeneration) this.commitSearch();
    });
  }

  commitSearch() {
    this.searchBlurGeneration++;
    this.criteria = { ...this.criteria, search: this.searchInput.trim() };
    this.searchInput = this.criteria.search;
    const wasMobile = this.mobileSearch;
    this.mobileSearch = false;
    if (wasMobile) this.lastTrigger?.focus();
    this.shareController.reset();
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
    this.searchBlurGeneration++;
    this.searchInput = '';
    this.shareController.reset();
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
    this.shareController.reset();
    this.refreshIfChanged();
    this.navigate();
  }

  clearSort() {
    this.criteria = { ...this.criteria, sort: 'name' };
    this.shareController.reset();
    this.refreshIfChanged();
    this.navigate();
  }

  private navigate() {
    void this.router.navigate([], {
      queryParams: criteriaToQueryParams(this.criteria),
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
    this.shareController.reset();
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
    this.shareController.reset();
    this.refreshIfChanged();
    this.navigate();
  }

  statusLabel(status: string) {
    return statusLabel(status);
  }

  displayStatus(product: Product) {
    return displayStatus(product);
  }

  tagSeverity(product: Product) {
    return statusSeverity(product);
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

  getAbsoluteUrl(): string {
    const tree = this.router.createUrlTree(['/'], {
      queryParams: criteriaToQueryParams(this.criteria),
    });
    const relative = this.router.serializeUrl(tree);
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost';
    return new URL(relative, origin).toString();
  }

  share() {
    this.shareController.share(this.getAbsoluteUrl(), 'BASF Product Finder');
  }

  copyLink() {
    this.shareController.copy(this.getAbsoluteUrl(), () =>
      this.changeDetector.markForCheck(),
    );
  }

  dismissManualCopy() {
    this.shareController.dismissFallback();
    this.changeDetector.markForCheck();
  }

  dismissCopiedMessage() {
    this.shareController.dismissSuccess();
    this.changeDetector.markForCheck();
  }
}
