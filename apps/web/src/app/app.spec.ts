import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { appConfig } from './app.config';
it('renders the product catalogue shell', async () => {
  await TestBed.configureTestingModule({
    imports: [App],
    providers: appConfig.providers,
  }).compileComponents();
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  expect(root.querySelector('header')?.textContent).toContain('Product Finder');
  expect(root.querySelector('h1')?.textContent).toBe('Products');
  fixture.destroy();
});
