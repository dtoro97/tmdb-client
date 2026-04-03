import {
    catchError,
    combineLatest,
    filter,
    forkJoin,
    map,
    Observable,
    of,
    switchMap,
} from 'rxjs';

import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';

import {
    MovieRestControllerService,
    TvSeriesRestControllerService,
    Video,
} from '../../api';
import {
    API_JSON_OPTIONS,
    MEDIUM_LIST_COUNT,
    RELATED_COUNT,
    SEED_COUNT,
} from '../../constants';
import {
    ConfigStoreService,
    LoadableItems,
    MediaType,
    pickBestYoutubeTrailer,
    isDefined,
} from '../../shared';
import { MediaDetailStoreService } from './media-detail-store.service';

export interface SimilarMediaTrailer {
    mediaId: number;
    mediaType: MediaType;
    mediaTitle: string;
    mediaYear: string;
    video: Video;
}

interface MediaVideoState {
    videos: LoadableItems<Video>;
    selectedVideoId: string | null;
}

const INITIAL_STATE: MediaVideoState = {
    videos: { type: 'idle' },
    selectedVideoId: null,
};

@Injectable()
export class MediaVideoStoreService extends ComponentStore<MediaVideoState> {
    videosState$ = this.select((state) => state.videos);
    private selectedVideoId$ = this.select((state) => state.selectedVideoId);

    allVideos$ = this.videosState$.pipe(
        map((state) =>
            this.loadedValue(state).filter((video) => video.site === 'YouTube'),
        ),
    );

    youtubeVideosTotalCount$ = this.allVideos$.pipe(
        map((videos) => videos.length),
    );

    trailer$: Observable<Video | null> = this.allVideos$.pipe(
        map((videos) => pickBestYoutubeTrailer(videos)),
    );

    selectedVideo$: Observable<Video | null> = combineLatest([
        this.allVideos$,
        this.selectedVideoId$,
    ]).pipe(
        map(
            ([videos, selectedVideoId]) =>
                videos.find((video) => video.id === selectedVideoId) ?? null,
        ),
    );

    selectedVideoMeta$ = combineLatest([
        this.selectedVideo$,
        this.configStoreService.languages$.pipe(filter(isDefined)),
    ]).pipe(
        map(([video, languages]) => ({
            video,
            languageName:
                video?.iso_639_1 && Array.isArray(languages) && languages.length
                    ? (languages.find(
                          (lang) => lang.iso_639_1 === video.iso_639_1,
                      )?.english_name ?? video.iso_639_1)
                    : (video?.iso_639_1 ?? ''),
        })),
    );

    relatedVideos$: Observable<Video[]> = combineLatest([
        this.allVideos$,
        this.selectedVideoId$,
    ]).pipe(
        map(([videos, selectedVideoId]) =>
            videos
                .filter(
                    (video) =>
                        !!video.id &&
                        !!video.key &&
                        video.id !== selectedVideoId,
                )
                .slice(0, RELATED_COUNT),
        ),
    );

    similarMediaTrailers$: Observable<SimilarMediaTrailer[]> = combineLatest([
        this.mediaStoreService.recommendations$,
        this.mediaStoreService.mediaDetails$,
    ]).pipe(
        switchMap(([similar, media]) => {
            if (!media) {
                return of([] as SimilarMediaTrailer[]);
            }

            const seeds = similar
                .slice(0, SEED_COUNT)
                .map((item) =>
                    this.toSimilarSeed(
                        item as Record<string, unknown>,
                        media.mediaType,
                    ),
                )
                .filter(
                    (
                        seed,
                    ): seed is {
                        mediaId: number;
                        mediaType: MediaType;
                        mediaTitle: string;
                        mediaYear: string;
                    } => !!seed,
                );

            if (!seeds.length) {
                return of([] as SimilarMediaTrailer[]);
            }

            return forkJoin(
                seeds.map((seed) =>
                    (seed.mediaType === 'movie'
                        ? this.movieRestControllerService.movieVideos(
                              seed.mediaId,
                              undefined,
                              'body',
                              undefined,
                              API_JSON_OPTIONS,
                          )
                        : this.tvSeriesRestControllerService.tvSeriesVideos(
                              seed.mediaId,
                              undefined,
                              undefined,
                              'body',
                              undefined,
                              API_JSON_OPTIONS,
                        )
                    ).pipe(
                        map((response) => ({
                            seed,
                            bestVideo: pickBestYoutubeTrailer(
                                response.results ?? [],
                            ),
                        })),
                        catchError(() =>
                            of({ seed, bestVideo: null as Video | null }),
                        ),
                    ),
                ),
            ).pipe(
                map((rows) =>
                    rows
                        .map(
                            ({
                                seed,
                                bestVideo,
                            }): SimilarMediaTrailer | null => {
                                if (!bestVideo?.id || !bestVideo.key) {
                                    return null;
                                }
                                return {
                                    mediaId: seed.mediaId,
                                    mediaType: seed.mediaType,
                                    mediaTitle: seed.mediaTitle,
                                    mediaYear: seed.mediaYear,
                                    video: bestVideo,
                                };
                            },
                        )
                        .filter((item): item is SimilarMediaTrailer => !!item)
                        .slice(0, MEDIUM_LIST_COUNT),
                ),
            );
        }),
    );

    constructor(
        private movieRestControllerService: MovieRestControllerService,
        private tvSeriesRestControllerService: TvSeriesRestControllerService,
        private configStoreService: ConfigStoreService,
        private mediaStoreService: MediaDetailStoreService,
    ) {
        super(INITIAL_STATE);
    }

    resetState(): void {
        this.setState(INITIAL_STATE);
    }

    getVideos$(id: number, type: MediaType): Observable<void> {
        const videosRequest$ =
            type === 'tv'
                ? this.tvSeriesRestControllerService.tvSeriesVideos(
                      id,
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      API_JSON_OPTIONS,
                  )
                : this.movieRestControllerService.movieVideos(
                      id,
                      undefined,
                      undefined,
                      undefined,
                      API_JSON_OPTIONS,
                  );

        this.patchState({
            videos: { type: 'loading' },
            selectedVideoId: null,
        });

        return videosRequest$.pipe(
            catchError(() => of({ results: [] })),
            map((videos) => {
                this.patchState({
                    videos: {
                        type: 'loaded',
                        value: videos.results ?? [],
                    },
                });
                return undefined;
            }),
        );
    }

    setSelectedVideoId(videoId: string): void {
        this.patchState({
            selectedVideoId: videoId,
        });
    }

    private loadedValue<T>(state: LoadableItems<T>): T[] {
        return state.type === 'loaded' ? state.value : [];
    }

    private toSimilarSeed(
        item: Record<string, unknown>,
        mediaType: MediaType,
    ): {
        mediaId: number;
        mediaType: MediaType;
        mediaTitle: string;
        mediaYear: string;
    } | null {
        const mediaId = Number(item['id'] ?? 0);
        if (!mediaId) {
            return null;
        }

        const title =
            mediaType === 'movie'
                ? String(item['title'] ?? '')
                : String(item['name'] ?? '');
        const rawDate =
            mediaType === 'movie'
                ? String(item['release_date'] ?? '')
                : String(item['first_air_date'] ?? '');

        return {
            mediaId,
            mediaType,
            mediaTitle: title,
            mediaYear: rawDate ? rawDate.slice(0, 4) : '',
        };
    }
}
