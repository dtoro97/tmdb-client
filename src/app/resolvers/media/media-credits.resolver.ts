import { from, Observable } from 'rxjs';
import { Credits } from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { TmdbService } from '../../services';
import { StateService } from '../../state/state.service';

@Injectable({
  providedIn: 'root',
})
export class MediaCreditsResolver implements Resolve<Credits> {
  constructor(private tmdb: TmdbService, private stateService: StateService) {}
  resolve(route: ActivatedRouteSnapshot): Observable<Credits> {
    this.stateService.setLoading(true);
    const type = route.params['type'];
    const id = route.params['id'];
    if (type === 'tv') {
      return from(this.tmdb.tvShows.credits(id));
    }
    return from(this.tmdb.movies.credits(id));
  }
}
