import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

export const personTabGuard = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const id = <string>route.params['id'];
  const possibleTabs = ['overview', 'credits', 'photos'];
  const tab: string = route.params['tab'];

  if (!tab || !possibleTabs.includes(tab)) {
    router.navigate(['details', 'person', id, 'overview']);
    return false;
  }

  return true;
};
