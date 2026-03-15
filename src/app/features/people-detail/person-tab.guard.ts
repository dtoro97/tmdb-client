import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

export const personTabGuard = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const id = <string>route.params['personId'];
  const possibleTabs = ['overview', 'credits', 'photos'];
  const tab: string = route.params['tabId'];

  if (!tab || !possibleTabs.includes(tab)) {
    router.navigate(['name', id, 'overview']);
    return false;
  }

  return true;
};
