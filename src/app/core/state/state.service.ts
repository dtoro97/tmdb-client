import { forkJoin } from 'rxjs';

import { Injectable } from '@angular/core';

import { TmdbRestControllerService } from '../../api/api/tmdb.service';
import { StateStore } from './state.store';

@Injectable({ providedIn: 'root' })
export class StateService {
  constructor(private store: StateStore, private tmdbApi: TmdbRestControllerService) {}

  loadSession(): void {
    this.setLoading(true);
    forkJoin({
      providers: this.tmdbApi.watchProviderTvList(),
      regions: this.tmdbApi.watchProvidersAvailableRegions(),
      tvGenres: this.tmdbApi.genreTvList(),
      movieGenres: this.tmdbApi.genreMovieList(),
      languages: this.tmdbApi.configurationLanguages(),
    }).subscribe((data) => {
      this.store.update(() => ({
        providers: data.providers.results ?? [],
        regions: data.regions.results ?? [],
        tvGenres: data.tvGenres.genres ?? [],
        movieGenres: data.movieGenres.genres ?? [],
        languages: data.languages,
      }));
      this.setLoading(false);
    });
  }

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
