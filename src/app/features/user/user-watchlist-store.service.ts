import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { map, Observable, of, switchMap, tap } from 'rxjs';

import { AccountRestControllerService } from '../../api';
import { API_JSON_OPTIONS, PAGE_SIZE } from '../../constants';
import {
    CardItem,
    LoadableItems,
    LocaleStoreService,
    MediaListItem,
    SortDirection,
    TmdbUserAccountService,
    UserSessionStoreService,
    loaded,
    mediaListItemToCardItem,
    toMediaListItem,
} from '../../shared';
import {
    combineLoadablePreviewItems,
    loadMorePaged$,
    mapLoadableItems,
} from '../../shared/utils';

type ApiSortBy = 'created_at.asc' | 'created_at.desc';

interface UserWatchlistState {
    watchlistMoviesState: LoadableItems<MediaListItem>;
    watchlistMoviesPage: number;
    watchlistMoviesTotalPages: number;
    watchlistTvState: LoadableItems<MediaListItem>;
    watchlistTvPage: number;
    watchlistTvTotalPages: number;
    watchlistMoviesTotal: number;
    watchlistTvTotal: number;
    sortDirection: SortDirection;
}

export interface UserWatchlistVm {
    readonly watchlistMoviesState: LoadableItems<MediaListItem>;
    readonly watchlistTvState: LoadableItems<MediaListItem>;
    readonly hasWatchlistMovies: boolean;
    readonly hasWatchlistTv: boolean;
    readonly watchlistMoviesHasMore: boolean;
    readonly watchlistTvHasMore: boolean;
    readonly watchlistPreviewCards: LoadableItems<CardItem>;
    readonly watchlistTotal: number;
    readonly sortDirection: SortDirection;
}

const INITIAL_STATE: UserWatchlistState = {
    watchlistMoviesState: { type: 'idle' },
    watchlistMoviesPage: 1,
    watchlistMoviesTotalPages: 1,
    watchlistTvState: { type: 'idle' },
    watchlistTvPage: 1,
    watchlistTvTotalPages: 1,
    watchlistMoviesTotal: 0,
    watchlistTvTotal: 0,
    sortDirection: 'desc',
};

@Injectable()
export class UserWatchlistStore extends ComponentStore<UserWatchlistState> {
    readonly vm$ = this.select((state): UserWatchlistVm => {
        const hasWatchlistMovies =
            state.watchlistMoviesState.type === 'loaded' &&
            state.watchlistMoviesState.value.length > 0;
        const hasWatchlistTv =
            state.watchlistTvState.type === 'loaded' &&
            state.watchlistTvState.value.length > 0;

        return {
            watchlistMoviesState: state.watchlistMoviesState,
            watchlistTvState: state.watchlistTvState,
            hasWatchlistMovies,
            hasWatchlistTv,
            watchlistMoviesHasMore:
                state.watchlistMoviesPage < state.watchlistMoviesTotalPages,
            watchlistTvHasMore:
                state.watchlistTvPage < state.watchlistTvTotalPages,
            watchlistPreviewCards: combineLoadablePreviewItems(
                [
                    mapLoadableItems(
                        state.watchlistMoviesState,
                        mediaListItemToCardItem,
                    ),
                    mapLoadableItems(
                        state.watchlistTvState,
                        mediaListItemToCardItem,
                    ),
                ],
                10,
            ),
            watchlistTotal: state.watchlistMoviesTotal + state.watchlistTvTotal,
            sortDirection: state.sortDirection,
        };
    });

    constructor(
        private readonly accountService: AccountRestControllerService,
        private readonly localeStore: LocaleStoreService,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        super(INITIAL_STATE);
    }

