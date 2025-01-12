import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { map, Observable } from 'rxjs';

import { LoaderService, TmdbService } from '../services';

@Injectable({
  providedIn: 'root',
})
export class RecommendationsResolver implements Resolve<any> {
  constructor(
    private tmdbService: TmdbService,
    private loader: LoaderService
  ) {}
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    this.loader.setLoading(true);
    const type = route.params['type'];
    const id = route.params['id'];
    return this.tmdbService
      .getRecommendations(id, type)
      .pipe(map((data) => data.results));
  }
}
