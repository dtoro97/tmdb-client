import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { PeopleListStoreService } from './people-store.service';
import { loader } from '../../shared/utils/loader';

export const peopleListResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot) => {
  const peopleStore = inject(PeopleListStoreService);
  const ngxUiLoaderService = inject(NgxUiLoaderService);
  const queryParams = route.queryParams;
  const page = queryParams['page'] || 1;
  peopleStore.updatePage(Number(page));
  return peopleStore
    .fetchPopularPeople(queryParams)
    .pipe(loader(ngxUiLoaderService, 'master'));
};
