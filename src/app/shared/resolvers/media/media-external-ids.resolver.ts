import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { from, Observable } from 'rxjs';

import { TmdbService } from '../../services';
import { ExternalIds } from 'tmdb-ts';
import { StateService } from '../../../core';

@Injectable({
  providedIn: 'root',
})
export class MediaExternalIdsResolver implements Resolve<ExternalIds> {
  constructor(private tmdb: TmdbService, private stateService: StateService) {}
  resolve(route: ActivatedRouteSnapshot): Observable<ExternalIds> {
    this.stateService.setLoading(true);
    const type = route.params['type'];
    const id = route.params['id'];
    if (type === 'tv') {
      return from(this.tmdb.tvShows.externalIds(id));
    }
    return from(this.tmdb.movies.externalIds(id));
  }
}
