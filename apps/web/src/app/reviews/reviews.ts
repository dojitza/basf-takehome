import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';

type Review = {
  id: string;
  rating: number;
  reviewerName: string | null;
  comment: string | null;
  createdAt: string;
};
type Page = {
  items: Review[];
  nextCursor: string | null;
  summary: { count: number; average: number | null };
};
@Component({
  selector: 'app-reviews',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './reviews.html',
  styleUrl: './reviews.scss',
})
export class ReviewsComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewChecked
{
  @Input({ required: true }) productId = '';
  @Input() productName = '';
  @ViewChild('trigger') trigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('dialog') dialog?: ElementRef<HTMLElement>;
  @ViewChild('confirmation') confirmation?: ElementRef<HTMLElement>;
  @ViewChild('sentinel') sentinel?: ElementRef<HTMLElement>;
  private http = inject(HttpClient);
  private cd = inject(ChangeDetectorRef);
  private readRequest?: Subscription;
  private submitRequest?: Subscription;
  private observer?: IntersectionObserver;
  private observed?: HTMLElement;
  private focusTarget: 'dialog' | 'confirmation' | null = null;
  private previousPayload = '';
  private submissionId = '';
  private loadedProductId = '';
  private readGeneration = 0;
  private submitGeneration = 0;
  items: Review[] = [];
  summary: Page['summary'] | null = null;
  cursor: string | null = null;
  loading = false;
  error = false;
  open = false;
  confirming = false;
  submitting = false;
  rating = 0;
  name = '';
  comment = '';
  ratingError = false;
  submitError = false;
  success = false;
  readonly stars = [1, 2, 3, 4, 5];
  get roundedAverage() {
    return Math.round(this.summary?.average ?? 0);
  }
  ngOnInit() {
    if (this.productId && this.loadedProductId !== this.productId) {
      this.resetAndLoad();
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    if (
      'productId' in changes &&
      this.productId &&
      this.loadedProductId !== this.productId
    ) {
      this.resetAndLoad();
    }
  }
  ngOnDestroy() {
    this.readGeneration++;
    this.submitGeneration++;
    this.readRequest?.unsubscribe();
    this.submitRequest?.unsubscribe();
    this.observer?.disconnect();
  }
  private resetAndLoad() {
    this.loadedProductId = this.productId;
    this.readGeneration++;
    this.submitGeneration++;
    this.readRequest?.unsubscribe();
    this.submitRequest?.unsubscribe();
    this.items = [];
    this.summary = null;
    this.cursor = null;
    this.loading = false;
    this.error = false;
    this.open = false;
    this.confirming = false;
    this.submitting = false;
    this.rating = 0;
    this.name = '';
    this.comment = '';
    this.ratingError = false;
    this.submitError = false;
    this.success = false;
    this.previousPayload = '';
    this.submissionId = '';
    this.load(true);
  }
  ngAfterViewChecked() {
    const focus =
      this.focusTarget === 'confirmation' ? this.confirmation : this.dialog;
    if (this.focusTarget && focus) {
      this.focusTarget = null;
      focus.nativeElement
        .querySelector<HTMLElement>('button, input, textarea')
        ?.focus();
    }
    const element = this.sentinel?.nativeElement;
    if (element !== this.observed) {
      this.observer?.disconnect();
      this.observed = element;
      if (element && typeof IntersectionObserver !== 'undefined') {
        this.observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting) && !this.error)
              this.load(false);
          },
          { rootMargin: '100px' },
        );
        this.observer.observe(element);
      }
    }
  }
  load(first: boolean) {
    if (this.loading || (!first && !this.cursor)) return;
    const generation = ++this.readGeneration;
    this.readRequest?.unsubscribe();
    this.loading = true;
    this.error = false;
    const params =
      !first && this.cursor
        ? new HttpParams().set('cursor', this.cursor)
        : undefined;
    this.readRequest = this.http
      .get<Page>(`/api/products/${this.productId}/reviews`, { params })
      .subscribe({
        next: (page) => {
          if (generation !== this.readGeneration) return;
          this.items = first ? page.items : [...this.items, ...page.items];
          this.summary = page.summary;
          this.cursor = page.nextCursor;
          this.loading = false;
          this.cd.markForCheck();
        },
        error: () => {
          if (generation !== this.readGeneration) return;
          this.loading = false;
          this.error = true;
          this.cd.markForCheck();
        },
      });
  }
  retry() {
    this.load(this.summary === null);
  }
  dismissSuccess() {
    this.success = false;
    this.trigger?.nativeElement.focus();
  }
  show() {
    this.success = false;
    this.open = true;
    this.focusTarget = 'dialog';
  }
  onBackdropClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (
      target === event.currentTarget ||
      target?.classList.contains('confirmation-overlay')
    ) {
      this.close();
    }
  }
  close() {
    if (this.submitting) return;
    if (this.confirming) {
      this.confirming = false;
      this.focusTarget = 'dialog';
      return;
    }
    if (this.rating || this.name.trim() || this.comment.trim()) {
      this.confirming = true;
      this.focusTarget = 'confirmation';
    } else this.discard();
  }
  focusTargetForForm() {
    this.focusTarget = 'dialog';
  }
  discard() {
    this.open = false;
    this.confirming = false;
    this.rating = 0;
    this.name = '';
    this.comment = '';
    this.ratingError = false;
    this.submitError = false;
    this.previousPayload = '';
    this.submissionId = '';
    this.trigger?.nativeElement.focus();
  }
  setRating(value: number) {
    this.rating = value;
    this.ratingError = false;
  }
  submit() {
    if (this.submitting) return;
    if (!this.rating) {
      this.ratingError = true;
      return;
    }
    const data = {
      rating: this.rating,
      reviewerName: this.name.trim() || null,
      comment: this.comment.trim() || null,
    };
    const fingerprint = JSON.stringify(data);
    if (fingerprint !== this.previousPayload) {
      this.submissionId = crypto.randomUUID();
      this.previousPayload = fingerprint;
    }
    const generation = ++this.submitGeneration;
    this.submitting = true;
    this.submitError = false;
    // Disable the controls before sending so a fast interaction cannot edit
    // a draft while its previous values are already in flight.
    this.cd.detectChanges();
    this.submitRequest?.unsubscribe();
    this.submitRequest = this.http
      .post(`/api/products/${this.productId}/reviews`, {
        submissionId: this.submissionId,
        ...data,
      })
      .subscribe({
        next: () => {
          if (generation !== this.submitGeneration) return;
          this.submitting = false;
          this.discard();
          this.success = true;
          this.readRequest?.unsubscribe();
          this.loading = false;
          this.summary = null;
          this.cursor = null;
          this.items = [];
          this.load(true);
          this.cd.markForCheck();
        },
        error: () => {
          if (generation !== this.submitGeneration) return;
          this.submitting = false;
          this.submitError = true;
          this.cd.markForCheck();
        },
      });
  }
  keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;
    const container = this.confirming
      ? this.confirmation?.nativeElement
      : this.dialog?.nativeElement;
    const controls = Array.from(
      container?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled])',
      ) ?? [],
    );
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (!active || active === container || !container?.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
