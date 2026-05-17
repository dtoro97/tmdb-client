import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { ComponentStore } from '@ngrx/component-store';
import {
    Observable,
    catchError,
    forkJoin,
    map,
    of,
    switchMap,
    tap,
    throwError,
} from 'rxjs';

import { PAGE_SIZE } from '../../constants';
import {
    LoadableItems,
    LoadableValue,
    TmdbListService,
    UserSessionStoreService,
    loaded,
} from '../../shared';
import { loadMorePaged$, updateLoadableItems } from '../../shared/utils';
import {
    UpdateUserListRequest,
    UserListDetailHeader,
    UserListDetailItem,
    UserListDetailPageResult,
    UserListSortBy,
    toUserListDetailPage,
} from './user-list-detail.models';

interface UserListDetailState {
    readonly listId: number | null;
    readonly headerState: LoadableValue<UserListDetailHeader>;
    readonly itemsState: LoadableItems<UserListDetailItem>;
    readonly page: number;
    readonly totalPages: number;
    readonly totalResults: number;
    readonly sortBy: UserListSortBy;
}

export interface UserListDetailVm {
    readonly header: UserListDetailHeader | null;
    readonly itemsState: LoadableItems<UserListDetailItem>;
    readonly hasMore: boolean;
    readonly canManage: boolean;
    readonly sortBy: UserListSortBy;
    readonly sortField: 'original_order' | 'title' | 'primary_release_date';
    readonly sortDirection: 'asc' | 'desc';
}

const LIST_DETAIL_PLACEHOLDER_COUNT = 6;

const INITIAL_STATE: UserListDetailState = {
    listId: null,
    headerState: { type: 'idle' },
    itemsState: { type: 'idle' },
    page: 1,
    totalPages: 1,
    totalResults: 0,
    sortBy: 'original_order.asc',
};

function toTitleCountLabel(count: number): string {
    return `${count} title${count === 1 ? '' : 's'}`;
}

function toPagedTotalPages(totalResults: number): number {
    return Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
}

function toSortField(
    sortBy: UserListSortBy,
): 'original_order' | 'title' | 'primary_release_date' {
    if (sortBy.startsWith('title.')) {
        return 'title';
    }

    if (sortBy.startsWith('primary_release_date.')) {
        return 'primary_release_date';
    }

    return 'original_order';
}

function patchPageResult(
    result: UserListDetailPageResult,
    existingItems?: readonly UserListDetailItem[],
): Partial<UserListDetailState> {
    return {
        headerState: loaded(result.header),
        itemsState: loaded(
            existingItems
                ? [...existingItems, ...result.items]
                : [...result.items],
        ),
        page: result.page,
        totalPages: result.totalPages,
        totalResults: result.totalResults,
    };
}

function mergePageResults(
    results: readonly UserListDetailPageResult[],
): UserListDetailPageResult {
    const lastResult = results[results.length - 1];

    return {
        header: lastResult.header,
        items: results.flatMap((result) => result.items),
        page: lastResult.page,
        totalPages: lastResult.totalPages,
        totalResults: lastResult.totalResults,
    };
}

@Injectable()
export class UserListDetailStore extends ComponentStore<UserListDetailState> {
    readonly vm$ = this.select((state): UserListDetailVm => {
        const header =
            state.headerState.type === 'loaded'
                ? state.headerState.value
                : null;
        return {
            header,
            itemsState: state.itemsState,
            hasMore: state.page < state.totalPages,
            canManage: !!header?.isOwnedByCurrentUser,
            sortBy: state.sortBy,
            sortField: toSortField(state.sortBy),
            sortDirection: this.currentSortDirection(state.sortBy),
        };
    });

    constructor(
        private readonly router: Router,
        private readonly tmdbListService: TmdbListService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        super(INITIAL_STATE);
    }

