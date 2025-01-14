import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Genre, LanguageConfiguration } from 'tmdb-ts';
import { Region } from 'tmdb-ts/dist/types/regions';

export interface State {
  providers: any[];
  regions: Region[];
  movieGenres: Genre[];
  tvGenres: Genre[];
  isDarkMode: boolean;
  languages: LanguageConfiguration[];
  loading: boolean;
}

export function createInitialState(): State {
  return {
    providers: [],
    regions: [],
    movieGenres: [],
    tvGenres: [],
    isDarkMode: true,
    languages: [],
    loading: true,
  };
}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'state' })
export class StateStore extends Store<State> {
  constructor() {
    super(createInitialState());
  }
}
