import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { catchError, forkJoin, map, Observable, of, tap } from 'rxjs';

import { AccountRestControllerService } from '../../api';
import {
    AccountService as AccountV4Service,
    V4AccountListSummary,
} from '../../api-v4';
import { API_JSON_OPTIONS } from '../../constants';
import {
    LoadableItems,
    MediaListItem,
    UserSessionStoreService,
    loaded,
    mediaListItemToCardItem,
    toMediaListItem,
    toUpdatedAtLabel,
} from '../../shared';
import {
    combineLoadablePreviewItems,
    loadMorePaged$,
    mapLoadableItems,
} from '../../shared/utils';

export interface UserDataListItem {
    readonly id: number;
    readonly name: string;
    readonly description: string | null;
    readonly itemCount: number;
    readonly metadata: string;
    readonly updatedLabel: string | null;
    readonly posterPath: string | null;
}

interface UserListsState {
    favoriteMoviesState: LoadableItems<MediaListItem>;
    favoriteTvState: LoadableItems<MediaListItem>;
    listsState: LoadableItems<UserDataListItem>;
    favoriteMoviesTotal: number;
    favoriteTvTotal: number;
    listsPage: number;
    listsTotalPages: number;
    listsTotal: number;
}

const LISTS_PLACEHOLDER_COUNT = 4;

const INITIAL_STATE: UserListsState = {
    favoriteMoviesState: { type: 'idle' },
    favoriteTvState: { type: 'idle' },
    listsState: { type: 'idle' },
    favoriteMoviesTotal: 0,
    favoriteTvTotal: 0,
    listsPage: 1,
    listsTotalPages: 1,
    listsTotal: 0,
};

@Injectable()
export class UserListsStore extends ComponentStore<UserListsState> {
    readonly vm$ = this.select((state) => ({
        favoriteMoviesState: state.favoriteMoviesState,
        favoriteTvState: state.favoriteTvState,
        listsState: state.listsState,
        hasFavoriteMovies:
            state.favoriteMoviesState.type === 'loaded' &&
            state.favoriteMoviesState.value.length > 0,
        hasFavoriteTv:
            state.favoriteTvState.type === 'loaded' &&
            state.favoriteTvState.value.length > 0,
        hasLists:
            (state.listsState.type === 'loaded' ||
                state.listsState.type === 'loading-more') &&
            state.listsState.value.length > 0,
        listsHasMore: state.listsPage < state.listsTotalPages,
        favoritePreviewCards: combineLoadablePreviewItems(
            [
                mapLoadableItems(
                    state.favoriteMoviesState,
                    mediaListItemToCardItem,
                ),
                mapLoadableItems(
                    state.favoriteTvState,
                    mediaListItemToCardItem,
                ),
            ],
            10,
        ),
        listPreviewState: combineLoadablePreviewItems([state.listsState], 3),
        favoritesTotal: state.favoriteMoviesTotal + state.favoriteTvTotal,
        favoriteMoviesTotal: state.favoriteMoviesTotal,
        favoriteTvTotal: state.favoriteTvTotal,
        listsTotal: state.listsTotal,
    }));

    constructor(
        private readonly accountService: AccountRestControllerService,
        private readonly accountV4Service: AccountV4Service,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        super(INITIAL_STATE);
    }

