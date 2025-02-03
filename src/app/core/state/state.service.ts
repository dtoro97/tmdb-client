import { TmdbService } from '../../shared';
import { StateStore } from './state.store';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StateService {
  constructor(private store: StateStore, private tmdbService: TmdbService) {}

  async loadSession(): Promise<void> {
    this.setLoading(true);
    const providers = await this.tmdbService.watchProviders.getTvProviders();
    const regions = await this.tmdbService.watchProviders.getRegions();
    const tvGenres = await this.tmdbService.genres.tvShows();
    const movieGenres = await this.tmdbService.genres.movies();
    const languages = await this.tmdbService.configuration.getLanguages();
    this.store.update((state) => ({
      providers: providers.results,
      regions: regions.results,
      tvGenres: tvGenres.genres,
      movieGenres: movieGenres.genres,
      languages,
    }));
    this.setLoading(false);
  }

  toggleDarkMode(): void {
    const isDarkMode = this.store.getValue().isDarkMode;
    this.store.update((state) => ({
      ...state,
      isDarkMode: !isDarkMode,
    }));
  }

  setLoading(loading: boolean): void {
    this.store.update({ loading });
  }
}
