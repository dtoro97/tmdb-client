import { map, Observable } from 'rxjs';

import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';

import { State, StateStore } from './state.store';
import { Genre, LanguageConfiguration, WatchProvider } from 'tmdb-ts';

@Injectable({ providedIn: 'root' })
export class StateQuery extends Query<State> {
  providers$: Observable<WatchProvider[]> = this.select(
    (state) => state.providers
  );
  tvGenres$: Observable<Genre[]> = this.select((state) => state.tvGenres);
  movieGenres$: Observable<Genre[]> = this.select((state) => state.movieGenres);
  isDarkMode$: Observable<boolean> = this.select((state) => state.isDarkMode);
  languages$: Observable<LanguageConfiguration[]> = this.select(
    (state) => state.languages
  );
  loading$: Observable<boolean> = this.select((state) => state.loading);
  constructor(
    store: StateStore,
    private breakpointObserver: BreakpointObserver
  ) {
    super(store);
  }

  get providerIds() {
    return this.getValue().providers.map((provider) => provider.id);
  }

  get isMobile$() {
    return this.breakpointObserver
      .observe('(max-width: 768px)')
      .pipe(map((state) => state.matches));
  }

  get isMobile() {
    return this.breakpointObserver.isMatched('(max-width: 768px)');
  }
}
