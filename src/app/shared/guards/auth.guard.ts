import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserSessionStoreService } from '../services/user-session-store.service';

export const authenticatedGuard: CanActivateFn = () => {
    const userSessionStore = inject(UserSessionStoreService);
    const router = inject(Router);

    if (userSessionStore.mode() === 'user') {
        return true;
    }

    return router.createUrlTree(['/']);
};
