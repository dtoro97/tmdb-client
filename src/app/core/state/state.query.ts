import { map, Observable } from 'rxjs';

import { BreakpointObserver } from '@angular/cdk/layout';
import { inject, Injectable, Signal } from '@angular/core';
import { Query } from '@datorama/akita';

import { State, StateStore } from './state.store';
import { GenreMovieList200ResponseGenresInner } from '../../api/model/genreMovieList200ResponseGenresInner';
import { ConfigurationLanguages200ResponseInner } from '../../api/model/configurationLanguages200ResponseInner';
import { WatchProvidersMovieList200ResponseResultsInner } from '../../api/model/watchProvidersMovieList200ResponseResultsInner';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class StateQuery extends Query<State> {
  providers$: Observable<WatchProvidersMovieList200ResponseResultsInner[]> = this.select(
    (state) => state.providers
  );
  tvGenres$: Observable<GenreMovieList200ResponseGenresInner[]> = this.select((state) => state.tvGenres);
  movieGenres$: Observable<GenreMovieList200ResponseGenresInner[]> = this.select((state) => state.movieGenres);
  isDarkMode$: Observable<boolean> = this.select((state) => state.isDarkMode);
  languages$: Observable<ConfigurationLanguages200ResponseInner[]> = this.select(
    (state) => state.languages
  );
  loading$: Observable<boolean> = this.selectLoading();
  isMobile: Signal<boolean>;
  private breakpointObserver = inject(BreakpointObserver);
  constructor(store: StateStore) {
    super(store);
    this.isMobile = toSignal(
      this.breakpointObserver
        .observe('(max-width: 768px)')
        .pipe(map((state) => state.matches)),
      { initialValue: false }
    );
  }
}
