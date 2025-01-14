import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { from, Observable } from 'rxjs';

import { TmdbService } from '../../services';
import { StateService } from '../../state/state.service';
import { MovieDetails, TvShowDetails } from 'tmdb-ts';

@Injectable({
  providedIn: 'root',
})
export class MediaDetailsResolver
  implements Resolve<TvShowDetails | MovieDetails>
{
  constructor(private tmdb: TmdbService, private stateService: StateService) {}
  resolve(
    route: ActivatedRouteSnapshot
  ): Observable<TvShowDetails | MovieDetails> {
    this.stateService.setLoading(true);
    const type = route.params['type'];
    const id = route.params['id'];
    if (type === 'tv') {
      return from(this.tmdb.tvShows.details(id));
    }
    return from(this.tmdb.movies.details(id));
  }
}
