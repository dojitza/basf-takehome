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
  availabilityExplanation,
  criteriaToQueryParams,
  displayStatus,
  initialCriteria,
  parseCriteria,
  statusSeverity,
} from '../criteria';
import { ShareController } from '../sharing';

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
  private readonly shareController = new ShareController();
  private request?: Subscription;
  private generation = 0;
  private shouldFocusHeading = false;

  @ViewChild('heading') headingElement?: ElementRef<HTMLElement>;
  @ViewChild('copyLinkButton') copyLinkButton?: ElementRef<HTMLButtonElement>;

  id = '';
  criteria = initialCriteria();
  hasWarning = false;
  product: ProductDetail | null = null;
  loading = false;
  error = false;
  notFound = false;

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

  get backState(): { fromDetail: boolean; warning?: boolean } {
    return this.hasWarning
      ? { fromDetail: true, warning: true }
      : { fromDetail: true };
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
    return availabilityExplanation(this.product);
  }

  constructor() {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        const newId = params.get('id') || '';
        if (newId !== this.id || !newId) {
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
        this.shareController.reset();
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
    this.shareController.destroy();
  }

  loadProduct() {
    this.generation++;
    const currentGeneration = this.generation;
    this.request?.unsubscribe();
    this.loading = true;
    this.error = false;
    this.notFound = false;
    this.product = null;
    this.shareController.reset();
    this.changeDetector.markForCheck();

    if (!this.id) {
      this.loading = false;
      this.error = false;
      this.notFound = true;
      this.shouldFocusHeading = true;
      this.changeDetector.markForCheck();
      return;
    }

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
            this.shouldFocusHeading = true;
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
    const tree = this.router.createUrlTree(
      ['/products', this.product?.id || this.id],
      {
        queryParams: criteriaToQueryParams(this.criteria),
      },
    );
    const relative = this.router.serializeUrl(tree);
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost';
    return new URL(relative, origin).toString();
  }

  share() {
    this.shareController.share(
      this.getAbsoluteUrl(),
      this.product?.name || this.product?.sku || 'Product details',
    );
  }

  copyLink() {
    this.shareController.copy(this.getAbsoluteUrl(), () =>
      this.changeDetector.markForCheck(),
    );
  }

  dismissManualCopy() {
    this.shareController.dismissFallback();
    this.changeDetector.markForCheck();
    this.copyLinkButton?.nativeElement.focus();
  }

  dismissCopiedMessage() {
    this.shareController.dismissSuccess();
    this.changeDetector.markForCheck();
    this.copyLinkButton?.nativeElement.focus();
  }
}
