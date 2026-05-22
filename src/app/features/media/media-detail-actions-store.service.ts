import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';

import { Observable, catchError, distinctUntilChanged, filter, forkJoin, of, switchMap, tap, throwError } from 'rxjs';

import {
    LoadableValue,
    RatingActions,
    RatingVm,
    TmdbListService,
    MediaRatingService,
    MediaType,
    normalizeRatingValue,
    TmdbUserAuthService,
} from '../../shared';

interface MediaActionsState {
    mediaId: number | null;
    mediaType: MediaType | null;
    userRating: LoadableValue<number | null>;
    ratingPending: boolean;
    watchlistState: LoadableValue<boolean>;
    favoriteState: LoadableValue<boolean>;
}

const INITIAL_STATE: MediaActionsState = {
    mediaId: null,
    mediaType: null,
    userRating: { type: 'idle' },
    ratingPending: false,
    watchlistState: { type: 'idle' },
    favoriteState: { type: 'idle' },
};

type MediaActionTarget = {
    mediaId: number;
    mediaType: MediaType;
};

@Injectable()
export class MediaDetailActionsStore extends ComponentStore<MediaActionsState> implements RatingActions {
    readonly mediaId$ = this.select((state) => state.mediaId);
    readonly mediaType$ = this.select((state) => state.mediaType);
    readonly userRatingState$ = this.select((state) => state.userRating);
    readonly watchlistState$ = this.select((state) => state.watchlistState);
    readonly favoriteState$ = this.select((state) => state.favoriteState);

    readonly ratingVm$ = this.select(
        this.userRatingState$,
        this.select((state) => state.ratingPending),
        (value, pending): RatingVm => ({
            value,
            currentRating: value.type === 'loaded' ? value.value : null,
            pending,
        }),
    );

    readonly listActionsVm$ = this.select(
        this.watchlistState$,
        this.favoriteState$,
        (watchlistState, favoriteState) => ({
            isInWatchlist: watchlistState.type === 'loaded' ? watchlistState.value : false,
            isFavorite: favoriteState.type === 'loaded' ? favoriteState.value : false,
            pending: watchlistState.type === 'loading' || favoriteState.type === 'loading',
            watchlistLabel:
                watchlistState.type === 'loaded' && watchlistState.value ? 'On Watchlist' : 'Add to Watchlist',
            favoriteLabel: favoriteState.type === 'loaded' && favoriteState.value ? 'Favorited' : 'Add to Favorites',
        }),
    );

    constructor(
        private readonly tmdbListService: TmdbListService,
        private readonly mediaRatingService: MediaRatingService,
        private readonly tmdbUserAuthService: TmdbUserAuthService,
    ) {
        super(INITIAL_STATE);
        this.fetchMediaActionsEffect(
            this.select(this.mediaId$, this.mediaType$, (mediaId, mediaType) =>
                mediaId !== null && mediaType !== null ? { mediaId, mediaType } : null,
            ).pipe(
                filter((payload): payload is MediaActionTarget => payload !== null),
                distinctUntilChanged(
                    (previous, next) => previous.mediaId === next.mediaId && previous.mediaType === next.mediaType,
                ),
            ),
        );
    }

    resetState(): void {
        this.setState(INITIAL_STATE);
    }

    setMedia(id: number, type: MediaType): void {
        const state = this.get();

        if (state.mediaId === id && state.mediaType === type) {
            return;
        }

        this.patchState({
            mediaId: id,
            mediaType: type,
            userRating: { type: 'loading' },
            ratingPending: false,
            watchlistState: { type: 'loading' },
            favoriteState: { type: 'loading' },
        });
    }

    ensureGuestSessionForRating$(): Observable<unknown> {
        return this.tmdbUserAuthService.ensureGuestSession$().pipe(switchMap(() => this.reloadUserRating$()));
    }

