import { uniqBy } from 'lodash';
import { catchError, EMPTY, from, Observable, tap } from 'rxjs';
import {
  ExternalIds,
  PeopleImages,
  PersonCombinedCredits,
  PersonDetails,
} from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { TmdbService } from '../../shared';
import { PersonStore } from './person.store';

@Injectable({ providedIn: 'root' })
export class PersonService {
  constructor(
    private store: PersonStore,
    private tmdbService: TmdbService,
    private router: Router
  ) {}

  fetchCombinedCredits(id: number): Observable<PersonCombinedCredits> {
    return from(this.tmdbService.people.combinedCredits(id)).pipe(
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

  fetchSocialLinks(id: number): Observable<ExternalIds> {
    return from(this.tmdbService.people.externalId(id)).pipe(
      tap((data) => this.store.update({ socialLinks: data }))
    );
  }

  fetchPersonDetails(id: number): Observable<PersonDetails> {
    return from(this.tmdbService.people.details(id)).pipe(
      catchError((e) => {
        this.router.navigate(['not-found']);
        return EMPTY;
      }),
      tap((data) => this.store.update({ person: data }))
    );
  }

  fetchPersonImages(id: number): Observable<PeopleImages> {
    return from(this.tmdbService.people.images(id)).pipe(
      tap((data) => this.store.update({ images: data.profiles }))
    );
  }
}
