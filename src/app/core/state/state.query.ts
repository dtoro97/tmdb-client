import { map, Observable } from 'rxjs';

import { BreakpointObserver } from '@angular/cdk/layout';
import { inject, Injectable, Signal } from '@angular/core';
import { Query } from '@datorama/akita';

import { State, StateStore } from './state.store';
import { Genre, LanguageConfiguration, WatchProvider } from 'tmdb-ts';
import { toSignal } from '@angular/core/rxjs-interop';

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
