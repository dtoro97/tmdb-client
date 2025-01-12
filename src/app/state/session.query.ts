import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { SessionState, SessionStore } from './session.store';
import { map, Observable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { IGenre } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class SessionQuery extends Query<SessionState> {
  providers$: Observable<any[]> = this.select((state) => state.providers);
  tvGenres$: Observable<IGenre[]> = this.select((state) => state.tvGenres);
  movieGenres$: Observable<IGenre[]> = this.select(
    (state) => state.movieGenres
  );
  isDarkMode$: Observable<boolean> = this.select((state) => state.isDarkMode);
  languages$: Observable<any[]> = this.select((state) => state.languages);
  constructor(
    store: SessionStore,
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
}
