import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, catchError, filter, forkJoin, map, of, take, tap } from 'rxjs';

import { API_JSON_OPTIONS, TRAILERS_PAGE_SEED_COUNT } from '../../constants';
import {
    DiscoverRestControllerService,
    MovieListItem,
    MovieRestControllerService,
    TrendingRestControllerService,
    TvSeriesListItem,
    TvSeriesRestControllerService,
    Video,
} from '../../api';
import type { MediaType } from '../../shared';
import {
    buildYoutubeWatchUrl,
    isDefined,
    LoadableValue,
    LocaleStoreService,
    pickBestYoutubeTrailer,
    shuffle,
    toVideoTrailerSeedItem,
    VideoCardItem,
    VideoTrailerSeedItem,
} from '../../shared';

interface TrailerDataState {
    videoCache: Record<string, LoadableValue<Video[]>>;
}

@Injectable({ providedIn: 'root' })
export class TrailerDataStoreService extends ComponentStore<TrailerDataState> {
    private readonly opts = API_JSON_OPTIONS;

    constructor(
        private readonly discoverService: DiscoverRestControllerService,
        private readonly trendingService: TrendingRestControllerService,
        private readonly movieService: MovieRestControllerService,
        private readonly tvService: TvSeriesRestControllerService,
        private readonly localeStore: LocaleStoreService,
    ) {
        super({ videoCache: {} });
    }

    getTrendingTrailerSeeds$(): Observable<readonly VideoTrailerSeedItem[]> {
        return forkJoin({
            trendingMovies: this.trendingService.trendingMovies('week', undefined, 'body', undefined, this.opts),
            trendingTv: this.trendingService.trendingTv('week', undefined, 'body', undefined, this.opts),
        }).pipe(
            map(({ trendingMovies, trendingTv }) =>
                this.getVideoTrailerSeeds(trendingMovies.results ?? [], trendingTv.results ?? []),
            ),
            catchError(() => of([] as readonly VideoTrailerSeedItem[])),
        );
    }

    loadVideoCardsForSeeds$(seeds: readonly VideoTrailerSeedItem[]): Observable<VideoCardItem[]> {
        if (!seeds.length) {
            return of([]);
        }

        return forkJoin(
            seeds.map((seed) =>
                this.getVideosForMedia$(seed.mediaId, seed.mediaType).pipe(
                    map((videos) => this.toVideoCardItem(seed, pickBestYoutubeTrailer(videos))),
                ),
            ),
        ).pipe(map((items) => shuffle(items.filter(isDefined))));
    }

    discoverStreamingTvByProviderId$(providerId: number): Observable<{ results?: TvSeriesListItem[] }> {
        return this.discoverService.discoverTv(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            undefined,
            undefined,
            1,
            undefined,
            'popularity.desc',
            undefined,
            undefined,
            undefined,
            200,
            undefined,
            this.localeStore.region(),
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'flatrate',
            `${providerId}`,
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

    private getVideosForMedia$(mediaId: number, mediaType: MediaType): Observable<Video[]> {
        const cacheKey = `${mediaType}:${mediaId}`;
        const cached = this.get().videoCache[cacheKey];

        if (cached?.type === 'loaded') {
            return of(cached.value);
        }

        if (cached?.type === 'loading') {
            return this.select((state) => state.videoCache[cacheKey]).pipe(
                filter((entry) => !!entry && entry.type === 'loaded'),
                take(1),
                map((entry) => entry.value),
            );
        }

        this.patchState((state) => ({
            videoCache: {
                ...state.videoCache,
                [cacheKey]: { type: 'loading' },
            },
        }));

        return this.fetchVideosForMedia$(mediaId, mediaType).pipe(
            tap((videos) =>
                this.patchState((state) => ({
                    videoCache: {
                        ...state.videoCache,
                        [cacheKey]: { type: 'loaded', value: videos },
                    },
                })),
            ),
        );
    }

    private fetchVideosForMedia$(mediaId: number, mediaType: MediaType): Observable<Video[]> {
        return (
            mediaType === 'movie'
                ? this.movieService.movieVideos(mediaId, undefined, 'body', undefined, this.opts)
                : this.tvService.tvSeriesVideos(mediaId, undefined, undefined, 'body', undefined, this.opts)
        ).pipe(
            map((response) => response.results ?? []),
            catchError(() => of([] as Video[])),
        );
    }

    private getVideoTrailerSeeds(
        movies: readonly MovieListItem[],
        tvSeries: readonly TvSeriesListItem[],
    ): VideoTrailerSeedItem[] {
        return shuffle([
            ...movies.map((movie) => toVideoTrailerSeedItem(movie, 'movie')),
            ...tvSeries.map((tv) => toVideoTrailerSeedItem(tv, 'tv')),
        ])
            .filter((seed) => seed.mediaId > 0)
            .slice(0, TRAILERS_PAGE_SEED_COUNT);
    }

    private toVideoCardItem(seed: VideoTrailerSeedItem, video: Video | null): VideoCardItem | null {
        if (!video?.id || !video.key) {
            return null;
        }

        const videoName = video.name ?? seed.mediaTitle;

        return {
            ...seed,
            video: {
                ...video,
                type: undefined,
            },
            videoId: video.id,
            videoKey: video.key,
            videoName,
            videoPublishedAt: video.published_at,
            mediaLink: ['/title', seed.mediaId, seed.mediaType],
            openVideoLabel: `Open video: ${videoName}`,
            videoUrl: buildYoutubeWatchUrl(video.key),
        };
    }
}
