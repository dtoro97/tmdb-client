import { from, Observable } from 'rxjs';
import { PeopleImages } from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { TmdbService } from '../../services';
import { StateService } from '../../../core';

@Injectable({
  providedIn: 'root',
})
export class PersonImagesResolver implements Resolve<PeopleImages> {
  constructor(private tmdb: TmdbService, private stateService: StateService) {}
  resolve(route: ActivatedRouteSnapshot): Observable<PeopleImages> {
    this.stateService.setLoading(true);
    const id = route.params['id'];
    return from(this.tmdb.people.images(id));
  }
}
