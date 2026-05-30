import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, catchError, filter, forkJoin, map, of, switchMap, take, tap } from 'rxjs';

import { API_JSON_OPTIONS, TRAILERS_PAGE_SEED_COUNT } from '../../constants';
import {
    DiscoverRestControllerService,
    MovieListItem,
    MovieRestControllerService,
    MultiListItem,
    TrendingRestControllerService,
    TvSeasonCompact,
    TvSeasonRestControllerService,
    TvSeriesListItem,
    TvSeriesRestControllerService,
    Video,
} from '../../api';
import type { MediaType } from '../../shared';
import {
    buildYoutubeThumbnailUrl,
    buildYoutubeWatchUrl,
    isDefined,
    RemoteData,
    pickBestYoutubeTrailer,
    getISODate,
    toTmdbDiscoverSort,
    toVideoTrailerSeedItem,
    VideoCardItem,
    VideoTrailerSeedItem,
} from '../../shared';

export type TrailerFeedType = 'trending' | 'new';

const TRAILER_CONTENT_REGION = 'US';
const TRAILER_VIDEO_LANGUAGE = 'en';

export interface TrailerVideoCardItem extends VideoCardItem {
    mediaId: number;
    mediaType: MediaType;
    mediaTitle: string;
    mediaYear: string;
    mediaOverview: string;
    backdropPath: string | null;
    videoUrl: string;
}

interface TrailerDataState {
    videoCache: Record<string, RemoteData<Video[]>>;
}

@Injectable({ providedIn: 'root' })
export class TrailerDataStoreService extends ComponentStore<TrailerDataState> {
    private readonly opts = API_JSON_OPTIONS;

    constructor(
        private readonly discoverService: DiscoverRestControllerService,
        private readonly movieService: MovieRestControllerService,
        private readonly trendingService: TrendingRestControllerService,
        private readonly tvSeasonService: TvSeasonRestControllerService,
        private readonly tvService: TvSeriesRestControllerService,
    ) {
        super({ videoCache: {} });
    }

    getTrailerSeeds$(feedType: TrailerFeedType): Observable<readonly VideoTrailerSeedItem[]> {
        if (feedType === 'trending') {
            return this.getTrendingTrailerSeeds$();
        }

        return this.getNewTrailerSeeds$();
    }

    private getTrendingTrailerSeeds$(): Observable<readonly VideoTrailerSeedItem[]> {
        return this.trendingService.trendingAll('day', undefined, 'body', undefined, this.opts).pipe(
            map((response) => this.toTrendingTrailerSeeds(response.results ?? [])),
            catchError(() => of([] as readonly VideoTrailerSeedItem[])),
        );
    }

    private getNewTrailerSeeds$(): Observable<readonly VideoTrailerSeedItem[]> {
        const start = getISODate(-30);
        const end = getISODate(30);

        return forkJoin({
            movies: this.discoverReleaseWindowMovies$(start, end),
            tv: this.discoverReleaseWindowTv$(start, end),
        }).pipe(
            map(({ movies, tv }) =>
                this.toNewTrailerSeeds(movies.results ?? [], tv.results ?? []),
            ),
            catchError(() => of([] as readonly VideoTrailerSeedItem[])),
        );
    }

    loadVideoCardsForSeeds$(seeds: readonly VideoTrailerSeedItem[]): Observable<TrailerVideoCardItem[]> {
        if (!seeds.length) {
            return of([]);
        }

        return forkJoin(
            seeds.map((seed) =>
                this.getVideosForMedia$(seed.mediaId, seed.mediaType).pipe(
                    map((videos) =>
                        this.toVideoCardItem(
                            seed,
                            pickBestYoutubeTrailer(videos, TRAILER_VIDEO_LANGUAGE),
                        ),
                    ),
                ),
            ),
        ).pipe(map((items) => items.filter(isDefined)));
    }

    private getVideosForMedia$(mediaId: number, mediaType: MediaType): Observable<Video[]> {
        const cacheKey = `${mediaType}:${mediaId}`;
        const cached = this.get().videoCache[cacheKey];

        if (cached?.state === 'success') {
            return of(cached.data);
        }

        if (cached?.state === 'loading') {
            return this.select((state) => state.videoCache[cacheKey]).pipe(
                filter((entry) => isDefined(entry) && entry.state === 'success'),
                take(1),
                map((entry) => entry.data),
            );
        }

        this.patchState((state) => ({
            videoCache: {
                ...state.videoCache,
                [cacheKey]: { state: 'loading' },
            },
        }));

        return this.fetchVideosForMedia$(mediaId, mediaType).pipe(
            tap((videos) =>
                this.patchState((state) => ({
                    videoCache: {
                        ...state.videoCache,
                        [cacheKey]: { state: 'success', data: videos },
                    },
                })),
            ),
        );
    }

    private fetchVideosForMedia$(mediaId: number, mediaType: MediaType): Observable<Video[]> {
        return mediaType === 'movie'
            ? this.fetchMovieVideos$(mediaId)
            : this.fetchTvVideos$(mediaId);
    }

    private fetchMovieVideos$(mediaId: number): Observable<Video[]> {
        return this.movieService.movieVideos(mediaId, undefined, 'body', undefined, this.opts).pipe(
            map((response) => response.results ?? []),
            catchError(() => of([] as Video[])),
        );
    }

