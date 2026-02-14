import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { PersonService } from '../../core';
import { spinner } from '../helpers/spinner';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Injectable({
  providedIn: 'root',
})
export class PersonResolver implements Resolve<any> {
  constructor(
    private personService: PersonService,
    private ngxUiLoaderService: NgxUiLoaderService,
  ) {}
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const id = route.params['id'];
    return combineLatest([
      this.personService.fetchPersonDetails(id),
      this.personService.fetchCombinedCredits(id),
      this.personService.fetchSocialLinks(id),
      this.personService.fetchPersonImages(id),
    ]).pipe(spinner(this.ngxUiLoaderService, 'master'));
  }
}
