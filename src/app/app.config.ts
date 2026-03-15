import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
    provideRouter,
    withComponentInputBinding,
    withInMemoryScrolling,
} from '@angular/router';

import { routes } from './app.routes';
import { provideApi } from './api/provide-api';
import { environment } from '../environments/environment';
import {
    provideClientHydration,
    withEventReplay,
} from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(
            routes,
            withComponentInputBinding(),
            withInMemoryScrolling({
                scrollPositionRestoration: 'top',
            }),
        ),
        provideAnimationsAsync(),
        provideHttpClient(withFetch()),
        provideApi({
            basePath: 'https://api.themoviedb.org/3',
            credentials: {
                bearerAuth: environment.apiKey,
            },
        }),
        provideClientHydration(withEventReplay()),
        //provideServerRendering(withRoutes(serverRoutes)),
    ],
};
