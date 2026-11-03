import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { primeNgLicenseKey } from '../primeng-license.local';
import { routes } from './app.routes';
const catalogueTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6fc',
      100: '#dbeaf7',
      200: '#bbd6ed',
      300: '#8cbbe0',
      400: '#5799ce',
      500: '#00549f',
      600: '#004a8c',
      700: '#003c73',
      800: '#00345f',
      900: '#002c50',
      950: '#001c35',
    },
  },
});
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    providePrimeNG({
      license: primeNgLicenseKey,
      theme: { preset: catalogueTheme, options: { darkModeSelector: false } },
    }),
  ],
};