    private reloadLoadedPages$(
        listId: number,
        pageCount: number,
        sortBy: UserListSortBy,
    ): Observable<UserListDetailPageResult> {
        return forkJoin(
            Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (page) =>
                    this.tmdbListService
                        .getListDetails$(listId, page, sortBy)
                        .pipe(
                            map((result) =>
                                toUserListDetailPage(
                                    result,
                                    this.userSessionStore.username(),
                                ),
                            ),
                        ),
            ),
        ).pipe(map((results) => mergePageResults(results)));
    }

    loadList$(listId: number) {
        const sortBy = this.get().sortBy;

        this.patchState({
            listId,
            headerState: { type: 'loading' },
            itemsState: { type: 'loading' },
            page: 1,
            totalPages: 1,
            totalResults: 0,
        });

        return this.tmdbListService.getListDetails$(listId, 1, sortBy).pipe(
            map((result) =>
                toUserListDetailPage(result, this.userSessionStore.username()),
            ),
            tap((result) => {
                this.patchState(patchPageResult(result));
            }),
            catchError(() => {
                this.router.navigate(['not-found']);
                return of(undefined);
            }),
        );
    }

    loadMore$(): Observable<void> {
        const state = this.get();
        const listId = state.listId;

        if (state.itemsState.type !== 'loaded' || listId === null) {
            return of(undefined);
        }

        return loadMorePaged$({
            currentItems: state.itemsState.value,
            currentPage: state.page,
            totalPages: state.totalPages,
            placeholderCount: LIST_DETAIL_PLACEHOLDER_COUNT,
            setLoadingMore: (items) =>
                this.patchState({
                    itemsState: {
                        type: 'loading-more',
                        value: items,
                        placeholderCount: LIST_DETAIL_PLACEHOLDER_COUNT,
                    } as LoadableItems<UserListDetailItem>,
                }),
            fetchPage: (nextPage) =>
                this.tmdbListService
                    .getListDetails$(listId, nextPage, state.sortBy)
                    .pipe(
                    map((result) =>
                        toUserListDetailPage(
                            result,
                            this.userSessionStore.username(),
                        ),
                    ),
                    tap((result) => {
                        this.patchState({
                            headerState: loaded(result.header),
                            totalPages: result.totalPages,
                            totalResults: result.totalResults,
                        });
                    }),
                    map((result) => [...result.items]),
                ),
            setLoaded: (items, page) =>
                this.patchState({
                    itemsState: loaded(items),
                    page,
                }),
        });
    }

    updateList$(request: UpdateUserListRequest): Observable<void> {
        const state = this.get();

        if (state.listId === null || state.headerState.type !== 'loaded') {
            return throwError(
                () => new Error('List detail is not loaded yet.'),
            );
        }

        return this.tmdbListService
            .updateList$(state.listId, {
                name: request.name,
                description: request.description,
                public: request.isPublic,
            })
            .pipe(
                tap(() => {
                    this.patchState((currentState) => ({
                        headerState:
                            currentState.headerState.type === 'loaded'
                                ? loaded({
                                      ...currentState.headerState.value,
                                      name: request.name,
                                      description: request.description || null,
                                      isPublic: request.isPublic,
                                      visibilityLabel: request.isPublic
                                          ? 'Public list'
                                          : 'Private list',
                                  })
                                : currentState.headerState,
                    }));
                }),
            );
    }

    clearList$(): Observable<void> {
        const state = this.get();

        if (state.listId === null || state.headerState.type !== 'loaded') {
            return throwError(
                () => new Error('List detail is not loaded yet.'),
            );
        }

        return this.tmdbListService.clearList$(state.listId).pipe(
            tap(() => {
                this.patchState((currentState) => ({
                    headerState:
                        currentState.headerState.type === 'loaded'
                            ? loaded({
                                  ...currentState.headerState.value,
                                  itemCount: 0,
                                  itemCountLabel: toTitleCountLabel(0),
                                  backdropPath:
                                      currentState.headerState.value.posterPath,
                              })
                            : currentState.headerState,
                    itemsState: loaded([]),
                    page: 1,
                    totalPages: 1,
                    totalResults: 0,
                }));
            }),
        );
    }

    deleteList$(): Observable<void> {
        const state = this.get();

        if (state.listId === null) {
            return throwError(
                () => new Error('List detail is not loaded yet.'),
            );
        }

        return this.tmdbListService.deleteList$(state.listId);
    }

    removeItem$(item: UserListDetailItem): Observable<void> {
        const state = this.get();

        if (state.listId === null || state.headerState.type !== 'loaded') {
            return throwError(
                () => new Error('List detail is not loaded yet.'),
            );
        }

        const listId = state.listId;
        const shouldReloadLoadedPages =
            state.itemsState.type === 'loaded' &&
            state.itemsState.value.length < state.totalResults;

        return this.tmdbListService
            .removeItems$(listId, [
                {
                    media_id: item.id,
                    media_type: item.mediaType,
                },
            ])
            .pipe(
                switchMap(() =>
                    shouldReloadLoadedPages
                        ? this.reloadLoadedPages$(
                              listId,
                              state.page,
                              state.sortBy,
                          ).pipe(
                              // Keep list pagination stable when server-side sort is active.
                              catchError(() => of(null)),
                          )
                        : of(null),
                ),
                tap((refreshedResult) => {
                    const nextTotalResults = Math.max(
                        0,
                        state.totalResults - 1,
                    );

                    this.patchState((currentState) => {
                        if (refreshedResult) {
                            return {
                                ...patchPageResult(refreshedResult),
                            };
                        }

                        return {
                            itemsState: updateLoadableItems(
                                currentState.itemsState,
                                (items) =>
                                    items.filter(
                                        (existingItem) =>
                                            existingItem.key !== item.key,
                                    ),
                            ),
                            page: Math.min(
                                currentState.page,
                                toPagedTotalPages(nextTotalResults),
                            ),
                            totalPages: toPagedTotalPages(nextTotalResults),
                            totalResults: nextTotalResults,
                            headerState:
                                currentState.headerState.type === 'loaded'
                                    ? loaded({
                                          ...currentState.headerState.value,
                                          itemCount: Math.max(
                                              0,
                                              currentState.headerState.value
                                                  .itemCount - 1,
                                          ),
                                          itemCountLabel: toTitleCountLabel(
                                              Math.max(
                                                  0,
                                                  currentState.headerState.value
                                                      .itemCount - 1,
                                              ),
                                          ),
                                          backdropPath:
                                              currentState.headerState.value
                                                  .backdropPath ===
                                              item.backdropPath
                                                  ? currentState.headerState
                                                        .value.posterPath
                                                  : currentState.headerState
                                                        .value.backdropPath,
                                      })
                                    : currentState.headerState,
                        };
                    });
                }),
                map(() => undefined),
            );
    }

    setSortBy$(sortBy: UserListSortBy): Observable<void> {
        const state = this.get();

        if (state.listId === null || sortBy === state.sortBy) {
            return of(undefined);
        }

        this.patchState({
            sortBy,
            itemsState: { type: 'loading' },
            page: 1,
            totalPages: 1,
            totalResults: 0,
        });

        return this.tmdbListService.getListDetails$(state.listId, 1, sortBy).pipe(
            map((result) =>
                toUserListDetailPage(result, this.userSessionStore.username()),
            ),
            tap((result) => {
                this.patchState(patchPageResult(result));
            }),
            map(() => undefined),
        );
    }

    private currentSortDirection(sortBy: UserListSortBy): 'asc' | 'desc' {
        return sortBy.endsWith('.asc') ? 'asc' : 'desc';
    }

    toggleSortDirection$(): Observable<void> {
        const state = this.get();

        if (state.listId === null) {
            return of(undefined);
        }

        const direction = this.currentSortDirection(state.sortBy);
        const nextDirection = direction === 'asc' ? 'desc' : 'asc';
        const base = state.sortBy.replace(/\.asc$|\.desc$/, '');
        const nextSortBy = `${base}.${nextDirection}` as UserListSortBy;

        return this.setSortBy$(nextSortBy);
    }
}
