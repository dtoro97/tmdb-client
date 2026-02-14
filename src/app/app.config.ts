import { providePrimeNG } from 'primeng/config';

import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { NgxUiLoaderModule } from 'ngx-ui-loader';

import { routes } from './app.routes';
import { MATERIAL } from './constants';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: MATERIAL,
        options: {
          darkModeSelector: '.dark',
        },
      },
    }),
    provideHttpClient(),
  ],
};
