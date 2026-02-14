import { combineLatest, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { MediaService } from '../../core';
import { spinner } from '../helpers/spinner';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Injectable({
  providedIn: 'root',
})
export class MediaResolver implements Resolve<any> {
  constructor(
    private mediaService: MediaService,
    private ngxUiLoaderService: NgxUiLoaderService,
  ) {}
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const id = route.params['id'];
    const type = route.params['type'];
    this.mediaService.updateSeasons([]);
    return combineLatest([
      this.mediaService.fetchMediaDetails(id, type),
      this.mediaService.fetchCredits(id, type),
      this.mediaService.fetchVideos(id, type),
      this.mediaService.fetchRecommendations(id, type),
      this.mediaService.fetchSocialLinks(id, type),
      this.mediaService.fetchImages(id, type),
    ]).pipe(spinner(this.ngxUiLoaderService, 'master'));
  }
}
