import { bootstrapApplication } from '@angular/platform-browser';
import { createAppConfig } from './app/app.config';
import { App } from './app/app';
import { primeNgLicenseKey } from './primeng-license.local';

async function bootstrap() {
  let license = primeNgLicenseKey;
  try {
    const response = await fetch('/api/public-config', {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const config: unknown = await response.json();
      if (
        typeof config === 'object' &&
        config !== null &&
        'primeNgLicenseKey' in config &&
        typeof config.primeNgLicenseKey === 'string' &&
        config.primeNgLicenseKey
      ) {
        license = config.primeNgLicenseKey;
      }
    }
  } catch {
    // Keep the locally configured key when the API is unavailable.
  }
  await bootstrapApplication(App, createAppConfig(license));
}

bootstrap().catch((err) => console.error(err));
