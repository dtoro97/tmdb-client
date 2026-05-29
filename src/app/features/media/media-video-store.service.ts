import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { Observable, catchError, filter, map, of, take, tap } from 'rxjs';

import { Video } from '../../api';
import {
    MediaDetails,
    RemoteData,
    pickBestYoutubeTrailer,
    remoteData,
    toVideoCardItems,
    toYoutubeVideoState,
} from '../../shared';
import { MediaApiService } from './media-api.service';
import { MediaTarget, isSameMediaTarget } from './media-target';
import { MediaStoreService } from './media-store.service';

interface MediaVideoState {
    readonly target: MediaTarget | null;
    readonly videos: RemoteData<Video[]>;
}

const INITIAL_STATE: MediaVideoState = {
    target: null,
    videos: { state: 'notAsked' },
};

@Injectable()
export class MediaVideoStoreService extends ComponentStore<MediaVideoState> {
    readonly videosState$ = this.select((state) => state.videos);

    readonly allVideos$ = this.videosState$.pipe(map((state) => remoteData(state, [])));

    readonly youtubeVideosTotalCount$ = this.allVideos$.pipe(map((videos) => videos.length));

    readonly trailer$: Observable<Video | null> = this.allVideos$.pipe(map((videos) => pickBestYoutubeTrailer(videos)));

    readonly videoItems$ = this.select(
        this.mediaStore.mediaDetailsState$,
        this.allVideos$,
        (mediaState, videos) => this.toVideoItems(videos, mediaState),
    );

    constructor(
        private readonly mediaApiService: MediaApiService,
        private readonly mediaStore: MediaStoreService,
    ) {
        super(INITIAL_STATE);
    }

    load$(target: MediaTarget): Observable<Video[]> {
        const state = this.get();

        if (isSameMediaTarget(state.target, target)) {
            if (state.videos.state === 'success') {
                return of(state.videos.data);
            }

            if (state.videos.state === 'loading') {
                return this.videosReady$();
            }
        }

        this.setState({
            ...INITIAL_STATE,
            target,
            videos: { state: 'loading' },
        });

        return this.mediaApiService.getVideos$(target).pipe(
            map((videos) => this.toYoutubeVideos(videos.results ?? [])),
            tap((videos) => {
                this.patchState({ videos: { state: 'success', data: videos } });
            }),
            catchError(() => {
                this.patchState({ videos: { state: 'success', data: [] } });
                return of([]);
            }),
        );
    }

    private videosReady$(): Observable<Video[]> {
        return this.videosState$.pipe(
            filter(
                (state): state is Extract<RemoteData<Video[]>, { state: 'success' }> =>
                    state.state === 'success',
            ),
            take(1),
            map((state) => state.data),
        );
    }

    private toYoutubeVideos(videos: readonly Video[]): Video[] {
        const state = toYoutubeVideoState({ state: 'success', data: [...videos] });
        return state.state === 'success' ? state.data : [];
    }

    private toVideoItems(videos: readonly Video[], mediaState: RemoteData<MediaDetails | null>) {
        const media = mediaState.state === 'success' ? mediaState.data : null;

        return media ? toVideoCardItems(videos, media) : [];
    }
}
