import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { combineLatest } from 'rxjs';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { MediaStoreService } from './media-store.service';
import { loader } from '../../shared/utils/loader';

export const mediaResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot) => {
  const mediaStoreService = inject(MediaStoreService);
  const ngxUiLoaderService = inject(NgxUiLoaderService);
  const id = route.params['id'];
  const type = route.params['type'];
  mediaStoreService.updateSeasons([]);
  return combineLatest([
    mediaStoreService.fetchMediaDetails(id, type),
    mediaStoreService.fetchCredits(id, type),
    mediaStoreService.fetchVideos(id, type),
    mediaStoreService.fetchRecommendations(id, type),
    mediaStoreService.fetchSocialLinks(id, type),
    mediaStoreService.fetchImages(id, type),
  ]).pipe(loader(ngxUiLoaderService, 'master'));
};
