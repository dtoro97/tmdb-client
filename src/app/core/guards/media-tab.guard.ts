import { get, set } from 'lodash';

import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

export const mediaTabGuard = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const type = <string>route.params['type'];
  const id = <string>route.params['id'];
  const tabs =
    type === 'tv'
      ? ['overview', 'episodes', 'videos', 'photos']
      : ['overview', 'videos', 'photos'];
  const tab: string = route.params['tab'];
  if (!tab || !tabs.includes(tab)) {
    router.navigate(['details', type, id, 'overview']);
    return false;
  }

  return true;
};
