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
    this.sessionStore.update((state) => ({
      providers: providers.results,
      regions: regions.results,
    }));
    this.loader.setLoading(false);
    console.log(regions);
  }
}
