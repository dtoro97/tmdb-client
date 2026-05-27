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
    TvSeasonImages,
    TvSeasonRestControllerService,
    TvSeries,
    Video,
} from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import {
    isDefined,
    LoadableItems,
    LocaleStoreService,
    ViewerImage,
    loadedItems,
    toYoutubeTrailerFirstVideoState,
} from '../../shared';

export interface SelectedSeasonInfo {
    seasonNumber: number;
    name: string;
    episodeCount: number;
    airDate: string | null;
    overview: string;
    posterPath: string | null;
    voteAverage: number | null;
}

type TvSeasonState = Omit<TvSeason | TvSeasonCompact, 'episodes'> & {
    episodes: LoadableItems<TvEpisode>;
    images: LoadableItems<ViewerImage>;
    videos: LoadableItems<Video>;
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

    readonly selectedSeasonInfo$ = combineLatest([this.selectedSeason$, this.seasonsState$]).pipe(
        map(([selectedSeason, seasonsState]) => {
            if (!isDefined(selectedSeason)) {
                return null;
            }

            const seasonNumber = selectedSeason;
            const season = loadedItems(seasonsState).find((s) => s.season_number === seasonNumber);
            if (!season) {
                return {
                    seasonNumber,
                    name: `Season ${seasonNumber}`,
                    episodeCount: 0,
                    airDate: null,
                    overview: '',
                    posterPath: null,
                    voteAverage: null,
                } as SelectedSeasonInfo;
            }

            const compactCount = 'episode_count' in season ? (season.episode_count ?? 0) : 0;
            const loadedCount = loadedItems(season.episodes).length;
            const episodeCount = season.episodes.type === 'loaded' ? loadedCount || compactCount || 5 : compactCount || 5;

            return {
                seasonNumber,
                name: season.name ?? (seasonNumber === 0 ? 'Specials' : `Season ${seasonNumber}`),
                episodeCount,
                airDate: season.air_date ?? null,
                overview: season.overview ?? '',
                posterPath: season.poster_path ?? null,
                voteAverage: season.vote_average && season.vote_average > 0 ? season.vote_average : null,
            } as SelectedSeasonInfo;
        }),
    );

    readonly seasonEpisodesState$ = combineLatest([this.seasonsState$, this.selectedSeason$]).pipe(
        map(([seasonsState, selected]) => {
            if (!isDefined(selected)) {
                return { type: 'idle' } as LoadableItems<TvEpisode>;
            }

            const season = loadedItems(seasonsState).find((s) => s.season_number === selected);
            if (!season) {
                return { type: 'idle' } as LoadableItems<TvEpisode>;
            }

            return season.episodes;
        }),
    );

    readonly seasonPillOptions$ = this.seasonsState$.pipe(
        map((seasonsState) =>
            this.sortSeasons(loadedItems(seasonsState)).map((s) => ({
                label: (s.season_number ?? 0) === 0 ? (s.name ?? 'Specials') : (s.name ?? `Season ${s.season_number}`),
                value: s.season_number,
            })),
        ),
    );

    readonly seasonImagesState$ = combineLatest([this.seasonsState$, this.selectedSeason$]).pipe(
        map(([seasonsState, selected]) => {
            if (!isDefined(selected)) {
                return { type: 'idle' } as LoadableItems<ViewerImage>;
            }

            const season = loadedItems(seasonsState).find((s) => s.season_number === selected);
            if (!season) {
                return { type: 'idle' } as LoadableItems<ViewerImage>;
            }

            return season.images;
        }),
    );

    readonly seasonVideosState$ = combineLatest([this.seasonsState$, this.selectedSeason$]).pipe(
        map(([seasonsState, selected]) => {
            if (!isDefined(selected)) {
                return { type: 'idle' } as LoadableItems<Video>;
            }

            const season = loadedItems(seasonsState).find((s) => s.season_number === selected);
            if (!season) {
                return { type: 'idle' } as LoadableItems<Video>;
            }

            if (season.videos.type !== 'loaded') {
                return season.videos;
            }

            return toYoutubeTrailerFirstVideoState(season.videos);
        }),
    );

    constructor(
        private tvSeasonRestControllerService: TvSeasonRestControllerService,
        private localeStore: LocaleStoreService,
    ) {
        super(INITIAL_STATE);
        const selectedSeasonParams$ = combineLatest([this.seriesId$, this.selectedSeason$]).pipe(
            map(([seriesId, seasonNumber]) => ({ seriesId, seasonNumber })),
            filter(
                (payload): payload is { seriesId: number; seasonNumber: number } =>
                    isDefined(payload.seriesId) && isDefined(payload.seasonNumber),
            ),
            distinctUntilChanged(
                (previous, current) =>
                    previous.seriesId === current.seriesId && previous.seasonNumber === current.seasonNumber,
            ),
        );

        this.fetchSelectedSeasonEffect(selectedSeasonParams$);
        this.fetchSelectedSeasonImagesEffect(selectedSeasonParams$);
        this.fetchSelectedSeasonVideosEffect(selectedSeasonParams$);
    }

    setSeriesId(seriesId: number): void {
        this.patchState({ seriesId });
    }

    initializeFromSeries(series: TvSeries): void {
        const currentState = this.get();
        const seasons = this.toSeasonStubs(series, loadedItems(currentState.seasons));

        this.patchState({
            seasons: { type: 'loaded', value: seasons },
            selectedSeason: this.getSelectedSeasonNumber(series, currentState.selectedSeason),
        });
    }

    updateSelectedSeason(seasonNumber: number): void {
        this.patchState({ selectedSeason: seasonNumber });
    }

    loadSeasonIfNeeded$(seriesId: number, seasonNumber: number): Observable<TvSeason | null> {
        const season = this.getSeason(seasonNumber);
        if (season?.episodes.type === 'loaded') {
            return of({
                ...season,
                episodes: season.episodes.value,
            } as TvSeason);
        }

        if (season?.episodes.type === 'loading') {
            return of(null);
        }

        this.upsertSeasonStub(seasonNumber);
        this.patchSeasonResource(seasonNumber, { episodes: { type: 'loading' } });

        return this.fetchSeason$(seriesId, seasonNumber).pipe(
            tap((loadedSeason) => {
                this.upsertSeasonDetails(loadedSeason);
            }),
            catchError(() => {
                this.patchSeasonResource(seasonNumber, { episodes: { type: 'idle' } });
                return of(null);
            }),
        );
    }

    private loadSeasonImagesIfNeeded$(seriesId: number, seasonNumber: number): Observable<ViewerImage[]> {
        const season = this.getSeason(seasonNumber);
        if (season?.images.type === 'loaded') {
            return of(season.images.value);
        }

        if (season?.images.type === 'loading') {
            return of([]);
        }

        this.upsertSeasonStub(seasonNumber);
        this.patchSeasonResource(seasonNumber, { images: { type: 'loading' } });

        return this.fetchSeasonImages$(seriesId, seasonNumber).pipe(
            map((images) => this.toSeasonImages(images)),
            tap((images) => {
                this.patchSeasonImages(seasonNumber, images);
            }),
            catchError(() => {
                this.patchSeasonImages(seasonNumber, []);
                return of([]);
            }),
        );
    }

    private loadSeasonVideosIfNeeded$(seriesId: number, seasonNumber: number): Observable<Video[]> {
        const season = this.getSeason(seasonNumber);
        if (season?.videos.type === 'loaded') {
            return of(season.videos.value);
        }

        if (season?.videos.type === 'loading') {
            return of([]);
        }

        this.upsertSeasonStub(seasonNumber);
        this.patchSeasonResource(seasonNumber, { videos: { type: 'loading' } });

        return this.fetchSeasonVideos$(seriesId, seasonNumber).pipe(
            map((videos) => videos.results ?? []),
            tap((videos) => {
                this.patchSeasonVideos(seasonNumber, videos);
            }),
            catchError(() => {
                this.patchSeasonVideos(seasonNumber, []);
                return of([]);
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

    private fetchSeasonImages$(seriesId: number, seasonNumber: number) {
        return this.tvSeasonRestControllerService.tvSeasonImages(
            seriesId,
            seasonNumber,
            undefined,
            undefined,
            undefined,
            undefined,
            API_JSON_OPTIONS,
        );
    }

    private fetchSeasonVideos$(seriesId: number, seasonNumber: number) {
        return this.tvSeasonRestControllerService.tvSeasonVideos(
            seriesId,
            seasonNumber,
            undefined,
            undefined,
            undefined,
            undefined,
            API_JSON_OPTIONS,
        );
    }

    private getSeason(seasonNumber: number): TvSeasonState | undefined {
        return loadedItems(this.get().seasons).find((season) => season.season_number === seasonNumber);
    }

    private toSeasonStubs(tvSeries: TvSeries, existingSeasons: TvSeasonState[] = []): TvSeasonState[] {
        const existingBySeasonNumber = new Map(
            existingSeasons
                .filter((season): season is TvSeasonState & { season_number: number } =>
                    isDefined(season.season_number),
                )
                .map((season) => [season.season_number, season]),
        );

        return this.sortSeasons(
            (tvSeries.seasons ?? []).map((season) => ({
                ...season,
                episodes: existingBySeasonNumber.get(season.season_number ?? -1)?.episodes ?? { type: 'idle' },
                images: existingBySeasonNumber.get(season.season_number ?? -1)?.images ?? { type: 'idle' },
                videos: existingBySeasonNumber.get(season.season_number ?? -1)?.videos ?? { type: 'idle' },
            })),
        );
    }

    private upsertSeasonDetails(season: TvSeason): void {
        const seasons = loadedItems(this.get().seasons);
        const existing = seasons.find((item) => item.season_number === season.season_number);
        const nextSeason: TvSeasonState = {
            ...season,
            episodes: { type: 'loaded', value: season.episodes ?? [] },
            images: existing?.images ?? { type: 'idle' },
            videos: existing?.videos ?? { type: 'idle' },
        };

        this.patchState({
            seasons: {
                type: 'loaded',
                value: this.sortSeasons([
                    ...seasons.filter((s) => s.season_number !== season.season_number),
                    nextSeason,
                ]),
            },
        });
    }

    private patchSeasonImages(seasonNumber: number, images: ViewerImage[]): void {
        this.patchSeasonResource(seasonNumber, {
            images: { type: 'loaded', value: images },
        });
    }

    private patchSeasonVideos(seasonNumber: number, videos: Video[]): void {
        this.patchSeasonResource(seasonNumber, {
            videos: { type: 'loaded', value: videos },
        });
    }

    private upsertSeasonStub(seasonNumber: number): void {
        this.patchState((state) => {
            const seasons = loadedItems(state.seasons);
            const existing = seasons.find((season) => season.season_number === seasonNumber);
            const stub: TvSeasonState = {
                ...(existing ?? {
                    season_number: seasonNumber,
                    name: `Season ${seasonNumber}`,
                }),
                episodes: existing?.episodes ?? { type: 'idle' },
                images: existing?.images ?? { type: 'idle' },
                videos: existing?.videos ?? { type: 'idle' },
            };

            return {
                seasons: {
                    type: 'loaded',
                    value: this.sortSeasons([
                        ...seasons.filter((season) => season.season_number !== seasonNumber),
                        stub,
                    ]),
                },
            };
        });
    }

    private patchSeasonResource(seasonNumber: number, patch: Partial<TvSeasonState>): void {
        this.patchState((state) => ({
            seasons: {
                type: 'loaded',
                value: this.sortSeasons(
                    loadedItems(state.seasons).map((season) =>
                        season.season_number === seasonNumber
                            ? {
                                  ...season,
                                  ...patch,
                              }
                            : season,
                    ),
                ),
            },
        }));
    }

    private toSeasonImages(images: TvSeasonImages): ViewerImage[] {
        const language = this.localeStore.language() || 'en';
        return (images.posters ?? [])
            .filter((image) => image.iso_639_1 === language || image.iso_639_1 === 'en')
            .map((image) => ({
                ...image,
                photoType: 'poster',
            }));
    }

    private getSelectedSeasonNumber(tvSeries: TvSeries, selectedSeason?: number): number | undefined {
        const seasonNumbers = this.sortSeasons(
            (tvSeries.seasons ?? []).map((season) => ({
                ...season,
                episodes: { type: 'idle' } as LoadableItems<TvEpisode>,
                images: { type: 'idle' } as LoadableItems<ViewerImage>,
                videos: { type: 'idle' } as LoadableItems<Video>,
            })),
        )
            .map((season) => season.season_number)
            .filter(isDefined);

        if (isDefined(selectedSeason) && seasonNumbers.includes(selectedSeason)) {
            return selectedSeason;
        }

        if (seasonNumbers.includes(1)) {
            return 1;
        }

        return seasonNumbers[0];
    }

    private sortSeasons(seasons: TvSeasonState[]): TvSeasonState[] {
        return [...seasons].sort((a, b) => (a.season_number ?? 0) - (b.season_number ?? 0));
    }

    private readonly fetchSelectedSeasonEffect = this.effect<{
        seriesId: number;
        seasonNumber: number;
    }>((params$) =>
        params$.pipe(switchMap(({ seriesId, seasonNumber }) => this.loadSeasonIfNeeded$(seriesId, seasonNumber))),
    );

    private readonly fetchSelectedSeasonImagesEffect = this.effect<{
        seriesId: number;
        seasonNumber: number;
    }>((params$) =>
        params$.pipe(
            switchMap(({ seriesId, seasonNumber }) => this.loadSeasonImagesIfNeeded$(seriesId, seasonNumber)),
        ),
    );

    private readonly fetchSelectedSeasonVideosEffect = this.effect<{
        seriesId: number;
        seasonNumber: number;
    }>((params$) =>
        params$.pipe(
            switchMap(({ seriesId, seasonNumber }) => this.loadSeasonVideosIfNeeded$(seriesId, seasonNumber)),
        ),
    );
}
