import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (
          typeof window !== 'undefined' &&
          typeof window.scrollTo === 'function' &&
          !navigator.userAgent.includes('jsdom')
        ) {
          try {
            window.scrollTo(0, 0);
          } catch {
            // JSDOM or restricted browser environment
          }
        }
      });
    if (!this.router.navigated) {
      this.router.initialNavigation();
    }
  }
}
