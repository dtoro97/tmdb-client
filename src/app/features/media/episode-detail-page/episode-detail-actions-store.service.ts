import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';

import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';

import {
    LoadableValue,
    RatingActions,
    RatingVm,
    MediaRatingService,
    TmdbUserAuthService,
    normalizeRatingValue,
} from '../../../shared';

interface EpisodeActionsContext {
    seriesId: number;
    seasonNumber: number;
    episodeNumber: number;
}

interface EpisodeActionsState {
    context: EpisodeActionsContext | null;
    userRating: LoadableValue<number | null>;
    ratingPending: boolean;
}

const INITIAL_STATE: EpisodeActionsState = {
    context: null,
    userRating: { type: 'idle' },
    ratingPending: false,
};

@Injectable()
export class EpisodeDetailActionsStore extends ComponentStore<EpisodeActionsState> implements RatingActions {
    readonly userRatingState$ = this.select((state) => state.userRating);

    readonly ratingVm$ = this.select(
        this.userRatingState$,
        this.select((state) => state.ratingPending),
        (value, pending): RatingVm => ({
            value,
            currentRating: value.type === 'loaded' ? value.value : null,
            pending,
        }),
    );

    constructor(
        private readonly mediaRatingService: MediaRatingService,
        private readonly tmdbUserAuthService: TmdbUserAuthService,
    ) {
        super(INITIAL_STATE);
    }

    setEpisodeContext(
        seriesId: number,
        seasonNumber: number,
        episodeNumber: number,
    ): void {
        const currentContext = this.get().context;

        if (
            currentContext?.seriesId === seriesId &&
            currentContext.seasonNumber === seasonNumber &&
            currentContext.episodeNumber === episodeNumber
        ) {
            return;
        }

        this.patchState({
            context: { seriesId, seasonNumber, episodeNumber },
            userRating: { type: 'loading' },
            ratingPending: false,
        });

        this.fetchEpisodeRating$().subscribe();
    }

    ensureGuestSessionForRating$(): Observable<void> {
        return this.tmdbUserAuthService
            .ensureGuestSession$()
            .pipe(switchMap(() => this.fetchEpisodeRating$()));
    }

    submitUserRating$(value: number): Observable<void> {
        const context = this.requireContext();

        if (context instanceof Error) {
            return throwError(() => context);
        }

        this.patchState({ ratingPending: true });

        return this.mediaRatingService
            .rateEpisode$(
                context.seriesId,
                context.seasonNumber,
                context.episodeNumber,
                value,
            )
            .pipe(
                tap(() => {
                    this.patchState({
                        userRating: {
                            type: 'loaded',
                            value: normalizeRatingValue(value),
                        },
                        ratingPending: false,
                    });
                }),
                map(() => undefined),
                catchError((error) => {
                    this.patchState({ ratingPending: false });
                    return throwError(() => error);
                }),
            );
    }

    deleteUserRating$(): Observable<void> {
        const context = this.requireContext();

        if (context instanceof Error) {
            return throwError(() => context);
        }

        this.patchState({ ratingPending: true });

        return this.mediaRatingService
            .deleteEpisodeRating$(
                context.seriesId,
                context.seasonNumber,
                context.episodeNumber,
            )
            .pipe(
                tap(() => {
                    this.patchState({
                        userRating: { type: 'loaded', value: null },
                        ratingPending: false,
                    });
                }),
                map(() => undefined),
                catchError((error) => {
                    this.patchState({ ratingPending: false });
                    return throwError(() => error);
                }),
            );
    }

    private fetchEpisodeRating$(): Observable<void> {
        const context = this.requireContext();

        if (context instanceof Error) {
            return throwError(() => context);
        }

        return this.mediaRatingService
            .getEpisodeRating$(
                context.seriesId,
                context.seasonNumber,
                context.episodeNumber,
            )
            .pipe(
                tap((rating) => {
                    this.patchState({
                        userRating: { type: 'loaded', value: rating },
                        ratingPending: false,
                    });
                }),
                map(() => undefined),
                catchError(() => {
                    this.patchState({
                        userRating: { type: 'loaded', value: null },
                        ratingPending: false,
                    });
                    return of(undefined);
                }),
            );
    }

    private requireContext(): EpisodeActionsContext | Error {
        const context = this.get().context;

        if (!context) {
            return new Error('No episode action context is available.');
        }

        return context;
    }
}
