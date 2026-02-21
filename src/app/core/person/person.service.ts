import { uniqBy } from 'lodash';
import { catchError, EMPTY, Observable, tap } from 'rxjs';
import { PersonCombinedCredits200Response } from '../../api/model/personCombinedCredits200Response';
import { PersonDetails200Response } from '../../api/model/personDetails200Response';
import { PersonExternalIds200Response } from '../../api/model/personExternalIds200Response';
import { PersonImages200Response } from '../../api/model/personImages200Response';

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { TmdbRestControllerService } from '../../api/api/tmdb.service';
import { PersonStore } from './person.store';

@Injectable({ providedIn: 'root' })
export class PersonService {
  constructor(
    private store: PersonStore,
    private tmdbApi: TmdbRestControllerService,
    private router: Router
  ) {}

  fetchCombinedCredits(id: number): Observable<PersonCombinedCredits200Response> {
    return this.tmdbApi.personCombinedCredits(id.toString()).pipe(
      tap((data) => {
        const combinedCredits = {
          ...data,
          cast: uniqBy(data.cast, 'id'),
          crew: uniqBy(data.crew, 'id'),
        };
        this.store.update({ combinedCredits });
      })
    );
  }

  fetchSocialLinks(id: number): Observable<PersonExternalIds200Response> {
    return this.tmdbApi.personExternalIds(id).pipe(
      tap((data) => this.store.update({ socialLinks: data }))
    );
  }

  fetchPersonDetails(id: number): Observable<PersonDetails200Response> {
    return this.tmdbApi.personDetails(id).pipe(
      catchError((e) => {
        this.router.navigate(['not-found']);
        return EMPTY;
      }),
      tap((data) => this.store.update({ person: data }))
    );
  }

  fetchPersonImages(id: number): Observable<PersonImages200Response> {
    return this.tmdbApi.personImages(id).pipe(
      tap((data) => this.store.update({ images: data.profiles || [] }))
    );
  }
}
