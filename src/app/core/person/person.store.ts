import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { PersonCombinedCredits200Response } from '../../api/model/personCombinedCredits200Response';
import { PersonDetails200Response } from '../../api/model/personDetails200Response';
import { PersonExternalIds200Response } from '../../api/model/personExternalIds200Response';
import { PersonImages200ResponseProfilesInner } from '../../api/model/personImages200ResponseProfilesInner';

export interface PersonState {
  combinedCredits: PersonCombinedCredits200Response;
  socialLinks: PersonExternalIds200Response | undefined;
  person: PersonDetails200Response | undefined;
  images: PersonImages200ResponseProfilesInner[];
}

function createInitialState(): PersonState {
  return {
    combinedCredits: { cast: [], crew: [], id: 0 },
    socialLinks: undefined,
    person: undefined,
    images: [],
  };
}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'person' })
export class PersonStore extends Store<PersonState> {
  constructor() {
    super(createInitialState());
  }
}
