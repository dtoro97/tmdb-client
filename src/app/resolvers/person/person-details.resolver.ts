import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { from, Observable } from 'rxjs';
import { TmdbService } from '../../services';
import { StateService } from '../../state/state.service';
import { PersonDetails } from 'tmdb-ts';

@Injectable({
  providedIn: 'root',
})
export class PersonDetailsResolver implements Resolve<PersonDetails> {
  constructor(private tmdb: TmdbService, private stateService: StateService) {}
  resolve(route: ActivatedRouteSnapshot): Observable<PersonDetails> {
    this.stateService.setLoading(true);
    const id = route.params['id'];
    return from(this.tmdb.people.details(id));
  }
}
