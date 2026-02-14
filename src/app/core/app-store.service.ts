import { map, Observable } from 'rxjs';
import { Genre, LanguageConfiguration, WatchProvider } from 'tmdb-ts';
import { Region } from 'tmdb-ts/dist/types/regions';

import { Injectable, Signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComponentStore } from '@ngrx/component-store';

import { TmdbService } from '../shared/services/tmdb.service';

export interface AppState {
  providers: WatchProvider[];
  regions: Region[];
  movieGenres: Genre[];
  tvGenres: Genre[];
  isDarkMode: boolean;
  languages: LanguageConfiguration[];
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppStoreService extends ComponentStore<AppState> {
  readonly providers$ = this.select((state) => state.providers);
  readonly tvGenres$: Observable<Genre[]> = this.select((state) => state.tvGenres);
  readonly movieGenres$: Observable<Genre[]> = this.select((state) => state.movieGenres);
  readonly isDarkMode$: Observable<boolean> = this.select((state) => state.isDarkMode);
  readonly languages$: Observable<LanguageConfiguration[]> = this.select((state) => state.languages);
  readonly loading$: Observable<boolean> = this.select((state) => state.loading);
  readonly isMobile: Signal<boolean>;

  constructor(
    private tmdbService: TmdbService,
    private breakpointObserver: BreakpointObserver,
  ) {
    super({
      providers: [],
      regions: [],
      movieGenres: [],
      tvGenres: [],
      isDarkMode: true,
      languages: [],
      loading: false,
    });
    this.isMobile = toSignal(
      this.breakpointObserver
        .observe('(max-width: 768px)')
        .pipe(map((state) => state.matches)),
      { initialValue: false },
    );
  }

  async loadSession(): Promise<void> {
    this.patchState({ loading: true });
    const providers = await this.tmdbService.watchProviders.getTvProviders();
    const regions = await this.tmdbService.watchProviders.getRegions();
    const tvGenres = await this.tmdbService.genres.tvShows();
    const movieGenres = await this.tmdbService.genres.movies();
    const languages = await this.tmdbService.configuration.getLanguages();
    this.patchState({
      providers: providers.results,
      regions: regions.results,
      tvGenres: tvGenres.genres,
      movieGenres: movieGenres.genres,
      languages,
      loading: false,
    });
  }

  toggleDarkMode(): void {
    this.patchState((state) => ({ isDarkMode: !state.isDarkMode }));
  }
}
