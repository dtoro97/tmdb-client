import { Injectable } from '@angular/core';

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

import { V4ListDetails } from '../../api-v4';
import { PAGE_SIZE } from '../../constants';
import {
    CardItem,
    LoadableItems,
    LoadableValue,
    TmdbListService,
    UserSessionStoreService,
    loaded,
} from '../../shared';
import { loadMorePaged$, updateLoadableItems } from '../../shared/utils';

export type UserListSortBy =
    | 'original_order.asc'
    | 'original_order.desc'
    | 'title.asc'
    | 'title.desc'
    | 'primary_release_date.asc'
    | 'primary_release_date.desc';

export interface UserListDetailHeader {
    readonly id: number;
    readonly name: string;
    readonly description: string | null;
    readonly createdBy: string | null;
    readonly itemCount: number;
    readonly posterPath: string | null;
    readonly backdropPath: string | null;
}

interface UserListDetailState {
    readonly listId: number | null;
    readonly headerState: LoadableValue<UserListDetailHeader>;
    readonly itemsState: LoadableItems<CardItem>;
    readonly page: number;
    readonly totalPages: number;
    readonly totalResults: number;
    readonly sortBy: UserListSortBy;
    readonly isOwnedByCurrentUser: boolean;
    readonly isPublic: boolean;
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
    isOwnedByCurrentUser: false,
    isPublic: false,
};

@Injectable()
export class UserListDetailStore extends ComponentStore<UserListDetailState> {
    readonly userListDetailVm$ = this.select((state) => ({
        headerState: state.headerState,
        itemsState: state.itemsState,
        page: state.page,
        totalPages: state.totalPages,
        sortBy: state.sortBy,
        sortField: this.getSortField(state.sortBy),
        sortDirection: this.getSortDirection(state.sortBy),
        isOwnedByCurrentUser: state.isOwnedByCurrentUser,
        isPublic: state.isPublic,
    }));

    constructor(
        private readonly tmdbListService: TmdbListService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        super(INITIAL_STATE);
    }

    loadList$(listId: number): Observable<void> {
        const sortBy = this.get().sortBy;

        this.patchState({
            listId,
            headerState: { type: 'loading' },
            itemsState: { type: 'loading' },
            page: 1,
            totalPages: 1,
            totalResults: 0,
            isOwnedByCurrentUser: false,
            isPublic: false,
        });

        return this.getListDetailPage$(listId, 1, sortBy).pipe(
            tap((result) => {
                this.patchState(this.patchPageResult(result, sortBy));
            }),
            map(() => undefined),
        );
    }

