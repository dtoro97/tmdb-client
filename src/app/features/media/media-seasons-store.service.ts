import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, combineLatest, forkJoin, map, of, switchMap, tap } from 'rxjs';

import {
    TvEpisode,
    TvSeason,
    TvSeasonCompact,
    TvSeasonImages,
    TvSeasonRestControllerService,
    TvSeries,
    Video,
    VideoList,
} from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import {
    LocaleStoreService,
    RemoteData,
    VideoCardItem,
    ViewerImage,
    buildImageLanguageFallback,
    hasRemoteData,
    isDefined,
    mapRemoteData,
    remoteData,
    toVideoCardItems,
    toYoutubeVideoState,
} from '../../shared';
import { MediaStoreService } from './media-store.service';
import type { EpisodeListEntry } from './episode-list/episode-list.models';
import { MediaDetails } from './models/media-details.model';

interface SeasonTarget {
    readonly seriesId: number;
    readonly seasonNumber: number;
}

interface SeasonSummary {
    readonly seasonNumber: number;
    readonly name: string;
    readonly episodeCount: number;
    readonly airDate: string | null;
    readonly overview: string;
    readonly posterPath: string | null;
    readonly voteAverage: number | null;
}

type SeasonRecord = Omit<TvSeason | TvSeasonCompact, 'episodes'> & {
    episodes: RemoteData<TvEpisode[]>;
    images: RemoteData<ViewerImage[]>;
    videos: RemoteData<VideoList | null>;
};

interface MediaSeasonsState {
    readonly seriesId: number | null;
    readonly selectedTarget: SeasonTarget | null;
    readonly seasonByKey: Readonly<Record<string, RemoteData<TvSeason | null>>>;
    readonly seasonImagesByKey: Readonly<Record<string, RemoteData<TvSeasonImages | null>>>;
    readonly seasonVideosByKey: Readonly<Record<string, RemoteData<VideoList | null>>>;
}

const INITIAL_STATE: MediaSeasonsState = {
    seriesId: null,
    selectedTarget: null,
    seasonByKey: {},
    seasonImagesByKey: {},
    seasonVideosByKey: {},
};

@Injectable()
export class MediaSeasonsStoreService extends ComponentStore<MediaSeasonsState> {
    private readonly seriesId$ = this.select((state) => state.seriesId);
    private readonly selectedTarget$ = this.select((state) => state.selectedTarget);
    readonly selectedSeasonNumber$ = this.selectedTarget$.pipe(map((target) => target?.seasonNumber ?? null));

    private readonly seriesState$ = this.select(
        this.seriesId$,
        this.mediaStore.mediaState$,
        (seriesId, media): RemoteData<TvSeries | null> => {
            if (!seriesId) {
                return { state: 'notAsked' };
            }

            const seriesState: RemoteData<TvSeries | null> = mapRemoteData(media, (data): TvSeries | null =>
                data && 'seasons' in data && data.id === seriesId ? data : null,
            );

            return hasRemoteData(seriesState) && !seriesState.data ? { state: 'notAsked' } : seriesState;
        },
    );

    private readonly seriesDetails$ = this.mediaStore.mediaDetailsState$.pipe(
        map((state): MediaDetails | null => (state.state === 'success' ? state.data : null)),
    );

    readonly seasonsState$ = this.select(
        this.seriesState$,
        this.selectedTarget$,
        this.select((state) => state.seasonByKey),
        this.select((state) => state.seasonImagesByKey),
        this.select((state) => state.seasonVideosByKey),
        (
            seriesState,
            selectedTarget,
            seasonByKey,
            seasonImagesByKey,
            seasonVideosByKey,
        ): RemoteData<SeasonRecord[]> => {
            if (seriesState.state === 'loading') {
                return { state: 'loading' };
            }

            if (seriesState.state !== 'success' || !seriesState.data) {
                return { state: 'notAsked' };
            }

            return {
                state: 'success',
                data: this.toSeasonRecords(
                    seriesState.data,
                    selectedTarget,
                    seasonByKey,
                    seasonImagesByKey,
                    seasonVideosByKey,
                ),
            };
        },
    );

