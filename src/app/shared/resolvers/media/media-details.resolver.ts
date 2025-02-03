import { catchError, from, Observable, throwError } from 'rxjs';
import { MovieDetails, TvShowDetails } from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';

import { TmdbService } from '../../services';
import { StateService } from '../../../core';

@Injectable({
  providedIn: 'root',
})
export class MediaDetailsResolver
  implements Resolve<TvShowDetails | MovieDetails>
{
  constructor(
    private tmdb: TmdbService,
    private stateService: StateService,
    private router: Router
  ) {}
  resolve(
    route: ActivatedRouteSnapshot
  ): Observable<TvShowDetails | MovieDetails> {
    this.stateService.setLoading(true);
    const type = route.params['type'];
    const id = route.params['id'];
    if (type === 'tv') {
      return from(this.tmdb.tvShows.details(id)).pipe(
        catchError((e) => {
          this.router.navigateByUrl('not-found');
          return throwError(e);
        })
      );
    }
    return from(this.tmdb.movies.details(id)).pipe(
      catchError((e) => {
        this.router.navigateByUrl('not-found');
        return throwError(e);
      })
    );
  }
}
