import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { SessionState, SessionStore } from './session.store';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SessionQuery extends Query<SessionState> {
  providers$: Observable<any[]> = this.select((state) => state.providers);
  constructor(store: SessionStore) {
    super(store);
  }

  get providerIds() {
    return this.getValue().providers.map((provider) => provider.id);
  }
}
