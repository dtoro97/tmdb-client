import { from, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { TmdbService } from '../../services';
import { ExternalIds } from 'tmdb-ts';
import { StateService } from '../../../core';

@Injectable({
  providedIn: 'root',
})
export class PersonExternalIdsResolver implements Resolve<ExternalIds> {
  constructor(private tmdb: TmdbService, private stateService: StateService) {}
  resolve(route: ActivatedRouteSnapshot): Observable<ExternalIds> {
    this.stateService.setLoading(true);
    const id = route.params['id'];
    return from(this.tmdb.people.externalId(id));
  }
}