    loadMore$(): Observable<void> {
        const state = this.get();

        if (state.itemsState.type !== 'loaded' || state.listId === null) {
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
                    } as LoadableItems<CardItem>,
                }),
            fetchPage: (nextPage) =>
                this.getListDetailPage$(state.listId!, nextPage, state.sortBy).pipe(
                    tap((result) => {
                        const nextState = this.patchPageResult(
                            result,
                            state.sortBy,
                        );
                        this.patchState({
                            headerState: nextState.headerState!,
                            totalPages: nextState.totalPages!,
                            totalResults: nextState.totalResults!,
                            sortBy: nextState.sortBy!,
                            isOwnedByCurrentUser:
                                nextState.isOwnedByCurrentUser!,
                            isPublic: nextState.isPublic!,
                        });
                    }),
                    map((result) => this.toItems(result)),
                ),
            setLoaded: (items, page) =>
                this.patchState({
                    itemsState: loaded(items),
                    page,
                }),
        });
    }

    updateList$(request: {
        name: string;
        description: string;
        isPublic: boolean;
    }): Observable<void> {
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
                                  })
                                : currentState.headerState,
                        isPublic: request.isPublic,
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

    removeItem$(item: CardItem): Observable<void> {
        const state = this.get();

        if (state.listId === null || state.headerState.type !== 'loaded') {
            return throwError(
                () => new Error('List detail is not loaded yet.'),
            );
        }

        const shouldReloadLoadedPages =
            state.itemsState.type === 'loaded' &&
            state.itemsState.value.length < state.totalResults;

        return this.tmdbListService
            .removeItems$(state.listId, [
                {
                    media_id: item.id,
                    media_type: item.mediaType,
                },
            ])
            .pipe(
                switchMap(() =>
                    shouldReloadLoadedPages
                        ? this.loadLoadedPages$(
                              state.listId!,
                              state.page,
                              state.sortBy,
                          ).pipe(catchError(() => of(null)))
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
                                ...this.patchPageResult(
                                    refreshedResult,
                                    state.sortBy,
                                ),
                            };
                        }

                        return {
                            itemsState: updateLoadableItems(
                                currentState.itemsState,
                                (items) =>
                                    items.filter(
                                        (existingItem) =>
                                            existingItem.id !== item.id ||
                                            existingItem.mediaType !== item.mediaType,
                                    ),
                            ),
                            page: Math.min(
                                currentState.page,
                                this.toPagedTotalPages(nextTotalResults),
                            ),
                            totalPages: this.toPagedTotalPages(nextTotalResults),
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

        return this.getListDetailPage$(state.listId, 1, sortBy).pipe(
            tap((result) => {
                this.patchState(this.patchPageResult(result, sortBy));
            }),
            map(() => undefined),
        );
    }

    toggleSortDirection(): Observable<void> {
        const state = this.get();

        if (state.listId === null) {
            return of(undefined);
        }

        const direction = this.getSortDirection(state.sortBy);
        const nextDirection = direction === 'asc' ? 'desc' : 'asc';
        const base = state.sortBy.replace(/\.asc$|\.desc$/, '');
        const nextSortBy = `${base}.${nextDirection}` as UserListSortBy;

        return this.setSortBy$(nextSortBy);
    }

    private getListDetailPage$(
        listId: number,
        page: number,
        sortBy: UserListSortBy,
    ): Observable<V4ListDetails> {
        return this.tmdbListService.getListDetails$(listId, page, sortBy);
    }

    private toPagedTotalPages(totalResults: number): number {
        return Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
    }

    private patchPageResult(
        result: V4ListDetails,
        sortBy: UserListSortBy,
    ): Partial<UserListDetailState> {
        const items = this.toItems(result);
        const createdBy = this.toCreatedBy(result.created_by);

        return {
            headerState: loaded({
                id: result.id ?? 0,
                name: result.name || 'Untitled List',
                description: result.description ?? null,
                createdBy,
                itemCount: result.item_count ?? items.length,
                posterPath: result.poster_path ?? null,
                backdropPath:
                    items.find((item) => item.backdropPath)?.backdropPath ??
                    result.poster_path ??
                    null,
            }),
            itemsState: loaded(items),
            page: result.page ?? 1,
            totalPages: result.total_pages ?? 1,
            totalResults:
                result.total_results ?? result.item_count ?? items.length,
            sortBy,
            isOwnedByCurrentUser: this.isOwnedByCurrentUser(createdBy),
            isPublic: result.public === true,
        };
    }

    private mergePageResults(results: readonly V4ListDetails[]): V4ListDetails {
        const lastResult = results[results.length - 1];

        return {
            ...lastResult,
            results: results.flatMap((result) => result.results ?? []),
        };
    }

    private loadLoadedPages$(
        listId: number,
        pageCount: number,
        sortBy: UserListSortBy,
    ): Observable<V4ListDetails> {
        return forkJoin(
            Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (page) => this.getListDetailPage$(listId, page, sortBy),
            ),
        ).pipe(map((results) => this.mergePageResults(results)));
    }

    private toItems(result: V4ListDetails): CardItem[] {
        return (result.results ?? [])
            .map((item) => {
                if (!item.id || !item.media_type) {
                    return null;
                }

                const mediaType =
                    item.media_type === 'tv'
                        ? 'tv'
                        : item.media_type === 'movie'
                          ? 'movie'
                          : null;
                const title =
                    (mediaType === 'tv' ? item.name : item.title) ??
                    item.title ??
                    item.name;

                if (!mediaType || !title) {
                    return null;
                }

                return {
                    id: item.id,
                    mediaType,
                    title,
                    imagePath: item.poster_path ?? null,
                    backdropPath: item.backdrop_path ?? null,
                    rating: item.vote_average ?? null,
                    date:
                        mediaType === 'tv'
                            ? item.first_air_date ?? ''
                            : item.release_date ?? '',
                    overview: item.overview ?? '',
                };
            })
            .filter((item): item is CardItem => item !== null);
    }

    private isOwnedByCurrentUser(createdBy: string | null): boolean {
        const username = this.userSessionStore.username();

        return (
            !!createdBy &&
            !!username &&
            createdBy.toLocaleLowerCase() === username.toLocaleLowerCase()
        );
    }

    private toCreatedBy(value: unknown): string | null {
        if (typeof value === 'string') {
            return value;
        }

        if (!value || typeof value !== 'object') {
            return null;
        }

        const createdBy = value as {
            readonly username?: unknown;
            readonly name?: unknown;
        };

        if (typeof createdBy.username === 'string') {
            return createdBy.username;
        }

        if (typeof createdBy.name === 'string') {
            return createdBy.name;
        }

        return null;
    }

    private getSortDirection(sortBy: UserListSortBy): 'asc' | 'desc' {
        return sortBy.endsWith('.asc') ? 'asc' : 'desc';
    }

    private getSortField(
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
}
