import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';

import { LoaderService, TmdbService } from '../services';

@Injectable({
  providedIn: 'root',
})
export class PersonExternalIdResolver implements Resolve<any> {
  constructor(
    private tmdbService: TmdbService,
    private loader: LoaderService
  ) {}
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const id = route.params['id'];
    return this.tmdbService.getExternalIds('person', id);
  }
}
