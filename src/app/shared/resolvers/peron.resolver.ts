import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { combineLatest, Observable, tap } from 'rxjs';
import { PersonService, StateService } from '../../core';

@Injectable({
  providedIn: 'root',
})
export class PersonResolver implements Resolve<any> {
  constructor(
    private personService: PersonService,
    private stateService: StateService
  ) {}
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const id = route.params['id'];
    this.stateService.setLoading(true);
    return combineLatest([
      this.personService.fetchPersonDetails(id),
      this.personService.fetchCombinedCredits(id),
      this.personService.fetchSocialLinks(id),
      this.personService.fetchPersonImages(id),
    ]).pipe(tap(() => this.stateService.setLoading(false)));
  }
}