    private readonly selectedSeasonRecord$ = this.select(
        this.selectedTarget$,
        this.seriesState$,
        this.select((state) => state.seasonByKey),
        this.select((state) => state.seasonImagesByKey),
        this.select((state) => state.seasonVideosByKey),
        (target, seriesState, seasonByKey, seasonImagesByKey, seasonVideosByKey): SeasonRecord | null =>
            this.toSelectedSeasonRecord(
                target,
                seriesState,
                seasonByKey,
                seasonImagesByKey,
                seasonVideosByKey,
            ),
    );

    readonly selectedSeasonSummary$ = combineLatest([this.selectedSeasonNumber$, this.selectedSeasonRecord$]).pipe(
        map(([seasonNumber, season]): SeasonSummary | null =>
            isDefined(seasonNumber) ? this.toSeasonSummary(seasonNumber, season) : null,
        ),
    );

    readonly seasonEpisodesState$ = combineLatest([
        this.seriesId$,
        this.selectedSeasonNumber$,
        this.selectedSeasonRecord$,
    ]).pipe(
        map(([seriesId, selectedSeasonNumber, season]): RemoteData<EpisodeListEntry[]> =>
            this.toEpisodeListState(
                this.toVisibleResourceState(season?.episodes),
                seriesId,
                selectedSeasonNumber,
            ),
        ),
    );

    readonly seasonOptions$ = this.seasonsState$.pipe(
        map((seasonsState) =>
            this.sortSeasons(remoteData(seasonsState, [])).flatMap((season) => {
                if (!isDefined(season.season_number)) {
                    return [];
                }

                return [
                    {
                        label:
                            season.season_number === 0
                                ? (season.name ?? 'Specials')
                                : (season.name ?? `Season ${season.season_number}`),
                        value: season.season_number,
                    },
                ];
            }),
        ),
    );

    readonly seasonImagesState$ = this.selectedSeasonRecord$.pipe(
        map((season): RemoteData<ViewerImage[]> => this.toVisibleResourceState(season?.images)),
    );

    readonly seasonVideosState$ = combineLatest([this.selectedSeasonRecord$, this.seriesDetails$]).pipe(
        map(([season, series]): RemoteData<VideoCardItem[]> => {
            const videos = this.toVisibleResourceState(season?.videos);
            return this.toSeasonVideoItemsState(videos, series);
        }),
    );

    private readonly defaultSeasonEffect = this.effect<TvSeries | null>((series$) =>
        series$.pipe(
            switchMap((series) => {
                const seriesId = series?.id;

                if (!series || typeof seriesId !== 'number' || !Number.isInteger(seriesId)) {
                    return of(undefined);
                }

                const selectedTarget = this.get().selectedTarget;

                if (selectedTarget?.seriesId === seriesId) {
                    return this.loadSeasonResources$(selectedTarget);
                }

                const nextSeasonNumber = this.getSelectedSeasonNumber(series, null);

                if (nextSeasonNumber === null) {
                    return of(undefined);
                }

                return this.loadSeasonResources$({ seriesId, seasonNumber: nextSeasonNumber });
            }),
        ),
    );

    readonly openSeason = this.effect<SeasonTarget>((target$) =>
        target$.pipe(switchMap((target) => this.loadSeasonResources$(target))),
    );

    constructor(
        private readonly localeStore: LocaleStoreService,
        private readonly mediaStore: MediaStoreService,
        private readonly tvSeasonService: TvSeasonRestControllerService,
    ) {
        super(INITIAL_STATE);

        this.defaultSeasonEffect(
            this.seriesState$.pipe(map((state) => (state.state === 'success' ? state.data : null))),
        );
    }

    openSeries(seriesId: number): void {
        const state = this.get();

        if (state.seriesId !== seriesId) {
            this.setState({
                ...INITIAL_STATE,
                seriesId,
            });
            return;
        }

        if (state.selectedTarget) {
            this.patchState({ selectedTarget: null });
        }

        this.openDefaultSeasonFromCurrentMedia(seriesId);
    }

    private selectTarget(target: SeasonTarget): void {
        const state = this.get();

        if (state.seriesId !== target.seriesId) {
            this.setState({
                ...INITIAL_STATE,
                seriesId: target.seriesId,
                selectedTarget: target,
            });
            return;
        }

        if (isSameSeasonTarget(state.selectedTarget, target)) {
            return;
        }

        this.patchState({ selectedTarget: target });
    }

