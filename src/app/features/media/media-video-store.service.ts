import { catchError, combineLatest, filter, map, Observable, of, tap } from 'rxjs';

import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';

import { MovieRestControllerService, TvSeriesRestControllerService, Video } from '../../api';
import { API_JSON_OPTIONS, RELATED_COUNT } from '../../constants';
import {
    ConfigStoreService,
    LoadableItems,
    pickBestYoutubeTrailer,
    isDefined,
    loadedValue,
    toYoutubeVideoState,
} from '../../shared';
import { MediaType } from '../../shared';

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
    videosState$ = this.select((state) => toYoutubeVideoState(state.videos));
    private selectedVideoId$ = this.select((state) => state.selectedVideoId);

    allVideos$ = this.videosState$.pipe(map((state) => loadedValue(state)));

    youtubeVideosTotalCount$ = this.allVideos$.pipe(map((videos) => videos.length));

    trailer$: Observable<Video | null> = this.allVideos$.pipe(map((videos) => pickBestYoutubeTrailer(videos)));

    selectedVideo$: Observable<Video | null> = combineLatest([this.allVideos$, this.selectedVideoId$]).pipe(
        map(([videos, selectedVideoId]) => videos.find((video) => video.id === selectedVideoId) ?? null),
    );

    selectedVideoMeta$ = combineLatest([
        this.selectedVideo$,
        this.configStoreService.languages$.pipe(filter(isDefined)),
    ]).pipe(
        map(([video, languages]) => ({
            video,
            languageName:
                video?.iso_639_1 && Array.isArray(languages) && languages.length
                    ? (languages.find((lang) => lang.iso_639_1 === video.iso_639_1)?.english_name ?? video.iso_639_1)
                    : (video?.iso_639_1 ?? ''),
        })),
    );

    relatedVideos$: Observable<Video[]> = combineLatest([this.allVideos$, this.selectedVideoId$]).pipe(
        map(([videos, selectedVideoId]) =>
            videos.filter((video) => !!video.id && !!video.key && video.id !== selectedVideoId).slice(0, RELATED_COUNT),
        ),
    );

    constructor(
        private movieRestControllerService: MovieRestControllerService,
        private tvSeriesRestControllerService: TvSeriesRestControllerService,
        private configStoreService: ConfigStoreService,
    ) {
        super(INITIAL_STATE);
    }

    resetState(): void {
        this.setState(INITIAL_STATE);
    }

    getVideos$(id: number, type: MediaType): Observable<Video[]> {
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
                : this.movieRestControllerService.movieVideos(id, undefined, undefined, undefined, API_JSON_OPTIONS);

        this.patchState({
            videos: { type: 'loading' },
        });

        return videosRequest$.pipe(
            catchError(() => of({ results: [] })),
            tap((videos) => {
                this.patchState({
                    videos: {
                        type: 'loaded',
                        value: videos.results ?? [],
                    },
                });
            }),
            map((videos) => videos.results ?? []),
        );
    }

    setSelectedVideoId(videoId: string): void {
        this.patchState({
            selectedVideoId: videoId,
        });
    }
}
