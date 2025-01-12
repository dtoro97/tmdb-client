import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { IGenre } from '../interfaces';

export interface SessionState {
  providers: any[];
  regions: any[];
  movieGenres: IGenre[];
  tvGenres: IGenre[];
  isDarkMode: boolean;
  languages: any[];
}

export function createInitialState(): SessionState {
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
@StoreConfig({ name: 'session' })
export class SessionStore extends Store<SessionState> {
  constructor() {
    super(createInitialState());
  }
}
