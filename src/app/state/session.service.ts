import { LoaderService, TmdbService } from '../services';
import { SessionStore } from './session.store';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionService {
  constructor(
    private sessionStore: SessionStore,
    private loader: LoaderService,
    private tmdbService: TmdbService
  ) {}

  async loadSession(): Promise<void> {
    this.loader.setLoading(true);
    const providers = await this.tmdbService.getProviders('tv').toPromise();
    const regions = await this.tmdbService.getAvailableRegions().toPromise();
    const tvGenres = await this.tmdbService.getGenres('tv').toPromise();
    const movieGenres = await this.tmdbService.getGenres('movie').toPromise();
    const languages = await this.tmdbService.getLanguages().toPromise();
    this.sessionStore.update((state) => ({
      providers: providers.results,
      regions: regions.results,
      tvGenres: tvGenres.genres,
      movieGenres: movieGenres.genres,
      languages,
    }));
    this.loader.setLoading(false);
  }

  toggleDarkMode(): void {
    const isDarkMode = this.sessionStore.getValue().isDarkMode;
    this.sessionStore.update((state) => ({
      ...state,
      isDarkMode: !isDarkMode,
    }));
  }
}
