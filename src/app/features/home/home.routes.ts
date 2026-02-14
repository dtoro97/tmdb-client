import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { HomeStoreService } from './home-store.service';
import { HomePageComponent } from './home-page/home-page.component';
import { loader } from '../../shared/utils/loader';

const homeResolver: ResolveFn<any> = () => {
  const homeStore = inject(HomeStoreService);
  const ngxUiLoaderService = inject(NgxUiLoaderService);
  return homeStore.init().pipe(loader(ngxUiLoaderService, 'master'));
};

export const HOME_ROUTES: Routes = [
  {
    path: '',
    component: HomePageComponent,
    resolve: { data: homeResolver },
    title: 'Browse Movies, TV Shows and People',
  },
];
