import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { combineLatest } from 'rxjs';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { PersonDetailStore } from './person-store.service';
import { loader } from '../../shared/utils/loader';

export const personResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot,
) => {
  const personDetailStore = inject(PersonDetailStore);
  const ngxUiLoaderService = inject(NgxUiLoaderService);
  const id = route.params['id'];
  return combineLatest([
    personDetailStore.fetchPersonDetails(id),
    personDetailStore.fetchCombinedCredits(id),
    personDetailStore.fetchSocialLinks(id),
    personDetailStore.fetchPersonImages(id),
  ]).pipe(loader(ngxUiLoaderService, 'master'));
};
