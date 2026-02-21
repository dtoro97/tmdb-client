import { GenreMovieList200ResponseGenresInner } from '../../api/model/genreMovieList200ResponseGenresInner';
import { ConfigurationLanguages200ResponseInner } from '../../api/model/configurationLanguages200ResponseInner';
import { WatchProvidersMovieList200ResponseResultsInner } from '../../api/model/watchProvidersMovieList200ResponseResultsInner';
import { ConfigurationCountries200ResponseInner } from '../../api/model/configurationCountries200ResponseInner';

import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface State {
  providers: WatchProvidersMovieList200ResponseResultsInner[];
  regions: ConfigurationCountries200ResponseInner[];
  movieGenres: GenreMovieList200ResponseGenresInner[];
  tvGenres: GenreMovieList200ResponseGenresInner[];
  isDarkMode: boolean;
  languages: ConfigurationLanguages200ResponseInner[];
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