    load$(
        sessionId: string,
        accountId: number,
        language: string,
        includeCustomLists = true,
    ): Observable<void> {
        this.patchState({
            favoriteMoviesState: { type: 'loading' },
            favoriteTvState: { type: 'loading' },
            listsState: { type: 'loading' },
            listsPage: 1,
            listsTotalPages: 1,
            listsTotal: 0,
        });

        return forkJoin({
            favoriteMovies: this.accountService.accountGetFavorites(
                accountId,
                language,
                1,
                sessionId,
                'created_at.desc',
                'body',
                false,
                API_JSON_OPTIONS,
            ),
            favoriteTv: this.accountService.accountFavoriteTv(
                accountId,
                language,
                1,
                sessionId,
                'created_at.desc',
                'body',
                false,
                API_JSON_OPTIONS,
            ),
            lists: this.fetchListsPage$(1, includeCustomLists),
        }).pipe(
            tap((result) => {
                this.patchState({
                    favoriteMoviesState: loaded(
                        (result.favoriteMovies.results ?? []).map((item) =>
                            toMediaListItem(item, 'movie'),
                        ),
                    ),
                    favoriteTvState: loaded(
                        (result.favoriteTv.results ?? []).map((item) =>
                            toMediaListItem(item, 'tv'),
                        ),
                    ),
                    listsState: loaded([...result.lists.items]),
                    favoriteMoviesTotal:
                        result.favoriteMovies.total_results ?? 0,
                    favoriteTvTotal: result.favoriteTv.total_results ?? 0,
                    listsPage: result.lists.page,
                    listsTotalPages: result.lists.totalPages,
                    listsTotal: result.lists.totalResults,
                });
            }),
            map(() => undefined),
            tap({
                error: () => {
                    this.patchState({
                        favoriteMoviesState: loaded([]),
                        favoriteTvState: loaded([]),
                        listsState: loaded([]),
                    });
                },
            }),
        );
    }

    loadMoreLists$(): Observable<void> {
        const state = this.get();

        if (state.listsState.type !== 'loaded') {
            return of(undefined);
        }

        return loadMorePaged$({
            currentItems: state.listsState.value,
            currentPage: state.listsPage,
            totalPages: state.listsTotalPages,
            placeholderCount: LISTS_PLACEHOLDER_COUNT,
            setLoadingMore: (items) =>
                this.patchState({
                    listsState: {
                        type: 'loading-more',
                        value: items,
                        placeholderCount: LISTS_PLACEHOLDER_COUNT,
                    } as LoadableItems<UserDataListItem>,
                }),
            fetchPage: (nextPage) =>
                this.fetchListsPage$(
                    nextPage,
                    !!this.userSessionStore.v4AccessToken(),
                ).pipe(
                    tap((result) => {
                        this.patchState({
                            listsTotalPages: result.totalPages,
                            listsTotal: result.totalResults,
                        });
                    }),
                    map((result) => [...result.items]),
                ),
            setLoaded: (items, page) =>
                this.patchState({
                    listsState: loaded(items),
                    listsPage: page,
                }),
        });
    }

    private fetchListsPage$(page: number, includeCustomLists: boolean) {
        const v4AccountId = this.userSessionStore.v4AccountId();

        if (!includeCustomLists || !v4AccountId) {
            return of({
                items: [],
                page: 1,
                totalPages: 1,
                totalResults: 0,
            });
        }

        return this.accountV4Service
            .accountV4Lists(v4AccountId, page, 'body', false, API_JSON_OPTIONS)
            .pipe(
                map((result) => ({
                    items: (result.results ?? [])
                        .filter(
                            (item): item is V4AccountListSummary =>
                                !!item.id && !!item.name?.trim(),
                        )
                        .map((item) => {
                            const itemCount = item.number_of_items ?? 0;

                            return {
                                id: item.id ?? 0,
                                name: item.name?.trim() || 'Untitled List',
                                description: item.description?.trim() || null,
                                itemCount,
                                metadata: `${itemCount} item${itemCount === 1 ? '' : 's'}`,
                                updatedLabel: toUpdatedAtLabel(
                                    item.updated_at ?? item.created_at,
                                ),
                                posterPath: item.poster_path ?? null,
                            };
                        }),
                    page: result.page ?? 1,
                    totalPages: result.total_pages ?? 1,
                    totalResults: result.total_results ?? 0,
                })),
                catchError(() =>
                    of({
                        items: [],
                        page: 1,
                        totalPages: 1,
                        totalResults: 0,
                    }),
                ),
            );
    }
}
