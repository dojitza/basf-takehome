import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { appConfig } from './app.config';
it('renders the Angular shell and a disabled PrimeNG control', async () => {
  await TestBed.configureTestingModule({
    imports: [App],
    providers: appConfig.providers,
  }).compileComponents();
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  expect(root.querySelector('h1')?.textContent).toBe('Product Finder');
  expect(root.querySelector('p-button button')?.hasAttribute('disabled')).toBe(
    true,
  );
  fixture.destroy();
});
