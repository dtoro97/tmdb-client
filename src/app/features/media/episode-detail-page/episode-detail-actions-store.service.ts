import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';

import { catchError, of, switchMap, tap, throwError } from 'rxjs';

import {
    LoadableValue,
    RatingActions,
    RatingVm,
    MediaRatingService,
    TmdbUserAuthService,
    normalizeRatingValue,
} from '../../../shared';

interface EpisodeActionsState {
    seriesId: number | null;
    seasonNumber: number | null;
    episodeNumber: number | null;
    userRating: LoadableValue<number | null>;
    ratingPending: boolean;
}

const INITIAL_STATE: EpisodeActionsState = {
    seriesId: null,
    seasonNumber: null,
    episodeNumber: null,
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

    setEpisode(seriesId: number, seasonNumber: number, episodeNumber: number): void {
        const state = this.get();

        if (
            state.seriesId === seriesId &&
            state.seasonNumber === seasonNumber &&
            state.episodeNumber === episodeNumber
        ) {
            return;
        }

        this.patchState({
            seriesId,
            seasonNumber,
            episodeNumber,
            userRating: { type: 'loading' },
            ratingPending: false,
        });

        this.fetchEpisodeRating$().subscribe();
    }

    ensureGuestSessionForRating$() {
        return this.tmdbUserAuthService.ensureGuestSession$().pipe(switchMap(() => this.fetchEpisodeRating$()));
    }

    submitUserRating$(value: number) {
        const state = this.get();

        if (state.seriesId === null || state.seasonNumber === null || state.episodeNumber === null) {
            return throwError(() => new Error('No episode action context is available.'));
        }

        this.patchState({ ratingPending: true });

        return this.mediaRatingService
            .rateEpisode$(state.seriesId, state.seasonNumber, state.episodeNumber, value)
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
                catchError((error) => {
                    this.patchState({ ratingPending: false });
                    return throwError(() => error);
                }),
            );
    }

    deleteUserRating$() {
        const state = this.get();

        if (state.seriesId === null || state.seasonNumber === null || state.episodeNumber === null) {
            return throwError(() => new Error('No episode action context is available.'));
        }

        this.patchState({ ratingPending: true });

        return this.mediaRatingService
            .deleteEpisodeRating$(state.seriesId, state.seasonNumber, state.episodeNumber)
            .pipe(
                tap(() => {
                    this.patchState({
                        userRating: { type: 'loaded', value: null },
                        ratingPending: false,
                    });
                }),
                catchError((error) => {
                    this.patchState({ ratingPending: false });
                    return throwError(() => error);
                }),
            );
    }

    private fetchEpisodeRating$() {
        const state = this.get();

        if (state.seriesId === null || state.seasonNumber === null || state.episodeNumber === null) {
            return throwError(() => new Error('No episode action context is available.'));
        }

        return this.mediaRatingService.getEpisodeRating$(state.seriesId, state.seasonNumber, state.episodeNumber).pipe(
            tap((rating) => {
                this.patchState({
                    userRating: { type: 'loaded', value: rating },
                    ratingPending: false,
                });
            }),
            catchError(() => {
                this.patchState({
                    userRating: { type: 'loaded', value: null },
                    ratingPending: false,
                });
                return of(undefined);
            }),
        );
    }
}
