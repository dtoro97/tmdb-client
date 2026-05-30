import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';

import { Observable, catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';

import { MediaRatingService, RemoteData, TmdbListService, normalizeRatingValue } from '../../shared';
import { type MediaTarget, toMediaKey } from './media-target';

interface MediaActionResource {
    readonly userRating: RemoteData<number | null>;
    readonly ratingPending: boolean;
    readonly watchlistState: RemoteData<boolean>;
    readonly favoriteState: RemoteData<boolean>;
}

interface MediaActionsState {
    readonly target: MediaTarget | null;
    readonly actionsByMediaKey: Readonly<Record<string, MediaActionResource>>;
}

const EMPTY_ACTION_RESOURCE: MediaActionResource = {
    userRating: { state: 'notAsked' },
    ratingPending: false,
    watchlistState: { state: 'notAsked' },
    favoriteState: { state: 'notAsked' },
};

const loadingActionResource = (): MediaActionResource => ({
    userRating: { state: 'loading' },
    ratingPending: false,
    watchlistState: { state: 'loading' },
    favoriteState: { state: 'loading' },
});

const INITIAL_STATE: MediaActionsState = {
    target: null,
    actionsByMediaKey: {},
};

@Injectable()
export class MediaDetailActionsStore extends ComponentStore<MediaActionsState> {
    private readonly target$ = this.select((state) => state.target);

    private readonly activeActions$ = this.select(
        this.target$,
        this.select((state) => state.actionsByMediaKey),
        (target, actionsByMediaKey) => (target ? (actionsByMediaKey[toMediaKey(target)] ?? EMPTY_ACTION_RESOURCE) : EMPTY_ACTION_RESOURCE),
    );

    readonly userRatingState$ = this.activeActions$.pipe(map((actions) => actions.userRating));
    readonly watchlistState$ = this.activeActions$.pipe(map((actions) => actions.watchlistState));
    readonly favoriteState$ = this.activeActions$.pipe(map((actions) => actions.favoriteState));

    readonly ratingVm$ = this.select(
        this.userRatingState$,
        this.activeActions$.pipe(map((actions) => actions.ratingPending)),
        this.target$,
        (value, pending, target) => ({
            currentRating: value.state === 'success' ? value.data : null,
            disabled: target === null || pending || value.state === 'loading',
            loading: value.state === 'loading',
            pending,
        }),
    );

    readonly listActionsVm$ = this.select(
        this.watchlistState$,
        this.favoriteState$,
        (watchlistState, favoriteState) => ({
            isInWatchlist: watchlistState.state === 'success' ? watchlistState.data : false,
            isFavorite: favoriteState.state === 'success' ? favoriteState.data : false,
            pending: watchlistState.state === 'loading' || favoriteState.state === 'loading',
            watchlistLabel:
                watchlistState.state === 'success' && watchlistState.data ? 'On Watchlist' : 'Add to Watchlist',
            favoriteLabel: favoriteState.state === 'success' && favoriteState.data ? 'In favorites' : 'Add to favorites',
        }),
    );

    constructor(
        private readonly mediaRatingService: MediaRatingService,
        private readonly tmdbListService: TmdbListService,
    ) {
        super(INITIAL_STATE);
    }

    updateMedia(target: MediaTarget): void {
        const key = toMediaKey(target);

        this.patchState((state) => ({
            target,
            actionsByMediaKey: {
                ...state.actionsByMediaKey,
                [key]: state.actionsByMediaKey[key] ?? loadingActionResource(),
            },
        }));
        this.fetchMediaActionsEffect(target);
    }

    submitUserRating$(target: MediaTarget, value: number): Observable<unknown> {
        this.patchActionResource(target, { ratingPending: true });

        return this.mediaRatingService.rateMedia$(target.id, target.type, value).pipe(
            tap(() => {
                this.patchActionResource(target, {
                    userRating: {
                        state: 'success',
                        data: normalizeRatingValue(value),
                    },
                    ratingPending: false,
                });
            }),
            catchError((error) => {
                this.patchActionResource(target, { ratingPending: false });
                return throwError(() => error);
            }),
        );
    }

    deleteUserRating$(target: MediaTarget): Observable<unknown> {
        this.patchActionResource(target, { ratingPending: true });

        return this.mediaRatingService.deleteMediaRating$(target.id, target.type).pipe(
            tap(() => {
                this.patchActionResource(target, {
                    userRating: { state: 'success', data: null },
                    ratingPending: false,
                });
            }),
            catchError((error) => {
                this.patchActionResource(target, { ratingPending: false });
                return throwError(() => error);
            }),
        );
    }

    toggleWatchlist$(): Observable<unknown> {
        const state = this.get();
        const target = state.target;

        if (!target) {
            return throwError(() => new Error('No media action context is available.'));
        }

        const currentState = this.getActionResource(state, target).watchlistState;
        const previousValue = currentState.state === 'success' ? currentState.data : false;
        const nextValue = !previousValue;

        this.patchActionResource(target, { watchlistState: { state: 'loading' } });

        return this.tmdbListService.updateWatchlist$(target.id, target.type, nextValue).pipe(
            tap((result) => {
                this.patchActionResource(target, {
                    watchlistState: { state: 'success', data: result },
                });
            }),
            catchError((error) => {
                this.patchActionResource(target, {
                    watchlistState: {
                        state: 'success',
                        data: previousValue,
                    },
                });
                return throwError(() => error);
            }),
        );
    }

    toggleFavorite$(): Observable<unknown> {
        const state = this.get();
        const target = state.target;

        if (!target) {
            return throwError(() => new Error('No media action context is available.'));
        }

        const currentState = this.getActionResource(state, target).favoriteState;
        const previousValue = currentState.state === 'success' ? currentState.data : false;
        const nextValue = !previousValue;

        this.patchActionResource(target, { favoriteState: { state: 'loading' } });

        return this.tmdbListService.updateFavorite$(target.id, target.type, nextValue).pipe(
            tap((result) => {
                this.patchActionResource(target, {
                    favoriteState: { state: 'success', data: result },
                });
            }),
            catchError((error) => {
                this.patchActionResource(target, {
                    favoriteState: {
                        state: 'success',
                        data: previousValue,
                    },
                });
                return throwError(() => error);
            }),
        );
    }

    addToList$(listId: number): Observable<unknown> {
        const target = this.get().target;

        if (!target) {
            return throwError(() => new Error('No media action context is available.'));
        }

        return this.tmdbListService.addToList$(listId, target.id, target.type);
    }

    private readonly fetchMediaActionsEffect = this.effect<MediaTarget>((params$) =>
        params$.pipe(
            switchMap((target) =>
                forkJoin([
                    this.fetchUserRating$(target),
                    this.fetchWatchlistState$(target),
                    this.fetchFavoriteState$(target),
                ]),
            ),
        ),
    );

    private fetchUserRating$(target: MediaTarget) {
        return this.mediaRatingService.getMediaRating$(target.id, target.type).pipe(
            tap((rating) => {
                this.patchActionResource(target, {
                    userRating: { state: 'success', data: rating },
                });
            }),
            catchError(() => {
                this.patchActionResource(target, {
                    userRating: { state: 'success', data: null },
                });
                return of(undefined);
            }),
        );
    }

    private fetchWatchlistState$(target: MediaTarget) {
        return this.tmdbListService.getWatchlistState$(target.id, target.type).pipe(
            tap((watchlist) => {
                this.patchActionResource(target, {
                    watchlistState: { state: 'success', data: watchlist },
                });
            }),
            catchError(() => {
                this.patchActionResource(target, {
                    watchlistState: { state: 'success', data: false },
                });
                return of(undefined);
            }),
        );
    }

    private fetchFavoriteState$(target: MediaTarget) {
        return this.tmdbListService.getFavoriteState$(target.id, target.type).pipe(
            tap((favorite) => {
                this.patchActionResource(target, {
                    favoriteState: { state: 'success', data: favorite },
                });
            }),
            catchError(() => {
                this.patchActionResource(target, {
                    favoriteState: { state: 'success', data: false },
                });
                return of(undefined);
            }),
        );
    }

    private getActionResource(state: MediaActionsState, target: MediaTarget): MediaActionResource {
        return state.actionsByMediaKey[toMediaKey(target)] ?? EMPTY_ACTION_RESOURCE;
    }

    private patchActionResource(target: MediaTarget, patch: Partial<MediaActionResource>): void {
        this.patchState((state) => {
            const key = toMediaKey(target);

            return {
                actionsByMediaKey: {
                    ...state.actionsByMediaKey,
                    [key]: {
                        ...this.getActionResource(state, target),
                        ...patch,
                    },
                },
            };
        });
    }
}
