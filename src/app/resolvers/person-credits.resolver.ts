import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { LoaderService, TmdbService } from '../services';

@Injectable({
  providedIn: 'root',
})
export class PersonCreditsResolver implements Resolve<any> {
  constructor(
    private tmdbService: TmdbService,
    private loader: LoaderService
  ) {}
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    this.loader.setLoading(true);
    const id = route.params['id'];
    return this.tmdbService
      .getCreditsForPerson(id)
      .pipe(tap(() => this.loader.setLoading(false)));
  }
}
