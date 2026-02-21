import { providePrimeNG } from 'primeng/config';

import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { provideApi } from './api/provide-api';
import { routes } from './app.routes';
import { MATERIAL } from './constants';
import { environment } from '../environments/environment';

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
    provideApi({
      basePath: 'https://api.themoviedb.org',
      credentials: {
        sec0: `Bearer ${environment.apiKey}`,
      },
    }),
  ],
};