    submitUserRating$(value: number): Observable<unknown> {
        const state = this.get();

        if (state.mediaId === null || state.mediaType === null) {
            return throwError(() => new Error('No media action context is available.'));
        }
        this.patchState({ ratingPending: true });

        return this.mediaRatingService.rateMedia$(state.mediaId, state.mediaType, value).pipe(
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

    deleteUserRating$(): Observable<unknown> {
        const state = this.get();

        if (state.mediaId === null || state.mediaType === null) {
            return throwError(() => new Error('No media action context is available.'));
        }

        this.patchState({ ratingPending: true });

        return this.mediaRatingService.deleteMediaRating$(state.mediaId, state.mediaType).pipe(
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

    toggleWatchlist$(): Observable<unknown> {
        const state = this.get();

        if (state.mediaId === null || state.mediaType === null) {
            return throwError(() => new Error('No media action context is available.'));
        }

        const currentState = this.get().watchlistState;
        const previousValue = currentState.type === 'loaded' ? currentState.value : false;
        const nextValue = !previousValue;

        this.patchState({ watchlistState: { type: 'loading' } });

        return this.tmdbListService.updateWatchlist$(state.mediaId, state.mediaType, nextValue).pipe(
            tap((result) => {
                this.patchState({
                    watchlistState: { type: 'loaded', value: result },
                });
            }),
            catchError((error) => {
                this.patchState({
                    watchlistState: {
                        type: 'loaded',
                        value: previousValue,
                    },
                });
                return throwError(() => error);
            }),
        );
    }

    toggleFavorite$(): Observable<unknown> {
        const state = this.get();

        if (state.mediaId === null || state.mediaType === null) {
            return throwError(() => new Error('No media action context is available.'));
        }

        const currentState = this.get().favoriteState;
        const previousValue = currentState.type === 'loaded' ? currentState.value : false;
        const nextValue = !previousValue;

        this.patchState({ favoriteState: { type: 'loading' } });

        return this.tmdbListService.updateFavorite$(state.mediaId, state.mediaType, nextValue).pipe(
            tap((result) => {
                this.patchState({
                    favoriteState: { type: 'loaded', value: result },
                });
            }),
            catchError((error) => {
                this.patchState({
                    favoriteState: {
                        type: 'loaded',
                        value: previousValue,
                    },
                });
                return throwError(() => error);
            }),
        );
    }

    addToList$(listId: number): Observable<unknown> {
        const state = this.get();

        if (state.mediaId === null || state.mediaType === null) {
            return throwError(() => new Error('No media action context is available.'));
        }

        return this.tmdbListService.addToList$(listId, state.mediaId, state.mediaType);
    }

    createListAndAdd$(name: string, description: string): Observable<unknown> {
        const state = this.get();

        if (state.mediaId === null || state.mediaType === null) {
            return throwError(() => new Error('No media action context is available.'));
        }

        return this.tmdbListService.createListAndAdd$(name, description, state.mediaId, state.mediaType);
    }

    private reloadUserRating$() {
        const state = this.get();

        if (state.mediaId === null || state.mediaType === null) {
            return throwError(() => new Error('No media action context is available.'));
        }

        return this.fetchUserRating$(state.mediaId, state.mediaType);
    }

    private readonly fetchMediaActionsEffect = this.effect<MediaActionTarget>((params$) =>
        params$.pipe(
            switchMap(({ mediaId, mediaType }) =>
                forkJoin([
                    this.fetchUserRating$(mediaId, mediaType),
                    this.fetchWatchlistState$(mediaId, mediaType),
                    this.fetchFavoriteState$(mediaId, mediaType),
                ]),
            ),
        ),
    );

    private fetchUserRating$(mediaId: number, mediaType: MediaType) {
        return this.mediaRatingService.getMediaRating$(mediaId, mediaType).pipe(
            tap((rating) => {
                this.patchState({
                    userRating: { type: 'loaded', value: rating },
                });
            }),
            catchError(() => {
                this.patchState({
                    userRating: { type: 'loaded', value: null },
                });
                return of(undefined);
            }),
        );
    }

    private fetchWatchlistState$(mediaId: number, mediaType: MediaType) {
        return this.tmdbListService.getWatchlistState$(mediaId, mediaType).pipe(
            tap((watchlist) => {
                this.patchState({
                    watchlistState: { type: 'loaded', value: watchlist },
                });
            }),
            catchError(() => {
                this.patchState({
                    watchlistState: { type: 'loaded', value: false },
                });
                return of(undefined);
            }),
        );
    }

    private fetchFavoriteState$(mediaId: number, mediaType: MediaType) {
        return this.tmdbListService.getFavoriteState$(mediaId, mediaType).pipe(
            tap((favorite) => {
                this.patchState({
                    favoriteState: { type: 'loaded', value: favorite },
                });
            }),
            catchError(() => {
                this.patchState({
                    favoriteState: { type: 'loaded', value: false },
                });
                return of(undefined);
            }),
        );
    }
}
