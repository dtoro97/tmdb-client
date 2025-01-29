import { catchError, from, Observable, throwError } from 'rxjs';
import { PersonDetails } from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';

import { TmdbService } from '../../services';
import { StateService } from '../../state/state.service';

@Injectable({
  providedIn: 'root',
})
export class PersonDetailsResolver implements Resolve<PersonDetails> {
  constructor(
    private tmdb: TmdbService,
    private stateService: StateService,
    private router: Router
  ) {}
  resolve(route: ActivatedRouteSnapshot): Observable<PersonDetails> {
    this.stateService.setLoading(true);
    const id = route.params['id'];
    return from(this.tmdb.people.details(id)).pipe(
      catchError((e) => {
        this.router.navigate(['/not-found']);
        return throwError(e);
      })
    );
  }
}
