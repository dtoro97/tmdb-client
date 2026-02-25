import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Language } from '../../api';

export type ConfigStoreState = {
  isDarkMode: boolean;
  languages: Language[];
};

@Injectable({ providedIn: 'root' })
export class ConfigStoreService extends ComponentStore<ConfigStoreState> {
  languages$ = this.select((state) => state.languages);
  isDarkMode$ = this.select((state) => state.isDarkMode);
  constructor() {
    super({ isDarkMode: true, languages: [] });
  }

  toggleDarkMode() {
    this.patchState((state) => ({ ...state, isDarkMode: !state.isDarkMode }));
  }
}
