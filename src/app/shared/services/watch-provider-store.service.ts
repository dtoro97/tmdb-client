import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, combineLatest, EMPTY, map, switchMap, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { WatchProviderRestControllerService } from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import { LocaleStoreService } from './locale-store.service';

export interface WatchProviderOption {
    readonly id: number;
    readonly name: string;
    readonly logoPath: string | null;
    readonly displayPriority: number;
}

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

    readonly topMovieProviders$ = this.select(
        this.movieProviders$,
        (providers) => providers.slice(0, 3),
    );

    readonly topTvProviders$ = this.select(
        this.tvProviders$,
        (providers) => providers.slice(0, 3),
    );

    constructor(
        private readonly watchProviderService: WatchProviderRestControllerService,
        private readonly localeStore: LocaleStoreService,
    ) {
        super({
            movieProviders: [],
            tvProviders: [],
            loaded: false,
        });

        const region$ = toObservable(this.localeStore.region);

        region$
            .pipe(
                switchMap((region) => {
                    const effectiveRegion = region || 'US';

                    return combineLatest([
                        this.watchProviderService
                            .watchProvidersMovieList(
                                undefined,
                                effectiveRegion,
                                'body',
                                false,
                                API_JSON_OPTIONS,
                            )
                            .pipe(catchError(() => EMPTY)),
                        this.watchProviderService
                            .watchProviderTvList(
                                undefined,
                                effectiveRegion,
                                'body',
                                false,
                                API_JSON_OPTIONS,
                            )
                            .pipe(catchError(() => EMPTY)),
                    ]);
                }),
                map(([movieCatalog, tvCatalog]) => ({
                    movieProviders: this.mapProviders(movieCatalog.results ?? []),
                    tvProviders: this.mapProviders(tvCatalog.results ?? []),
                })),
                tap((result) =>
                    this.patchState({
                        ...result,
                        loaded: true,
                    }),
                ),
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
        return items
            .filter(
                (p): p is typeof p & { provider_id: number; provider_name: string } =>
                    typeof p.provider_id === 'number' &&
                    typeof p.provider_name === 'string',
            )
            .sort((a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999))
            .map((p) => ({
                id: p.provider_id,
                name: p.provider_name,
                logoPath: p.logo_path ?? null,
                displayPriority: p.display_priority ?? 999,
            }));
    }
}
