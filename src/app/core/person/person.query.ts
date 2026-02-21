import { filter, map, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';

import { PersonCombinedCredits200Response } from '../../api/model/personCombinedCredits200Response';
import { PersonDetails200Response } from '../../api/model/personDetails200Response';
import { PersonExternalIds200Response } from '../../api/model/personExternalIds200Response';
import { PersonImages200ResponseProfilesInner } from '../../api/model/personImages200ResponseProfilesInner';

import { PersonState, PersonStore } from './person.store';

@Injectable({ providedIn: 'root' })
export class PersonQuery extends Query<PersonState> {
  combinedCredits$: Observable<PersonCombinedCredits200Response> = this.select(
    (state) => state.combinedCredits
  );
  socialLinks$: Observable<PersonExternalIds200Response> = this.select(
    (state) => state.socialLinks
  ).pipe(filter(Boolean));
  person$: Observable<PersonDetails200Response> = this.select(
    (state) => state.person
  ).pipe(filter(Boolean));
  images$: Observable<PersonImages200ResponseProfilesInner[]> = this.select((state) => state.images);
  hasCredits$: Observable<boolean> = this.combinedCredits$.pipe(
    map((credits) => (credits.cast || []).length > 0 || (credits.crew || []).length > 0)
  );
  constructor(store: PersonStore) {
    super(store);
  }

  getCredits(): PersonCombinedCredits200Response {
    return this.store.getValue().combinedCredits;
  }
}