    private loadSeasonResources$(target: SeasonTarget) {
        this.selectTarget(target);

        const state = this.get();
        const key = toSeasonKey(target);
        const seasonState = state.seasonByKey[key] ?? { state: 'notAsked' };
        const imagesState = state.seasonImagesByKey[key] ?? { state: 'notAsked' };
        const videosState = state.seasonVideosByKey[key] ?? { state: 'notAsked' };

        if (seasonState.state === 'success' && imagesState.state === 'success' && videosState.state === 'success') {
            return of(undefined);
        }

        if (seasonState.state === 'loading' || imagesState.state === 'loading' || videosState.state === 'loading') {
            return of(undefined);
        }

        this.patchState((current) => ({
            seasonByKey: {
                ...current.seasonByKey,
                [key]: hasRemoteData(seasonState) ? seasonState : { state: 'loading' },
            },
            seasonImagesByKey: {
                ...current.seasonImagesByKey,
                [key]: hasRemoteData(imagesState) ? imagesState : { state: 'loading' },
            },
            seasonVideosByKey: {
                ...current.seasonVideosByKey,
                [key]: hasRemoteData(videosState) ? videosState : { state: 'loading' },
            },
        }));

        return forkJoin({
            season:
                seasonState.state === 'success'
                    ? of(seasonState.data)
                    : this.fetchSeasonDetails$(target),
            images:
                imagesState.state === 'success'
                    ? of(imagesState.data)
                    : this.fetchSeasonImages$(target),
            videos:
                videosState.state === 'success'
                    ? of(videosState.data)
                    : this.fetchSeasonVideos$(target),
        }).pipe(
            tap(({ season, images, videos }) => {
                this.patchState((current) => ({
                    seasonByKey: {
                        ...current.seasonByKey,
                        [key]: { state: 'success', data: season },
                    },
                    seasonImagesByKey: {
                        ...current.seasonImagesByKey,
                        [key]: { state: 'success', data: images },
                    },
                    seasonVideosByKey: {
                        ...current.seasonVideosByKey,
                        [key]: { state: 'success', data: videos },
                    },
                }));
            }),
            map(() => undefined),
        );
    }

    private openDefaultSeasonFromCurrentMedia(seriesId: number): void {
        const media = this.mediaStore.currentMedia();

        if (!media || !('seasons' in media) || media.id !== seriesId) {
            return;
        }

        const seasonNumber = this.getSelectedSeasonNumber(media, null);

        if (seasonNumber !== null) {
            this.openSeason({ seriesId, seasonNumber });
        }
    }

    private fetchSeasonDetails$(target: SeasonTarget) {
        return this.tvSeasonService
            .tvSeasonDetails(
                target.seriesId,
                target.seasonNumber,
                undefined,
                undefined,
                undefined,
                undefined,
                API_JSON_OPTIONS,
            )
            .pipe(
                catchError(() => {
                    return of(null);
                }),
            );
    }

    private fetchSeasonImages$(target: SeasonTarget) {
        return this.tvSeasonService
            .tvSeasonImages(
                target.seriesId,
                target.seasonNumber,
                buildImageLanguageFallback(),
                this.localeStore.language(),
                undefined,
                undefined,
                API_JSON_OPTIONS,
            )
            .pipe(
                catchError(() => {
                    return of(null);
                }),
            );
    }

    private fetchSeasonVideos$(target: SeasonTarget) {
        return this.tvSeasonService
            .tvSeasonVideos(
                target.seriesId,
                target.seasonNumber,
                undefined,
                undefined,
                undefined,
                undefined,
                API_JSON_OPTIONS,
            )
            .pipe(
                catchError(() => {
                    return of({ results: [] });
                }),
            );
    }

