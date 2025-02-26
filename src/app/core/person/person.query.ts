import { filter, map, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';

import {
  ExternalIds,
  Image,
  PersonCombinedCredits,
  PersonDetails,
} from 'tmdb-ts';

import { PersonState, PersonStore } from './person.store';

@Injectable({ providedIn: 'root' })
export class PersonQuery extends Query<PersonState> {
  combinedCredits$: Observable<PersonCombinedCredits> = this.select(
    (state) => state.combinedCredits
  );
  socialLinks$: Observable<ExternalIds> = this.select(
    (state) => state.socialLinks
  ).pipe(filter(Boolean));
  person$: Observable<PersonDetails> = this.select(
    (state) => state.person
  ).pipe(filter(Boolean));
  images$: Observable<Image[]> = this.select((state) => state.images);
  hasCredits$: Observable<boolean> = this.combinedCredits$.pipe(
    map((credits) => credits.cast.length > 0 || credits.crew.length > 0)
  );
  constructor(store: PersonStore) {
    super(store);
  }
}
