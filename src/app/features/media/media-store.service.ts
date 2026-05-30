import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { Observable, catchError, filter, map, of, switchMap, take, tap } from 'rxjs';

import { ExternalIds, Movie, TvExternalIds, TvSeries } from '../../api';
import {
    ConfigStoreService,
    ExternalLinks,
    RemoteData,
    buildExternalLinks,
    isDefined,
    mapRemoteData,
} from '../../shared';
import { toMediaDetails } from './mappers/media-details.mapper';
import { MediaApiService } from './media-api.service';
import { MediaTarget, isSameMediaTarget } from './media-target';
import { MediaDetails } from './models/media-details.model';

type MediaResponse = (Movie | TvSeries) & {
    readonly external_ids?: ExternalIds | TvExternalIds;
};

interface MediaState {
    readonly target: MediaTarget | null;
    readonly media: RemoteData<MediaResponse | null>;
}

const INITIAL_STATE: MediaState = {
    target: null,
    media: { state: 'notAsked' },
};

@Injectable()
export class MediaStoreService extends ComponentStore<MediaState> {
    private readonly target$ = this.select((state) => state.target);

    readonly mediaState$ = this.select((state) => state.media);

    readonly mediaDetailsState$ = this.select(
        this.target$,
        this.mediaState$,
        (target, media): RemoteData<MediaDetails | null> => this.toMediaDetailsState(media, target),
    );

    readonly media$ = this.mediaState$.pipe(
        map((media): MediaResponse | null => (media.state === 'success' ? media.data : null)),
    );

    readonly externalLinks$ = this.media$.pipe(map((media) => this.toExternalLinks(media)));

    readonly title$ = this.mediaDetailsState$.pipe(
        map((state) => (state.state === 'success' ? state.data?.title : null)),
        filter(isDefined),
    );

    readonly open = this.effect<MediaTarget>((target$) => target$.pipe(switchMap((target) => this.load$(target))));

    constructor(
        private readonly configStore: ConfigStoreService,
        private readonly mediaApiService: MediaApiService,
    ) {
        super(INITIAL_STATE);
    }

    load$(target: MediaTarget): Observable<MediaDetails | null> {
        const state = this.get();

        if (isSameMediaTarget(state.target, target)) {
            if (state.media.state === 'success') {
                return of(this.toMediaDetails(state.media.data, target));
            }

            if (state.media.state === 'loading') {
                return this.mediaReady$();
            }
        }

        this.setState({
            ...INITIAL_STATE,
            target,
            media: { state: 'loading' },
        });

        return this.mediaApiService.getDetails$(target).pipe(
            tap((media) => {
                this.patchState({ media: { state: 'success', data: media } });
            }),
            map((media) => this.toMediaDetails(media, target)),
            catchError(() => {
                this.patchState({ media: { state: 'success', data: null } });
                return of(null);
            }),
        );
    }

    currentMedia(): MediaResponse | null {
        const media = this.get().media;
        return media.state === 'success' ? media.data : null;
    }

    private mediaReady$(): Observable<MediaDetails | null> {
        return this.mediaDetailsState$.pipe(
            filter((state): state is Extract<RemoteData<MediaDetails | null>, { state: 'success' }> =>
                state.state === 'success',
            ),
            take(1),
            map((state) => state.data),
        );
    }

    private toMediaDetailsState(
        media: RemoteData<MediaResponse | null>,
        target: MediaTarget | null,
    ): RemoteData<MediaDetails | null> {
        if (!target) {
            return { state: 'notAsked' };
        }

        return mapRemoteData(media, (data) => this.toMediaDetails(data, target));
    }

    private toMediaDetails(media: MediaResponse | null, target: MediaTarget): MediaDetails | null {
        return media ? toMediaDetails(media, target.type, [...this.configStore.languages()]) : null;
    }

    private toExternalLinks(media: MediaResponse | null): ExternalLinks | null {
        return media
            ? buildExternalLinks({
                  links: media.external_ids,
                  homepage: media.homepage,
                  imdbType: 'title',
              })
            : null;
    }
}
