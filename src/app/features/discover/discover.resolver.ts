import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { DiscoverStoreService } from './discover-store.service';
import { loader } from '../../shared/utils/loader';

export const discoverResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot) => {
  const discoverStore = inject(DiscoverStoreService);
  const ngxUiLoaderService = inject(NgxUiLoaderService);
  const type = route.params['type'];
  const queryParams = route.queryParams;
  const filters = discoverStore.toFilters(queryParams, type);
  discoverStore.updateFilters(filters);
  return discoverStore
    .fetchData(type, queryParams)
    .pipe(loader(ngxUiLoaderService, 'master'));
};
