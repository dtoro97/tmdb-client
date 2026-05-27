import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, forkJoin, map, of, tap } from 'rxjs';

import { WatchProviderCatalog, WatchProviderRestControllerService } from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import { LocaleStoreService } from './locale-store.service';

export interface WatchProviderOption {
    readonly id: number;
    readonly name: string;
    readonly logoPath: string | null;
    readonly displayPriority: number;
}

const FEATURED_PROVIDER_IDS = [8, 337, 1899, 119];

export const sortWatchProviders = <T extends { readonly id: number; readonly displayPriority: number }>(
    providers: readonly T[],
): T[] =>
    [...providers].sort(
        (left, right) =>
            getProviderPriority(left.id) - getProviderPriority(right.id) ||
            left.displayPriority - right.displayPriority,
    );

const getProviderPriority = (providerId: number): number => {
    const index = FEATURED_PROVIDER_IDS.indexOf(providerId);
    return index === -1 ? FEATURED_PROVIDER_IDS.length : index;
};

interface WatchProviderStoreState {
    movieProviders: WatchProviderOption[];
    tvProviders: WatchProviderOption[];
    loaded: boolean;
}

@Injectable({ providedIn: 'root' })
export class WatchProviderStoreService extends ComponentStore<WatchProviderStoreState> {
    readonly movieProviders$ = this.select((state) => state.movieProviders);
    readonly tvProviders$ = this.select((state) => state.tvProviders);
    readonly loaded$ = this.select((state) => state.loaded);
    private loadingRegion: string | null = null;
    private loadedRegion: string | null = null;

    readonly topMovieProviders$ = this.select(this.movieProviders$, (providers) => providers.slice(0, 3));

    readonly topTvProviders$ = this.select(this.tvProviders$, (providers) => providers.slice(0, 3));

    constructor(
        private readonly watchProviderService: WatchProviderRestControllerService,
        private readonly localeStore: LocaleStoreService,
    ) {
        super({
            movieProviders: [],
            tvProviders: [],
            loaded: false,
        });
    }

    load(): void {
        const region = this.localeStore.region() || 'US';

        if (this.loadingRegion === region || this.loadedRegion === region) {
            return;
        }

        this.loadingRegion = region;

        forkJoin([
            this.watchProviderService
                .watchProvidersMovieList(undefined, region, 'body', false, API_JSON_OPTIONS)
                .pipe(catchError(() => of({ results: [] }))),
            this.watchProviderService
                .watchProviderTvList(undefined, region, 'body', false, API_JSON_OPTIONS)
                .pipe(catchError(() => of({ results: [] }))),
        ])
            .pipe(
                map(([movieCatalog, tvCatalog]) => ({
                    movieProviders: this.mapProviders(movieCatalog.results ?? []),
                    tvProviders: this.mapProviders(tvCatalog.results ?? []),
                })),
                tap((result) => {
                    this.loadedRegion = region;
                    this.loadingRegion = null;
                    this.patchState({
                        ...result,
                        loaded: true,
                    });
                }),
            )
            .subscribe();
    }
    private mapProviders(
        items: readonly {
            provider_id?: number;
            provider_name?: string;
            logo_path?: string;
            display_priority?: number;
        }[],
    ): WatchProviderOption[] {
        const providers = items
            .filter(
                (p): p is typeof p & { provider_id: number; provider_name: string } =>
                    typeof p.provider_id === 'number' && typeof p.provider_name === 'string',
            )
            .map((p) => ({
                id: p.provider_id,
                name: p.provider_name,
                logoPath: p.logo_path ?? null,
                displayPriority: p.display_priority ?? 999,
            }));

        return sortWatchProviders(providers);
    }
}
