import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
    catchError,
    combineLatest,
    distinctUntilChanged,
    filter,
    map,
    Observable,
    of,
    switchMap,
    tap,
} from 'rxjs';

import {
    TvEpisode,
    TvSeason,
    TvSeasonCompact,
    TvSeasonRestControllerService,
    TvSeries,
} from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import { LoadableItems } from '../../shared';

export interface SelectedSeasonInfo {
    seasonNumber: number;
    name: string;
    episodeCount: number;
}

type SeasonEpisodesState = 'idle' | 'loading' | 'loaded';

type TvSeasonState = (TvSeason | TvSeasonCompact) & {
    episodes?: TvEpisode[];
    episodesState: SeasonEpisodesState;
};

interface MediaSeasonsState {
    seriesId?: number;
    seasons: LoadableItems<TvSeasonState>;
    selectedSeason?: number;
}

const INITIAL_STATE: MediaSeasonsState = {
    seriesId: undefined,
    seasons: { type: 'idle' },
    selectedSeason: undefined,
};

@Injectable()
export class MediaSeasonsStoreService extends ComponentStore<MediaSeasonsState> {
    readonly seriesId$ = this.select((state) => state.seriesId);
    readonly seasonsState$ = this.select((state) => state.seasons);
    readonly selectedSeason$ = this.select((state) => state.selectedSeason);

    readonly selectedSeasonInfo$ = combineLatest([
        this.selectedSeason$,
        this.seasonsState$,
    ]).pipe(
        map(([selectedSeason, seasonsState]) => {
            if (!Number.isInteger(selectedSeason)) {
                return null;
            }

            const seasonNumber = selectedSeason as number;
            const season = this.loadedValue(seasonsState).find(
                (s) => s.season_number === seasonNumber,
            );
            if (!season) {
                return {
                    seasonNumber,
                    name: `Season ${seasonNumber}`,
                    episodeCount: 5,
                } as SelectedSeasonInfo;
            }

            const compactCount =
                'episode_count' in season ? (season.episode_count ?? 0) : 0;
            const loadedCount = season.episodes?.length ?? 0;
            const episodeCount =
                season.episodesState === 'loaded'
                    ? loadedCount || compactCount || 5
                    : compactCount || 5;

            return {
                seasonNumber,
                name:
                    season.name ??
                    (seasonNumber === 0
                        ? 'Specials'
                        : `Season ${seasonNumber}`),
                episodeCount,
            } as SelectedSeasonInfo;
        }),
    );

    readonly seasonEpisodesState$ = combineLatest([
        this.seasonsState$,
        this.selectedSeason$,
    ]).pipe(
        map(([seasonsState, selected]) => {
            if (!Number.isInteger(selected)) {
                return { type: 'idle' } as LoadableItems<TvEpisode>;
            }

            const season = this.loadedValue(seasonsState).find(
                (s) => s.season_number === selected,
            );
            if (!season) {
                return { type: 'idle' } as LoadableItems<TvEpisode>;
            }

            if (season.episodesState === 'loading') {
                return { type: 'loading' } as LoadableItems<TvEpisode>;
            }

            if (season.episodesState !== 'loaded') {
                return { type: 'idle' } as LoadableItems<TvEpisode>;
            }

            return {
                type: 'loaded',
                value: season.episodes ?? [],
            } as LoadableItems<TvEpisode>;
        }),
    );

    readonly seasonPillOptions$ = this.seasonsState$.pipe(
        map((seasonsState) =>
            this.sortSeasons(this.loadedValue(seasonsState)).map((s) => ({
                label:
                    (s.season_number ?? 0) === 0
                        ? (s.name ?? 'Specials')
                        : (s.name ?? `Season ${s.season_number}`),
                value: s.season_number,
            })),
        ),
    );

    readonly topRatedEpisode$ = this.seasonsState$.pipe(
        map((seasonsState) => {
            if (seasonsState.type === 'loaded') {
                const topRated = this.loadedValue(seasonsState)
                    .flatMap((s) => s.episodes ?? [])
                    .reduce(
                        (best, ep) =>
                            (ep.vote_average ?? 0) > (best?.vote_average ?? 0)
                                ? ep
                                : best,
                        null as TvEpisode | null,
                    );
                return { type: 'loaded', value: topRated };
            } else {
                return { type: 'loading' };
            }
        }),
    );

    constructor(
        private tvSeasonRestControllerService: TvSeasonRestControllerService,
    ) {
        super(INITIAL_STATE);
        this.fetchSelectedSeasonEffect(
            combineLatest([this.seriesId$, this.selectedSeason$]).pipe(
                map(([seriesId, seasonNumber]) => ({ seriesId, seasonNumber })),
                filter(
                    (
                        payload,
                    ): payload is { seriesId: number; seasonNumber: number } =>
                        Number.isInteger(payload.seriesId) &&
                        Number.isInteger(payload.seasonNumber),
                ),
                distinctUntilChanged(
                    (prev, next) =>
                        prev.seriesId === next.seriesId &&
                        prev.seasonNumber === next.seasonNumber,
                ),
            ),
        );
    }

    setSeriesId(seriesId: number): void {
        this.patchState({ seriesId });
    }

