import { Genre, LanguageConfiguration, WatchProvider } from 'tmdb-ts';
import { Region } from 'tmdb-ts/dist/types/regions';

import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface State {
  providers: WatchProvider[];
  regions: Region[];
  movieGenres: Genre[];
  tvGenres: Genre[];
  isDarkMode: boolean;
  languages: LanguageConfiguration[];
}

export function createInitialState(): State {
  return {
    providers: [],
    regions: [],
    movieGenres: [],
    tvGenres: [],
    isDarkMode: true,
    languages: [],
  };
}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'state' })
export class StateStore extends Store<State> {
  constructor() {
    super(createInitialState());
  }
}
