import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { map, Observable, of, switchMap, tap } from 'rxjs';

import { AccountRestControllerService } from '../../api';
import { API_JSON_OPTIONS, PAGE_SIZE } from '../../constants';
import {
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

interface WatchlistBucketState {
    readonly itemsState: LoadableItems<MediaListItem>;
    readonly page: number;
    readonly totalPages: number;
    readonly total: number;
}

interface UserWatchlistState {
    readonly movies: WatchlistBucketState;
    readonly tv: WatchlistBucketState;
    readonly sortDirection: SortDirection;
}

const INITIAL_BUCKET_STATE: WatchlistBucketState = {
    itemsState: { type: 'idle' },
    page: 1,
    totalPages: 1,
    total: 0,
};

const INITIAL_STATE: UserWatchlistState = {
    movies: INITIAL_BUCKET_STATE,
    tv: INITIAL_BUCKET_STATE,
    sortDirection: 'desc',
};

@Injectable()
export class UserWatchlistStore extends ComponentStore<UserWatchlistState> {
    readonly userWatchlistVm$ = this.select((state) => ({
        sortDirection: state.sortDirection,
        watchlistTotal: state.movies.total + state.tv.total,
        watchlistPreviewCards: combineLoadablePreviewItems(
            [
                mapLoadableItems(
                    state.movies.itemsState,
                    mediaListItemToCardItem,
                ),
                mapLoadableItems(state.tv.itemsState, mediaListItemToCardItem),
            ],
            10,
        ),
        movies: {
            state: state.movies.itemsState,
            total: state.movies.total,
            hasMore: state.movies.page < state.movies.totalPages,
            isLoadingMore: state.movies.itemsState.type === 'loading-more',
        },
        tv: {
            state: state.tv.itemsState,
            total: state.tv.total,
            hasMore: state.tv.page < state.tv.totalPages,
            isLoadingMore: state.tv.itemsState.type === 'loading-more',
        },
    }));

    constructor(
        private readonly accountService: AccountRestControllerService,
        private readonly localeStore: LocaleStoreService,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        super(INITIAL_STATE);
    }

    load$(
        sessionId: string,
        accountId: number,
        language: string,
    ): Observable<void> {
        this.patchState((state) => ({
            movies: { ...state.movies, itemsState: { type: 'loading' } },
            tv: { ...state.tv, itemsState: { type: 'loading' } },
        }));

        return this.accountService
            .accountWatchlistMovies(
                accountId,
                language,
                1,
                sessionId,
                this.toApiSortBy(),
                'body',
                false,
                API_JSON_OPTIONS,
            )
            .pipe(
                switchMap((movies) =>
                    this.accountService
                        .accountWatchlistTv(
                            accountId,
                            language,
                            1,
                            sessionId,
                            this.toApiSortBy(),
                            'body',
                            false,
                            API_JSON_OPTIONS,
                        )
                        .pipe(
                            map((tv) => ({
                                movies,
                                tv,
                            })),
                        ),
                ),
                tap((result) => {
                    this.patchState({
                        movies: {
                            itemsState: loaded(
                                (result.movies.results ?? []).map((item) =>
                                    toMediaListItem(item, 'movie', 'year'),
                                ),
                            ),
                            page: result.movies.page ?? 1,
                            totalPages: result.movies.total_pages ?? 1,
                            total: result.movies.total_results ?? 0,
                        },
                        tv: {
                            itemsState: loaded(
                                (result.tv.results ?? []).map((item) =>
                                    toMediaListItem(item, 'tv', 'year'),
                                ),
                            ),
                            page: result.tv.page ?? 1,
                            totalPages: result.tv.total_pages ?? 1,
                            total: result.tv.total_results ?? 0,
                        },
                    });
                }),
                map(() => undefined),
                tap({
                    error: () => {
                        this.patchState({
                            movies: {
                                itemsState: loaded([]),
                                page: 1,
                                totalPages: 1,
                                total: 0,
                            },
                            tv: {
                                itemsState: loaded([]),
                                page: 1,
                                totalPages: 1,
                                total: 0,
                            },
                        });
                    },
                }),
            );
    }

    changeSortDirection$(): Observable<void> {
        const nextDirection: SortDirection =
            this.get().sortDirection === 'desc' ? 'asc' : 'desc';

        this.patchState({ sortDirection: nextDirection });

        return this.tmdbUserAccountService
            .ensureAccountIdentity$()
            .pipe(
                switchMap(({ accountId }) =>
                    this.load$(
                        this.userSessionStore.sessionId()!,
                        accountId,
                        this.localeStore.language(),
                    ),
                ),
            );
    }

    loadMoreMovies$(): Observable<void> {
        const state = this.get();

        if (state.movies.itemsState.type !== 'loaded') {
            return of(undefined);
        }

        return loadMorePaged$({
            currentItems: state.movies.itemsState.value,
            currentPage: state.movies.page,
            totalPages: state.movies.totalPages,
            placeholderCount: PAGE_SIZE,
            setLoadingMore: (items) =>
                this.patchState((currentState) => ({
                    movies: {
                        ...currentState.movies,
                        itemsState: {
                            type: 'loading-more',
                            value: items,
                            placeholderCount: PAGE_SIZE,
                        },
                    },
                })),
            fetchPage: (nextPage) =>
                this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
                    switchMap(({ accountId }) =>
                        this.accountService.accountWatchlistMovies(
                            accountId,
                            this.localeStore.language(),
                            nextPage,
                            this.userSessionStore.sessionId()!,
                            this.toApiSortBy(),
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
                this.patchState((currentState) => ({
                    movies: {
                        ...currentState.movies,
                        itemsState: loaded(items),
                        page,
                    },
                })),
        });
    }

    loadMoreTv$(): Observable<void> {
        const state = this.get();

        if (state.tv.itemsState.type !== 'loaded') {
            return of(undefined);
        }

        return loadMorePaged$({
            currentItems: state.tv.itemsState.value,
            currentPage: state.tv.page,
            totalPages: state.tv.totalPages,
            placeholderCount: PAGE_SIZE,
            setLoadingMore: (items) =>
                this.patchState((currentState) => ({
                    tv: {
                        ...currentState.tv,
                        itemsState: {
                            type: 'loading-more',
                            value: items,
                            placeholderCount: PAGE_SIZE,
                        },
                    },
                })),
            fetchPage: (nextPage) =>
                this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
                    switchMap(({ accountId }) =>
                        this.accountService.accountWatchlistTv(
                            accountId,
                            this.localeStore.language(),
                            nextPage,
                            this.userSessionStore.sessionId()!,
                            this.toApiSortBy(),
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
                this.patchState((currentState) => ({
                    tv: {
                        ...currentState.tv,
                        itemsState: loaded(items),
                        page,
                    },
                })),
        });
    }

    private toApiSortBy(): ApiSortBy {
        return `created_at.${this.get().sortDirection}`;
    }
}