    toggleSortDirection$(): Observable<void> {
        const currentDirection = this.get().sortDirection;
        const nextDirection: SortDirection =
            currentDirection === 'desc' ? 'asc' : 'desc';

        this.patchState({ sortDirection: nextDirection });

        return this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
            switchMap(({ accountId }) =>
                this.load$(
                    this.userSessionStore.sessionId()!,
                    accountId,
                    this.localeStore.language(),
                ),
            ),
        );
    }

    load$(
        sessionId: string,
        accountId: number,
        language: string,
    ): Observable<void> {
        this.patchState({
            watchlistMoviesState: { type: 'loading' },
            watchlistTvState: { type: 'loading' },
        });

        return this.fetchWatchlists$(sessionId, accountId, language);
    }

    loadMoreWatchlistMovies$(): Observable<void> {
        const state = this.get();

        if (state.watchlistMoviesState.type !== 'loaded') {
            return of(undefined);
        }

        return loadMorePaged$({
            currentItems: state.watchlistMoviesState.value,
            currentPage: state.watchlistMoviesPage,
            totalPages: state.watchlistMoviesTotalPages,
            placeholderCount: PAGE_SIZE,
            setLoadingMore: (items) =>
                this.patchState({
                    watchlistMoviesState: {
                        type: 'loading-more',
                        value: items,
                        placeholderCount: PAGE_SIZE,
                    } as LoadableItems<MediaListItem>,
                }),
            fetchPage: (nextPage) =>
                this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
                    switchMap(({ accountId }) =>
                        this.accountService.accountWatchlistMovies(
                            accountId,
                            this.localeStore.language(),
                            nextPage,
                            this.userSessionStore.sessionId()!,
                            this.apiSortBy,
                            'body',
                            false,
                            API_JSON_OPTIONS,
                        ),
                    ),
                    map((result) =>
                        (result.results ?? []).map((item) =>
                            toMediaListItem(item, 'movie', 'year'),
                        ),
                    ),
                ),
            setLoaded: (items, page) =>
                this.patchState({
                    watchlistMoviesState: loaded(items),
                    watchlistMoviesPage: page,
                }),
        });
    }

    loadMoreWatchlistTv$(): Observable<void> {
        const state = this.get();

        if (state.watchlistTvState.type !== 'loaded') {
            return of(undefined);
        }

        return loadMorePaged$({
            currentItems: state.watchlistTvState.value,
            currentPage: state.watchlistTvPage,
            totalPages: state.watchlistTvTotalPages,
            placeholderCount: PAGE_SIZE,
            setLoadingMore: (items) =>
                this.patchState({
                    watchlistTvState: {
                        type: 'loading-more',
                        value: items,
                        placeholderCount: PAGE_SIZE,
                    } as LoadableItems<MediaListItem>,
                }),
            fetchPage: (nextPage) =>
                this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
                    switchMap(({ accountId }) =>
                        this.accountService.accountWatchlistTv(
                            accountId,
                            this.localeStore.language(),
                            nextPage,
                            this.userSessionStore.sessionId()!,
                            this.apiSortBy,
                            'body',
                            false,
                            API_JSON_OPTIONS,
                        ),
                    ),
                    map((result) =>
                        (result.results ?? []).map((item) =>
                            toMediaListItem(item, 'tv', 'year'),
                        ),
                    ),
                ),
            setLoaded: (items, page) =>
                this.patchState({
                    watchlistTvState: loaded(items),
                    watchlistTvPage: page,
                }),
        });
    }

    private get apiSortBy(): ApiSortBy {
        return `created_at.${this.get().sortDirection}`;
    }

    private fetchWatchlists$(
        sessionId: string,
        accountId: number,
        language: string,
    ): Observable<void> {
        return this.accountService
            .accountWatchlistMovies(
                accountId,
                language,
                1,
                sessionId,
                this.apiSortBy,
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(
                switchMap((watchlistMovies) =>
                    this.accountService
                        .accountWatchlistTv(
                            accountId,
                            language,
                            1,
                            sessionId,
                            this.apiSortBy,
                            'body',
                            false,
                            API_JSON_OPTIONS,
                        )
                        .pipe(
                            map((watchlistTv) => ({
                                watchlistMovies,
                                watchlistTv,
                            })),
                        ),
                ),
                tap((result) => {
                    this.patchState({
                        watchlistMoviesState: loaded(
                            (result.watchlistMovies.results ?? []).map((item) =>
                                toMediaListItem(item, 'movie', 'year'),
                            ),
                        ),
                        watchlistMoviesPage: result.watchlistMovies.page ?? 1,
                        watchlistMoviesTotalPages:
                            result.watchlistMovies.total_pages ?? 1,
                        watchlistMoviesTotal:
                            result.watchlistMovies.total_results ?? 0,
                        watchlistTvState: loaded(
                            (result.watchlistTv.results ?? []).map((item) =>
                                toMediaListItem(item, 'tv', 'year'),
                            ),
                        ),
                        watchlistTvPage: result.watchlistTv.page ?? 1,
                        watchlistTvTotalPages:
                            result.watchlistTv.total_pages ?? 1,
                        watchlistTvTotal: result.watchlistTv.total_results ?? 0,
                    });
                }),
                map(() => undefined),
                tap({
                    error: () => {
                        this.patchState({
                            watchlistMoviesState: loaded([]),
                            watchlistTvState: loaded([]),
                        });
                    },
                }),
            );
    }
}
