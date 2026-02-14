import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

export const discoverGuard = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const type = route.params['type'];
  const queryParams = route.queryParams;
  const defaultParams = {
    sort_by: 'popularity.desc',
    page: 1,
  };
  const newParams = { ...queryParams };

  let changed = false;

  if (!queryParams['page']) {
    newParams['page'] = defaultParams.page;
    changed = true;
  }
  if (!queryParams['sort_by']) {
    newParams['sort_by'] = defaultParams.sort_by;
    changed = true;
  }

  if (changed) {
    router.navigate(['discover', type], {
      queryParams: newParams,
    });
    return false;
  }
  return true;
};
