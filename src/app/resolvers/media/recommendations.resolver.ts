import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { from, map, Observable } from 'rxjs';

import { TmdbService } from '../../services';
import { StateService } from '../../state/state.service';
import { Recommendation } from 'tmdb-ts';

@Injectable({
  providedIn: 'root',
})
export class RecommendationsResolver implements Resolve<Recommendation[]> {
  constructor(private tmdb: TmdbService, private stateService: StateService) {}
  resolve(route: ActivatedRouteSnapshot): Observable<Recommendation[]> {
    this.stateService.setLoading(true);
    const type = route.params['type'];
    const id = route.params['id'];
    if (type === 'tv') {
      return from(this.tmdb.tvShows.recommendations(id)).pipe(
        map((data) => data.results)
      );
    }
    return from(this.tmdb.movies.recommendations(id)).pipe(
      map((data) => data.results)
    );
  }
}
