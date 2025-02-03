import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { from, Observable } from 'rxjs';

import { TmdbService } from '../../services';
import { Images } from 'tmdb-ts';
import { StateService } from '../../../core';

@Injectable({
  providedIn: 'root',
})
export class MediaImagesResolver implements Resolve<Images> {
  constructor(private tmdb: TmdbService, private stateService: StateService) {}
  resolve(route: ActivatedRouteSnapshot): Observable<Images> {
    this.stateService.setLoading(true);
    const type = route.params['type'] || 'person';
    const id = route.params['id'];
    if (type === 'tv') {
      return from(this.tmdb.tvShows.images(id));
    }
    return from(this.tmdb.movies.images(id));
  }
}
