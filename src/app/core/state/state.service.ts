import { StateStore } from './state.store';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StateService {
  constructor(private store: StateStore) {}

  toggleDarkMode(): void {
    const isDarkMode = this.store.getValue().isDarkMode;
    this.store.update((state) => ({
      ...state,
      isDarkMode: !isDarkMode,
    }));
  }

  setLoading(loading: boolean): void {
    this.store.setLoading(loading);
  }
}