    private toSeasonRecords(
        tvSeries: TvSeries,
        selectedTarget: SeasonTarget | null,
        seasonByKey: Readonly<Record<string, RemoteData<TvSeason | null>>>,
        seasonImagesByKey: Readonly<Record<string, RemoteData<TvSeasonImages | null>>>,
        seasonVideosByKey: Readonly<Record<string, RemoteData<VideoList | null>>>,
    ): SeasonRecord[] {
        return this.sortSeasons(
            (tvSeries.seasons ?? []).map((compact) => {
                const seasonNumber = compact.season_number ?? -1;
                const target: SeasonTarget = {
                    seriesId: tvSeries.id ?? 0,
                    seasonNumber,
                };
                const key = toSeasonKey(target);
                const cachedSeasonState = seasonByKey[key] ?? { state: 'notAsked' };
                const cachedSeasonImagesState = seasonImagesByKey[key] ?? { state: 'notAsked' };
                const cachedSeasonVideosState = seasonVideosByKey[key] ?? { state: 'notAsked' };
                const isActiveSeason =
                    isDefined(selectedTarget) &&
                    selectedTarget.seriesId === tvSeries.id &&
                    selectedTarget.seasonNumber === seasonNumber;

                return this.toSeasonRecord(
                    target,
                    compact,
                    cachedSeasonState,
                    cachedSeasonImagesState,
                    cachedSeasonVideosState,
                    isActiveSeason,
                );
            }),
        );
    }

    private toSelectedSeasonRecord(
        target: SeasonTarget | null,
        seriesState: RemoteData<TvSeries | null>,
        seasonByKey: Readonly<Record<string, RemoteData<TvSeason | null>>>,
        seasonImagesByKey: Readonly<Record<string, RemoteData<TvSeasonImages | null>>>,
        seasonVideosByKey: Readonly<Record<string, RemoteData<VideoList | null>>>,
    ): SeasonRecord | null {
        if (!target) {
            return null;
        }

        const key = toSeasonKey(target);
        const series =
            seriesState.state === 'success' && seriesState.data?.id === target.seriesId ? seriesState.data : null;
        const compact = series?.seasons?.find((season) => season.season_number === target.seasonNumber);

        return this.toSeasonRecord(
            target,
            compact,
            seasonByKey[key] ?? { state: 'notAsked' },
            seasonImagesByKey[key] ?? { state: 'notAsked' },
            seasonVideosByKey[key] ?? { state: 'notAsked' },
            true,
        );
    }

    private toSeasonRecord(
        target: SeasonTarget,
        compact: TvSeasonCompact | undefined,
        seasonState: RemoteData<TvSeason | null>,
        imagesState: RemoteData<TvSeasonImages | null>,
        videosState: RemoteData<VideoList | null>,
        includeResources: boolean,
    ): SeasonRecord {
        const season =
            seasonState.state === 'success' && seasonState.data
                ? seasonState.data
                : (compact ?? {
                      season_number: target.seasonNumber,
                      name: target.seasonNumber === 0 ? 'Specials' : `Season ${target.seasonNumber}`,
                  });

        return {
            ...season,
            episodes: includeResources ? this.toEpisodesState(seasonState) : { state: 'notAsked' },
            images: includeResources ? this.toImagesState(imagesState) : { state: 'notAsked' },
            videos: includeResources ? videosState : { state: 'notAsked' },
        };
    }

    private toEpisodesState(details: RemoteData<TvSeason | null>): RemoteData<TvEpisode[]> {
        return mapRemoteData(details, (season) => season?.episodes ?? []);
    }

    private toEpisodeListState(
        episodes: RemoteData<TvEpisode[]>,
        seriesId: number | null,
        selectedSeasonNumber: number | null,
    ): RemoteData<EpisodeListEntry[]> {
        return mapRemoteData(episodes, (items) => this.toEpisodeListEntries(items, seriesId, selectedSeasonNumber));
    }

    private toEpisodeListEntries(
        episodes: readonly TvEpisode[],
        seriesId: number | null,
        selectedSeasonNumber: number | null,
    ): EpisodeListEntry[] {
        const topRatedEpisode = this.getTopRatedEpisode(episodes);

        return episodes.map((episode) => ({
            id: [
                episode.season_number ?? 'season',
                episode.episode_number ?? 'episode',
                episode.id ?? episode.name ?? 'unknown',
            ].join('-'),
            item: {
                name: episode.name ?? 'Untitled episode',
                subtitle: null,
                overview: episode.overview ?? '',
                stillPath: episode.still_path ?? null,
                seasonNumber: episode.season_number ?? null,
                episodeNumber: episode.episode_number ?? null,
                airDate: episode.air_date ?? null,
                runtime: episode.runtime ?? null,
                voteAverage: episode.vote_average ?? null,
                badges:
                    episode === topRatedEpisode
                        ? [{ label: 'Top rated', variant: 'accent' as const }]
                        : undefined,
                routeCommands: this.toEpisodeRouteCommands(episode, seriesId, selectedSeasonNumber),
            },
        }));
    }