    private fetchTvVideos$(seriesId: number): Observable<Video[]> {
        return this.tvService.tvSeriesDetails(
            seriesId,
            undefined,
            undefined,
            undefined,
            undefined,
            'body',
            undefined,
            this.opts,
        ).pipe(
            map((series) => this.getLatestSeasonNumber(series.seasons ?? [])),
            switchMap((seasonNumber) => {
                if (!seasonNumber) {
                    return this.fetchTvSeriesVideos$(seriesId);
                }

                return this.fetchTvSeasonVideos$(seriesId, seasonNumber).pipe(
                    switchMap((seasonVideos) => {
                        const seasonTrailer = pickBestYoutubeTrailer(
                            seasonVideos,
                            TRAILER_VIDEO_LANGUAGE,
                            { requirePreferredLanguage: true },
                        );

                        return seasonTrailer
                            ? of([seasonTrailer])
                            : this.fetchTvSeriesVideos$(seriesId);
                    }),
                );
            }),
            catchError(() => this.fetchTvSeriesVideos$(seriesId)),
        );
    }

    private fetchTvSeriesVideos$(seriesId: number): Observable<Video[]> {
        return this.tvService.tvSeriesVideos(seriesId, undefined, undefined, 'body', undefined, this.opts).pipe(
            map((response) => response.results ?? []),
            catchError(() => of([] as Video[])),
        );
    }

    private fetchTvSeasonVideos$(seriesId: number, seasonNumber: number): Observable<Video[]> {
        return this.tvSeasonService
            .tvSeasonVideos(seriesId, seasonNumber, undefined, undefined, 'body', undefined, this.opts)
            .pipe(
                map((response) => response.results ?? []),
                catchError(() => of([] as Video[])),
            );
    }

    private discoverReleaseWindowMovies$(start: string, end: string) {
        const region = TRAILER_CONTENT_REGION;

        return this.discoverService.discoverMovie(
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            false,
            undefined,
            1,
            undefined,
            start,
            end,
            region,
            undefined,
            undefined,
            toTmdbDiscoverSort('movie', 'popularity', 'desc'),
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'body',
            undefined,
            this.opts,
        );
    }

    private discoverReleaseWindowTv$(start: string, end: string) {
        return this.discoverService.discoverTv(
            undefined,
            undefined,
            undefined,
            start,
            end,
            false,
            false,
            undefined,
            1,
            undefined,
            toTmdbDiscoverSort('tv', 'popularity', 'desc'),
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'body',
            undefined,
            this.opts,
        );
    }

    private toTrendingTrailerSeeds(
        items: readonly MultiListItem[],
    ): VideoTrailerSeedItem[] {
        return items
            .filter(
                (item): item is MultiListItem & { media_type: 'movie' | 'tv' } =>
                    item.media_type === 'movie' || item.media_type === 'tv',
            )
            .map((item) => toVideoTrailerSeedItem(item, item.media_type))
            .filter((seed) => seed.mediaId > 0)
            .slice(0, TRAILERS_PAGE_SEED_COUNT);
    }

    private toNewTrailerSeeds(
        movies: readonly MovieListItem[],
        tvSeries: readonly TvSeriesListItem[],
    ): VideoTrailerSeedItem[] {
        return [
            ...movies.map((movie) => ({
                seed: toVideoTrailerSeedItem(movie, 'movie'),
                popularity: movie.popularity ?? 0,
            })),
            ...tvSeries.map((tv) => ({
                seed: toVideoTrailerSeedItem(tv, 'tv'),
                popularity: tv.popularity ?? 0,
            })),
        ]
            .filter((item) => item.seed.mediaId > 0)
            .sort((left, right) => right.popularity - left.popularity)
            .map((item) => item.seed)
            .slice(0, TRAILERS_PAGE_SEED_COUNT);
    }

    private getLatestSeasonNumber(seasons: readonly TvSeasonCompact[]): number | null {
        return seasons.reduce<number | null>((latestSeasonNumber, season) => {
            const seasonNumber = season.season_number ?? 0;

            if (seasonNumber <= 0) {
                return latestSeasonNumber;
            }

            return latestSeasonNumber === null || seasonNumber > latestSeasonNumber
                ? seasonNumber
                : latestSeasonNumber;
        }, null);
    }

    private toVideoCardItem(seed: VideoTrailerSeedItem, video: Video | null): TrailerVideoCardItem | null {
        if (!video?.id || !video.key) {
            return null;
        }

        const title = seed.mediaTitle || video.name || 'Trailer';
        const videoUrl = buildYoutubeWatchUrl(video.key);

        return {
            id: video.id,
            title,
            titleLink: ['/title', seed.mediaId, seed.mediaType],
            thumbnailUrl: buildYoutubeThumbnailUrl(video.key),
            alt: title,
            openLabel: `Open video: ${title}`,
            publishedAt: video.published_at,
            href: videoUrl,
            mediaId: seed.mediaId,
            mediaType: seed.mediaType,
            mediaTitle: seed.mediaTitle,
            mediaYear: seed.mediaYear,
            mediaOverview: seed.mediaOverview,
            backdropPath: seed.backdropPath,
            videoUrl,
        };
    }
}
