import { Routes } from '@angular/router';
import { CatalogueComponent } from './catalogue/catalogue';
import { ProductDetailsComponent } from './product-details/product-details';

export const routes: Routes = [
  { path: '', component: CatalogueComponent },
  { path: 'products/:id', component: ProductDetailsComponent },
  { path: '**', redirectTo: '' },
];