    private toEpisodeRouteCommands(
        episode: TvEpisode,
        seriesId: number | null,
        selectedSeasonNumber: number | null,
    ): readonly (string | number)[] | null {
        const seasonNumber = episode.season_number ?? selectedSeasonNumber;
        const episodeNumber = episode.episode_number;

        if (!isDefined(seriesId) || !isDefined(seasonNumber) || !isDefined(episodeNumber)) {
            return null;
        }

        return ['/title', seriesId, 'tv', 'episodes', seasonNumber, episodeNumber];
    }

    private getTopRatedEpisode(episodes: readonly TvEpisode[]): TvEpisode | null {
        const ratedEpisodes = episodes.filter((episode) => (episode.vote_average ?? 0) > 0);

        if (!ratedEpisodes.length) {
            return null;
        }

        return ratedEpisodes.reduce((best, episode) => {
            const currentRating = episode.vote_average ?? 0;
            const bestRating = best.vote_average ?? 0;

            if (currentRating !== bestRating) {
                return currentRating > bestRating ? episode : best;
            }

            return (episode.vote_count ?? 0) > (best.vote_count ?? 0) ? episode : best;
        });
    }

    private toImagesState(images: RemoteData<TvSeasonImages | null>): RemoteData<ViewerImage[]> {
        return mapRemoteData(images, (data) => this.toSeasonImages(data?.posters ?? []));
    }

    private toSeasonImages(posters: NonNullable<TvSeasonImages['posters']>): ViewerImage[] {
        return posters.map((image) => ({
            ...image,
            photoType: 'poster',
        }));
    }

    private toSeasonVideoItemsState(
        videos: RemoteData<VideoList | null>,
        series: MediaDetails | null,
    ): RemoteData<VideoCardItem[]> {
        return mapRemoteData(videos, (videoList) => {
            const youtubeVideos = toYoutubeVideoState({
                state: 'success',
                data: videoList?.results ?? [],
            });

            return youtubeVideos.state === 'success' && series
                ? toVideoCardItems(youtubeVideos.data, series)
                : [];
        });
    }

    private toSeasonSummary(seasonNumber: number, season: SeasonRecord | null): SeasonSummary {
        if (!season) {
            return {
                seasonNumber,
                name: `Season ${seasonNumber}`,
                episodeCount: 0,
                airDate: null,
                overview: '',
                posterPath: null,
                voteAverage: null,
            };
        }

        const compactCount =
            'episode_count' in season && typeof season.episode_count === 'number' ? season.episode_count : 0;
        const loadedCount = remoteData(season.episodes, []).length;
        const episodeCount =
            season.episodes.state === 'success' ? loadedCount || compactCount || 5 : compactCount || 5;

        return {
            seasonNumber,
            name: season.name ?? (seasonNumber === 0 ? 'Specials' : `Season ${seasonNumber}`),
            episodeCount,
            airDate: season.air_date ?? null,
            overview: season.overview ?? '',
            posterPath: season.poster_path ?? null,
            voteAverage: season.vote_average && season.vote_average > 0 ? season.vote_average : null,
        };
    }

    private getSelectedSeasonNumber(tvSeries: TvSeries, selectedSeason: number | null): number | null {
        const seasonNumbers = [...(tvSeries.seasons ?? [])]
            .map((season) => season.season_number)
            .filter(isDefined)
            .sort((left, right) => left - right);

        if (isDefined(selectedSeason) && seasonNumbers.includes(selectedSeason)) {
            return selectedSeason;
        }

        if (seasonNumbers.includes(1)) {
            return 1;
        }

        return seasonNumbers[0] ?? null;
    }

    private sortSeasons(seasons: SeasonRecord[]): SeasonRecord[] {
        return [...seasons].sort((a, b) => (a.season_number ?? 0) - (b.season_number ?? 0));
    }

    private toVisibleResourceState<T>(state: RemoteData<T> | undefined): RemoteData<T> {
        return !state || state.state === 'notAsked' ? { state: 'loading' } : state;
    }
}

const toSeasonKey = (target: SeasonTarget): string => `${target.seriesId}:${target.seasonNumber}`;

const isSameSeasonTarget = (left: SeasonTarget | null, right: SeasonTarget): boolean =>
    left?.seriesId === right.seriesId && left.seasonNumber === right.seasonNumber;
