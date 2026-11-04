import { Component, inject } from '@angular/core';
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

  constructor() {
    if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
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
    this.router.initialNavigation();
  }
}
