import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { TmdbService } from '../../services';
import { Video } from 'tmdb-ts';
import { StateService } from '../../../core';

@Injectable({
  providedIn: 'root',
})
export class VideosResolver implements Resolve<Video[]> {
  constructor(private tmdb: TmdbService, private stateService: StateService) {}
  resolve(route: ActivatedRouteSnapshot): Observable<Video[]> {
    this.stateService.setLoading(true);
    const type = route.params['type'];
    const id = route.params['id'];
    if (type === 'movie') {
      return from(this.tmdb.movies.videos(id)).pipe(
        map((data) => data.results)
      );
    }
    return from(this.tmdb.tvShows.videos(id)).pipe(map((data) => data.results));
  }
}
