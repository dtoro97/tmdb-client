import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { SessionState, SessionStore } from './session.store';
import { map, Observable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

@Injectable({ providedIn: 'root' })
export class SessionQuery extends Query<SessionState> {
  providers$: Observable<any[]> = this.select((state) => state.providers);
  genres$: Observable<any[]> = this.select((state) => state.genres);
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
      .observe('(max-width: 400px)')
      .pipe(map((state) => state.matches));
  }
}
