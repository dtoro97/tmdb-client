import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { get, set } from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class MediaListGuard implements CanActivate {
  private previousType: string;
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const type = route.params['type'];
    const queryParams = route.queryParams;
    const defaultParams = {
      sort_by: 'popularity.desc',
      page: 1,
    };
    const newParams = { ...queryParams };

    if (this.previousType && this.previousType !== type) {
      this.previousType = type;
      this.router.navigate([`/list/${type}`], {
        queryParams: defaultParams,
      });
      return false;
    }
    this.previousType = type;

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
      this.router.navigate([`/list/${type}`], {
        queryParams: newParams,
      });
      return false;
    }
    return true;
  }
}
