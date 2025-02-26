import {
  ExternalIds,
  Image,
  PersonCombinedCredits,
  PersonDetails,
} from 'tmdb-ts';

import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface PersonState {
  combinedCredits: PersonCombinedCredits;
  socialLinks: ExternalIds | undefined;
  person: PersonDetails | undefined;
  images: Image[];
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
