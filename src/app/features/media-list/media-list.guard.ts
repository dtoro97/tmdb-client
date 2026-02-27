import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

export const mediaListGuard = (route: ActivatedRouteSnapshot) => {
    const router = inject(Router);
    const queryParams = route.queryParams;
    const defaultParams = {
        sortBy: 'popularity.desc',
        page: 1,
    };
    const newParams = { ...queryParams };

    let changed = false;

    if (!queryParams['page']) {
        newParams['page'] = defaultParams.page;
        changed = true;
    }
    if (!queryParams['sortBy']) {
        newParams['sortBy'] = defaultParams.sortBy;
        changed = true;
    }

    if (changed) {
        router.navigate(['discover'], {
            queryParams: newParams,
        });
        return false;
    }
    return true;
};
