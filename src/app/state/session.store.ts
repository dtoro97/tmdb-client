import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface SessionState {
  providers: any[];
  regions: any[];
  genres: any[];
}

export function createInitialState(): SessionState {
  return {
    providers: [],
    regions: [],
    genres: [],
  };
}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'session' })
export class SessionStore extends Store<SessionState> {
  constructor() {
    super(createInitialState());
  }
}
