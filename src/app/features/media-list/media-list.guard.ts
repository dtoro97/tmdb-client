import { get, set } from 'lodash';

import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

export const mediaListGuard = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const queryParams = route.queryParams;
  const type = queryParams['type'];
  const defaultParams = {
    sort_by: 'popularity.desc',
    page: 1,
  };
  const newParams = { ...queryParams };

  /* if (this.previousType && this.previousType !== type) {
    this.previousType = type;
    router.navigate([`/list/${type}`], {
      queryParams: defaultParams,
    });
    return false;
  }
  this.previousType = type; */

  let changed = false;

  if (!get(queryParams, 'page')) {
    set(newParams, 'page', defaultParams.page);
    changed = true;
  }
  if (!get(queryParams, 'sort_by')) {
    set(newParams, 'sort_by', defaultParams.sort_by);
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
