import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { catchError, map, of } from 'rxjs';

import { TmdbUserAccountService } from '../services/tmdb-user-account.service';
import { UserSessionStoreService } from '../services/user-session-store.service';

export const authenticatedGuard: CanActivateFn = () => {
    const userSessionStore = inject(UserSessionStoreService);
    const router = inject(Router);

    if (userSessionStore.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(['/']);
};

export const accountGuard: CanActivateFn = () => {
    const tmdbUserAccountService = inject(TmdbUserAccountService);
    const router = inject(Router);

    return tmdbUserAccountService.ensureAccount$().pipe(
        map(() => true),
        catchError(() => of(router.createUrlTree(['/']))),
    );
};

export const v4AccountAccessGuard: CanActivateFn = () => {
    const userSessionStore = inject(UserSessionStoreService);
    const router = inject(Router);

    if (userSessionStore.hasV4AccountAccess()) {
        return true;
    }

    return router.createUrlTree(['/']);
};
