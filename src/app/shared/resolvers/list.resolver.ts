import { combineLatest, Observable, tap } from 'rxjs';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { ListService, MediaService, StateService } from '../../core';

@Injectable({
  providedIn: 'root',
})
export class ListResolver implements Resolve<any> {
  constructor(
    private listService: ListService,
    private stateService: StateService
  ) {}
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const type = route.params['type'];

    this.stateService.setLoading(true);
    const queryParams = route.queryParams;
    const filters = this.listService.toFilters(queryParams, type);
    this.listService.updateFilters(filters);
    return this.listService.fetchData(type, queryParams);
  }
}
