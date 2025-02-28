import { combineLatest, Observable, tap } from 'rxjs';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { MediaService, StateService } from '../../core';

@Injectable({
  providedIn: 'root',
})
export class MediaResolver implements Resolve<any> {
  constructor(
    private mediaService: MediaService,
    private stateService: StateService
  ) {}
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const id = route.params['id'];
    const type = route.params['type'];
    this.mediaService.updateSeasons([]);
    this.stateService.setLoading(true);
    return combineLatest([
      this.mediaService.fetchMediaDetails(id, type),
      this.mediaService.fetchCredits(id, type),
      this.mediaService.fetchVideos(id, type),
      this.mediaService.fetchRecommendations(id, type),
      this.mediaService.fetchSocialLinks(id, type),
      this.mediaService.fetchImages(id, type),
    ]).pipe(tap(() => this.stateService.setLoading(false)));
  }
}
