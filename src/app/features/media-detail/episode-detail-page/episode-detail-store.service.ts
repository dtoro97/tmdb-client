import {
    catchError,
    EMPTY,
    filter,
    forkJoin,
    Observable,
    tap,
} from 'rxjs';

import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';

import {
    TvEpisode,
    TvEpisodeImages,
    TvEpisodeRestControllerService,
} from '../../../api';
import { isDefined, loader } from '../../../shared';
import { NgxUiLoaderService } from 'ngx-ui-loader';

export interface EpisodeDetailState {
    episode: TvEpisode | undefined;
    images: TvEpisodeImages | undefined;
}

@Injectable()
export class EpisodeDetailStoreService extends ComponentStore<EpisodeDetailState> {
    constructor(
        private tvEpisodeRestControllerService: TvEpisodeRestControllerService,
        private ngxUiLoaderService: NgxUiLoaderService,
    ) {
        super({ episode: undefined, images: undefined });
    }

    readonly episode$ = this.select((state) => state.episode).pipe(
        filter(isDefined),
    );

    readonly stills$ = this.select((state) =>
        (state.images?.stills ?? []).slice(0, 12),
    );

    readonly allStills$ = this.select((state) => state.images?.stills ?? []);

    getEpisodeDetails$(
        seriesId: number,
        seasonNumber: number,
        episodeNumber: number,
    ): Observable<[TvEpisode, TvEpisodeImages]> {
        this.patchState({ episode: undefined, images: undefined });
        return forkJoin([
            this.tvEpisodeRestControllerService.tvEpisodeDetails(
                seriesId,
                seasonNumber,
                episodeNumber,
            ),
            this.tvEpisodeRestControllerService.tvEpisodeImages(
                seriesId,
                seasonNumber,
                episodeNumber,
            ),
        ]).pipe(
            loader(this.ngxUiLoaderService),
            tap(([episode, images]) => {
                this.patchState({ episode, images });
            }),
            catchError(() => EMPTY),
        );
    }
}
