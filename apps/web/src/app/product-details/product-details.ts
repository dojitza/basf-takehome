import { HttpClient } from '@angular/common/http';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import {
  criteriaToQueryParams,
  displayStatus,
  initialCriteria,
  parseCriteria,
  statusSeverity,
} from '../criteria';

export type ProductDetail = {
  id: string;
  sku: string;
  name: string | null;
  chemicalName: string | null;
  description: string | null;
  function: string | null;
  applicationArea: string | null;
  region: string | null;
  certifications: string[];
  launchYear: number | null;
  status: string;
  presentInLatestImport: boolean;
};

@Component({
  selector: 'app-product-details',
  imports: [RouterLink, ButtonModule, InputTextModule, TagModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetailsComponent implements AfterViewChecked, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly subscriptions = new Subscription();
  private request?: Subscription;
  private generation = 0;
  private shouldFocusHeading = false;

  @ViewChild('heading') headingElement?: ElementRef<HTMLElement>;

  id = '';
  criteria = initialCriteria();
  hasWarning = false;
  product: ProductDetail | null = null;
  loading = false;
  error = false;
  notFound = false;
  copiedMessage = false;
  copyFailed = false;
  manualLink = '';

  get canShare(): boolean {
    return (
      typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    );
  }

  get criteriaQueryParams() {
    return criteriaToQueryParams(this.criteria);
  }

  get displayStatus(): string {
    if (!this.product) return '';
    return displayStatus(this.product);
  }

  get tagSeverity(): 'secondary' | 'warn' | 'danger' {
    if (!this.product) return 'secondary';
    return statusSeverity(this.product);
  }

  get availabilityExplanation(): string | null {
    if (!this.product) return null;
    if (this.product.presentInLatestImport === false) {
      return 'This product is absent from the latest catalogue import.';
    }
    if (this.product.status === 'UNKNOWN') {
      return 'Product availability is unconfirmed.';
    }
    return null;
  }

  constructor() {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        const newId = params.get('id') || '';
        if (newId !== this.id) {
          this.id = newId;
          this.product = null;
          this.loadProduct();
        }
      }),
    );
    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        const parsed = parseCriteria(params);
        this.criteria = parsed.criteria;
        this.hasWarning = parsed.hasWarning;
        this.changeDetector.markForCheck();
      }),
    );
  }

  ngAfterViewChecked() {
    if (this.shouldFocusHeading && this.headingElement) {
      this.shouldFocusHeading = false;
      this.headingElement.nativeElement.focus();
    }
  }

  ngOnDestroy() {
    this.request?.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  loadProduct() {
    this.generation++;
    const currentGeneration = this.generation;
    this.request?.unsubscribe();
    this.loading = true;
    this.error = false;
    this.notFound = false;
    this.product = null;
    this.copiedMessage = false;
    this.copyFailed = false;
    this.manualLink = '';
    this.changeDetector.markForCheck();

    this.request = this.http
      .get<ProductDetail>(`/api/products/${this.id}`)
      .subscribe({
        next: (data) => {
          if (currentGeneration !== this.generation) return;
          this.product = data;
          this.loading = false;
          this.error = false;
          this.notFound = false;
          this.shouldFocusHeading = true;
          this.changeDetector.markForCheck();
        },
        error: (err) => {
          if (currentGeneration !== this.generation) return;
          this.loading = false;
          if (err?.status === 404) {
            this.notFound = true;
            this.error = false;
            this.shouldFocusHeading = true;
          } else {
            this.error = true;
            this.notFound = false;
          }
          this.changeDetector.markForCheck();
        },
      });
  }

  retry() {
    if (this.loading) return;
    this.loadProduct();
  }

  getAbsoluteUrl(): string {
    const tree = this.router.createUrlTree(['/products', this.id], {
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
    if (this.canShare) {
      navigator
        .share({
          title: this.product?.name || this.product?.sku || 'Product details',
          url: this.getAbsoluteUrl(),
        })
        .catch(() => {});
    }
  }

  copyLink() {
    this.copiedMessage = false;
    this.copyFailed = false;
    this.manualLink = '';
    const url = this.getAbsoluteUrl();

    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      navigator.clipboard.writeText(url).then(
        () => {
          this.copiedMessage = true;
          this.copyFailed = false;
          this.changeDetector.markForCheck();
        },
        () => {
          this.copiedMessage = false;
          this.copyFailed = true;
          this.manualLink = url;
          this.changeDetector.markForCheck();
        },
      );
    } else {
      this.copiedMessage = false;
      this.copyFailed = true;
      this.manualLink = url;
      this.changeDetector.markForCheck();
    }
  }
}
