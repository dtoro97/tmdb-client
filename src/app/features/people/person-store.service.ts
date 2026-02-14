import { uniqBy } from 'lodash';
import { filter, from, map, Observable, tap } from 'rxjs';
import {
  ExternalIds,
  Image,
  PeopleImages,
  PersonCombinedCredits,
  PersonDetails,
} from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentStore } from '@ngrx/component-store';

import { TmdbService } from '../../shared/services/tmdb.service';
import { handleMediaError } from '../../shared/operators/error-handler.operator';

export interface PersonState {
  combinedCredits: PersonCombinedCredits;
  socialLinks: ExternalIds | undefined;
  person: PersonDetails | undefined;
  images: Image[];
}

@Injectable({ providedIn: 'root' })
export class PersonDetailStore extends ComponentStore<PersonState> {
  readonly combinedCredits$: Observable<PersonCombinedCredits> = this.select(
    (state) => state.combinedCredits,
  );
  readonly socialLinks$: Observable<ExternalIds> = this.select(
    (state) => state.socialLinks,
  ).pipe(filter(Boolean));
  readonly person$: Observable<PersonDetails> = this.select(
    (state) => state.person,
  ).pipe(filter(Boolean));
  readonly images$: Observable<Image[]> = this.select((state) => state.images);
  readonly hasCredits$: Observable<boolean> = this.combinedCredits$.pipe(
    map((credits) => credits.cast.length > 0 || credits.crew.length > 0),
  );

  constructor(
    private tmdbService: TmdbService,
    private router: Router,
  ) {
    super({
      combinedCredits: { cast: [], crew: [], id: 0 },
      socialLinks: undefined,
      person: undefined,
      images: [],
    });
  }

  fetchCombinedCredits(id: number): Observable<PersonCombinedCredits> {
    return from(this.tmdbService.people.combinedCredits(id)).pipe(
      tap((data) => {
        const combinedCredits = {
          ...data,
          cast: uniqBy(data.cast, 'id'),
          crew: uniqBy(data.crew, 'id'),
        };
        this.patchState({ combinedCredits });
      }),
    );
  }

  fetchSocialLinks(id: number): Observable<ExternalIds> {
    return from(this.tmdbService.people.externalId(id)).pipe(
      tap((data) => this.patchState({ socialLinks: data })),
    );
  }

  fetchPersonDetails(id: number): Observable<PersonDetails> {
    return from(this.tmdbService.people.details(id)).pipe(
      handleMediaError(this.router),
      tap((data) => this.patchState({ person: data })),
    );
  }

  fetchPersonImages(id: number): Observable<PeopleImages> {
    return from(this.tmdbService.people.images(id)).pipe(
      tap((data) => this.patchState({ images: data.profiles })),
    );
  }

  getCredits(): PersonCombinedCredits {
    return this.get().combinedCredits;
  }
}
