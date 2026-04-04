import {
    provideHttpClient,
    withFetch,
    withInterceptors,
} from '@angular/common/http';
import {
    ApplicationConfig,
    inject,
    provideAppInitializer,
    provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
    provideRouter,
    withComponentInputBinding,
    withInMemoryScrolling,
} from '@angular/router';

import { routes } from './app.routes';
import { provideApi } from './api/provide-api';
import { Configuration as V4Configuration } from './api-v4/configuration';
import { environment } from '../environments/environment';
import {
    provideClientHydration,
    withEventReplay,
} from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { UserSessionStoreService } from './shared';
import { TmdbUserAuthService } from './shared/services/tmdb-user-auth.service';
import { delayInterceptor } from './shared/utils/delay-interceptor';
import { localeInterceptor } from './shared/utils/locale-interceptor';

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
        provideHttpClient(
            withFetch(),
            withInterceptors([localeInterceptor, delayInterceptor]),
        ),
        provideApi({
            basePath: 'https://api.themoviedb.org/3',
            credentials: {
                bearerAuth: environment.apiKey,
            },
        }),
        {
            provide: V4Configuration,
            useFactory: () => {
                const userSessionStore = inject(UserSessionStoreService);

                return new V4Configuration({
                    basePath: 'https://api.themoviedb.org/4',
                    credentials: {
                        bearerAuth: () =>
                            userSessionStore.v4AccessToken() ??
                            environment.apiKey,
                    },
                });
            },
        },
        provideAppInitializer(() =>
            firstValueFrom(inject(TmdbUserAuthService).tryCompleteLoginFromUrl$()),
        ),
        provideClientHydration(withEventReplay()),
        //provideServerRendering(withRoutes(serverRoutes)),
    ],
};