    initializeFromSeries(series: TvSeries): void {
        const currentState = this.get();
        const seasons = this.toSeasonStubs(
            series,
            this.loadedValue(currentState.seasons),
        );

        this.patchState({
            seasons: { type: 'loaded', value: seasons },
            selectedSeason:
                this.getSelectedSeasonNumber(series, currentState.selectedSeason),
        });
    }

    updateSelectedSeason(seasonNumber: number): void {
        this.patchState({ selectedSeason: seasonNumber });
    }

    loadSeasonIfNeeded$(
        seriesId: number,
        seasonNumber: number,
    ): Observable<TvSeason | null> {
        const seasons = this.loadedValue(this.get().seasons);
        const existing = seasons.find(
            (season) => season.season_number === seasonNumber,
        );
        if (existing?.episodesState === 'loaded') {
            return of((existing as TvSeason) ?? null);
        }

        if (existing?.episodesState === 'loading') {
            return of(null);
        }

        this.upsertSeasonStub(seasonNumber);
        this.setSeasonEpisodesState(seasonNumber, 'loading');

        return this.fetchSeason$(seriesId, seasonNumber).pipe(
            tap((season) => {
                this.upsertSeason(season);
            }),
            catchError(() => {
                this.setSeasonEpisodesState(seasonNumber, 'idle');
                return of(null);
            }),
        );
    }

    private fetchSeason$(seriesId: number, seasonNumber: number) {
        return this.tvSeasonRestControllerService.tvSeasonDetails(
            seriesId,
            seasonNumber,
            undefined,
            undefined,
            undefined,
            undefined,
            API_JSON_OPTIONS,
        );
    }

    private loadedValue<T>(state: LoadableItems<T>): T[] {
        return state.type === 'loaded' ? state.value : [];
    }

    private toSeasonStubs(
        tvSeries: TvSeries,
        existingSeasons: TvSeasonState[] = [],
    ): TvSeasonState[] {
        const existingBySeasonNumber = new Map(
            existingSeasons
                .filter(
                    (season): season is TvSeasonState & { season_number: number } =>
                        Number.isInteger(season.season_number),
                )
                .map((season) => [season.season_number, season]),
        );

        return this.sortSeasons(
            (tvSeries.seasons ?? []).map((season) => ({
                ...season,
                episodes:
                    existingBySeasonNumber.get(season.season_number ?? -1)
                        ?.episodes ?? [],
                episodesState:
                    existingBySeasonNumber.get(season.season_number ?? -1)
                        ?.episodesState ?? 'idle',
            })),
        );
    }

    private upsertSeason(season: TvSeason): void {
        const seasons = this.loadedValue(this.get().seasons);
        const nextSeason: TvSeasonState = {
            ...season,
            episodes: season.episodes ?? [],
            episodesState: 'loaded',
        };

        this.patchState({
            seasons: {
                type: 'loaded',
                value: this.sortSeasons([
                    ...seasons.filter(
                        (s) => s.season_number !== season.season_number,
                    ),
                    nextSeason,
                ]),
            },
        });
    }

    private upsertSeasonStub(seasonNumber: number): void {
        this.patchState((state) => {
            const seasons = this.loadedValue(state.seasons);
            const existing = seasons.find(
                (season) => season.season_number === seasonNumber,
            );
            const stub: TvSeasonState = {
                ...(existing ?? {
                    season_number: seasonNumber,
                    name: `Season ${seasonNumber}`,
                }),
                episodes: existing?.episodes ?? [],
                episodesState: existing?.episodesState ?? 'idle',
            };

            return {
                seasons: {
                    type: 'loaded',
                    value: this.sortSeasons([
                        ...seasons.filter(
                            (season) => season.season_number !== seasonNumber,
                        ),
                        stub,
                    ]),
                },
            };
        });
    }

    private setSeasonEpisodesState(
        seasonNumber: number,
        episodesState: TvSeasonState['episodesState'],
    ): void {
        this.patchState((state) => ({
            seasons: {
                type: 'loaded',
                value: this.sortSeasons(
                    this.loadedValue(state.seasons).map((season) =>
                        season.season_number === seasonNumber
                            ? { ...season, episodesState }
                            : season,
                    ),
                ),
            },
        }));
    }

    private getSelectedSeasonNumber(
        tvSeries: TvSeries,
        selectedSeason?: number,
    ): number | undefined {
        const seasonNumbers = this.sortSeasons(
            (tvSeries.seasons ?? []).map((season) => ({
                ...season,
                episodesState: 'idle' as const,
            })),
        )
            .map((season) => season.season_number)
            .filter((seasonNumber): seasonNumber is number =>
                Number.isInteger(seasonNumber),
            );

        if (
            Number.isInteger(selectedSeason) &&
            seasonNumbers.includes(selectedSeason as number)
        ) {
            return selectedSeason;
        }

        if (seasonNumbers.includes(1)) {
            return 1;
        }

        return seasonNumbers[0];
    }

    private sortSeasons(seasons: TvSeasonState[]): TvSeasonState[] {
        return [...seasons].sort(
            (a, b) => (a.season_number ?? 0) - (b.season_number ?? 0),
        );
    }

    private readonly fetchSelectedSeasonEffect = this.effect<{
        seriesId: number;
        seasonNumber: number;
    }>((params$) =>
        params$.pipe(
            switchMap(({ seriesId, seasonNumber }) =>
                this.loadSeasonIfNeeded$(seriesId, seasonNumber),
            ),
        ),
    );
}
