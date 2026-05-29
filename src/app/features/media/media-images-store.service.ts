import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { Observable, catchError, filter, map, of, take, tap } from 'rxjs';

import { ImageList } from '../../api';
import { LocaleStoreService, RemoteData, ViewerImage, buildImageLanguageFallback } from '../../shared';
import { MediaApiService } from './media-api.service';
import { MediaTarget, isSameMediaTarget } from './media-target';

interface MediaImagesState {
    readonly target: MediaTarget | null;
    readonly images: RemoteData<ViewerImage[]>;
}

const INITIAL_STATE: MediaImagesState = {
    target: null,
    images: { state: 'notAsked' },
};

@Injectable()
export class MediaImagesStoreService extends ComponentStore<MediaImagesState> {
    readonly imagesState$ = this.select((state) => state.images);

    constructor(
        private readonly localeStore: LocaleStoreService,
        private readonly mediaApiService: MediaApiService,
    ) {
        super(INITIAL_STATE);
    }

    load$(target: MediaTarget): Observable<ViewerImage[]> {
        const state = this.get();

        if (isSameMediaTarget(state.target, target)) {
            if (state.images.state === 'success') {
                return of(state.images.data);
            }

            if (state.images.state === 'loading') {
                return this.imagesReady$();
            }
        }

        this.setState({
            ...INITIAL_STATE,
            target,
            images: { state: 'loading' },
        });

        return this.mediaApiService
            .getImages$(target, buildImageLanguageFallback(), this.localeStore.language())
            .pipe(
                map((images) => this.toViewerImages(images.backdrops ?? [], images.posters ?? [])),
                tap((images) => {
                    this.patchState({ images: { state: 'success', data: images } });
                }),
                catchError(() => {
                    this.patchState({ images: { state: 'success', data: [] } });
                    return of([]);
                }),
            );
    }

    private imagesReady$(): Observable<ViewerImage[]> {
        return this.imagesState$.pipe(
            filter((state): state is Extract<RemoteData<ViewerImage[]>, { state: 'success' }> =>
                state.state === 'success',
            ),
            take(1),
            map((state) => state.data),
        );
    }

    private toViewerImages(
        backdrops: NonNullable<ImageList['backdrops']>,
        posters: NonNullable<ImageList['posters']>,
    ): ViewerImage[] {
        return [
            ...backdrops.map((image) => ({ ...image, photoType: 'backdrop' as const })),
            ...posters.map((image) => ({ ...image, photoType: 'poster' as const })),
        ];
    }
}
