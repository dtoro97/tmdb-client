import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { ListService } from '../../core';
import { spinner } from '../helpers/spinner';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Injectable({
  providedIn: 'root',
})
export class ListResolver implements Resolve<any> {
  constructor(
    private listService: ListService,
    private ngxUiLoaderService: NgxUiLoaderService,
  ) {}
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const type = route.params['type'];
    const queryParams = route.queryParams;
    const filters = this.listService.toFilters(queryParams, type);
    this.listService.updateFilters(filters);
    return this.listService
      .fetchData(type, queryParams)
      .pipe(spinner(this.ngxUiLoaderService, 'master'));
  }
}
