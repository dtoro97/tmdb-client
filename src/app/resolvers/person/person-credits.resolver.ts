import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { from, Observable } from 'rxjs';

import { TmdbService } from '../../services';
import { StateService } from '../../state/state.service';
import { PersonCombinedCredits } from 'tmdb-ts';

@Injectable({
  providedIn: 'root',
})
export class PersonCreditsResolver implements Resolve<PersonCombinedCredits> {
  constructor(private tmdb: TmdbService, private stateService: StateService) {}
  resolve(route: ActivatedRouteSnapshot): Observable<PersonCombinedCredits> {
    this.stateService.setLoading(true);
    const id = route.params['id'];
    return from(this.tmdb.people.combinedCredits(id));
  }
}
