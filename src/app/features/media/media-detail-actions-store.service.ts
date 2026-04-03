import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';

import {
    catchError,
    forkJoin,
    map,
    Observable,
    of,
    switchMap,
    tap,
    throwError,
} from 'rxjs';

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

interface MediaActionsContext {
    id: number;
    type: Extract<MediaType, 'movie' | 'tv'>;
}

interface MediaActionsState {
    context: MediaActionsContext | null;
    userRating: LoadableValue<number | null>;
    ratingPending: boolean;
    watchlistState: LoadableValue<boolean>;
    favoriteState: LoadableValue<boolean>;
}

export interface MediaActionsListVm {
    isInWatchlist: boolean;
    isFavorite: boolean;
    pending: boolean;
    watchlistLabel: string;
    favoriteLabel: string;
}

const INITIAL_STATE: MediaActionsState = {
    context: null,
    userRating: { type: 'idle' },
    ratingPending: false,
    watchlistState: { type: 'idle' },
    favoriteState: { type: 'idle' },
};

@Injectable()
export class MediaDetailActionsStore extends ComponentStore<MediaActionsState> implements RatingActions {
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
        (watchlistState, favoriteState): MediaActionsListVm => ({
            isInWatchlist:
                watchlistState.type === 'loaded' ? watchlistState.value : false,
            isFavorite:
                favoriteState.type === 'loaded' ? favoriteState.value : false,
            pending:
                watchlistState.type === 'loading' ||
                favoriteState.type === 'loading',
            watchlistLabel:
                watchlistState.type === 'loaded' && watchlistState.value
                    ? 'On Watchlist'
                    : 'Add to Watchlist',
            favoriteLabel:
                favoriteState.type === 'loaded' && favoriteState.value
                    ? 'Favorited'
                    : 'Add to Favorites',
        }),
    );

    private readonly loadContextEffect = this.effect<MediaActionsContext>(
        (context$) =>
            context$.pipe(
                tap((context) => {
                    this.patchState({
                        context,
                        userRating: { type: 'loading' },
                        ratingPending: false,
                        watchlistState: { type: 'loading' },
                        favoriteState: { type: 'loading' },
                    });
                }),
                switchMap((context) =>
                    forkJoin([
                        this.fetchUserRating$(context),
                        this.fetchWatchlistState$(context),
                        this.fetchFavoriteState$(context),
                    ]),
                ),
            ),
    );

    constructor(
        private readonly tmdbListService: TmdbListService,
        private readonly mediaRatingService: MediaRatingService,
        private readonly tmdbUserAuthService: TmdbUserAuthService,
    ) {
        super(INITIAL_STATE);
    }

    resetState(): void {
        this.setState(INITIAL_STATE);
    }

    setMediaContext(
        id: number,
        type: Extract<MediaType, 'movie' | 'tv'>,
    ): void {
        const currentContext = this.get().context;

        if (currentContext?.id === id && currentContext.type === type) {
            return;
        }

        this.loadContextEffect(of({ id, type }));
    }

    ensureGuestSessionForRating$(): Observable<void> {
        return this.tmdbUserAuthService
            .ensureGuestSession$()
            .pipe(switchMap(() => this.reloadUserRating$()));
    }

    submitUserRating$(value: number): Observable<void> {
        const context = this.requireContext();

        if (context instanceof Error) {
            return throwError(() => context);
        }
        this.patchState({ ratingPending: true });

        return this.mediaRatingService
            .rateMedia$(context.id, context.type, value)
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
            .deleteMediaRating$(context.id, context.type)
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

    toggleWatchlist$(): Observable<void> {
        const context = this.requireContext();

        if (context instanceof Error) {
            return throwError(() => context);
        }

        const currentState = this.get().watchlistState;
        const previousValue =
            currentState.type === 'loaded' ? currentState.value : false;
        const nextValue = !previousValue;

        this.patchState({ watchlistState: { type: 'loading' } });

        return this.tmdbListService
            .updateWatchlist$(context.id, context.type, nextValue)
            .pipe(
                tap((result) => {
                    this.patchState({
                        watchlistState: { type: 'loaded', value: result },
                    });
                }),
                map(() => undefined),
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

    toggleFavorite$(): Observable<void> {
        const context = this.requireContext();

        if (context instanceof Error) {
            return throwError(() => context);
        }

        const currentState = this.get().favoriteState;
        const previousValue =
            currentState.type === 'loaded' ? currentState.value : false;
        const nextValue = !previousValue;

        this.patchState({ favoriteState: { type: 'loading' } });

        return this.tmdbListService
            .updateFavorite$(context.id, context.type, nextValue)
            .pipe(
                tap((result) => {
                    this.patchState({
                        favoriteState: { type: 'loaded', value: result },
                    });
                }),
                map(() => undefined),
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

    addToList$(listId: number): Observable<void> {
        const context = this.requireContext();

        if (context instanceof Error) {
            return throwError(() => context);
        }

        return this.tmdbListService.addToList$(listId, context.id);
    }

    private reloadUserRating$(): Observable<void> {
        const context = this.requireContext();

        if (context instanceof Error) {
            return throwError(() => context);
        }

        return this.fetchUserRating$(context);
    }

    private fetchUserRating$(context: MediaActionsContext): Observable<void> {
        return this.mediaRatingService
            .getMediaRating$(context.id, context.type)
            .pipe(
                tap((rating) => {
                    this.patchState({
                        userRating: { type: 'loaded', value: rating },
                    });
                }),
                map(() => undefined),
                catchError(() => {
                    this.patchState({
                        userRating: { type: 'loaded', value: null },
                    });
                    return of(undefined);
                }),
            );
    }

    private fetchWatchlistState$(
        context: MediaActionsContext,
    ): Observable<void> {
        return this.tmdbListService
            .getWatchlistState$(context.id, context.type)
            .pipe(
                tap((watchlist) => {
                    this.patchState({
                        watchlistState: { type: 'loaded', value: watchlist },
                    });
                }),
                map(() => undefined),
                catchError(() => {
                    this.patchState({
                        watchlistState: { type: 'loaded', value: false },
                    });
                    return of(undefined);
                }),
            );
    }

    private fetchFavoriteState$(
        context: MediaActionsContext,
    ): Observable<void> {
        return this.tmdbListService
            .getFavoriteState$(context.id, context.type)
            .pipe(
                tap((favorite) => {
                    this.patchState({
                        favoriteState: { type: 'loaded', value: favorite },
                    });
                }),
                map(() => undefined),
                catchError(() => {
                    this.patchState({
                        favoriteState: { type: 'loaded', value: false },
                    });
                    return of(undefined);
                }),
            );
    }

    private requireContext(): MediaActionsContext | Error {
        const context = this.get().context;

        if (!context) {
            return new Error('No media action context is available.');
        }

        return context;
    }
}
