import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, catchError, of, switchMap, tap, throwError } from 'rxjs';

import { V4ListContentItem, V4ListDetails, V4ListSortBy } from '../../api-v4';
import { PAGE_SIZE } from '../../constants';
import {
    RemoteData,
    MediaListItem,
    MediaType,
    TmdbListService,
    UserSessionStoreService,
    isDefined,
    remoteSuccess,
    toUpdatedAtLabel,
    updateRemoteData,
} from '../../shared';
import { DEFAULT_USER_LIST_SORT_BY } from './user-list-sort-options';

export interface UserListDetailHeader {
    readonly id: number;
    readonly name: string;
    readonly description: string | null;
    readonly createdBy: string | null;
    readonly itemCount: number;
    readonly updatedLabel: string | null;
}

export interface UserListDetailItem {
    readonly key: string;
    readonly id: number;
    readonly mediaType: MediaType;
    readonly mediaItem: MediaListItem;
    readonly title: string;
    readonly comment: string;
    readonly link: (string | number)[];
}

interface UserListDetailState {
    readonly listId: number | null;
    readonly headerState: RemoteData<UserListDetailHeader>;
    readonly itemsState: RemoteData<UserListDetailItem[]>;
    readonly page: number;
    readonly totalPages: number;
    readonly totalResults: number;
    readonly activeSortBy: V4ListSortBy;
    readonly defaultSortBy: V4ListSortBy;
    readonly isOwnedByCurrentUser: boolean;
    readonly isPublic: boolean;
}

const INITIAL_STATE: UserListDetailState = {
    listId: null,
    headerState: { state: 'notAsked' },
    itemsState: { state: 'notAsked' },
    page: 1,
    totalPages: 1,
    totalResults: 0,
    activeSortBy: DEFAULT_USER_LIST_SORT_BY,
    defaultSortBy: DEFAULT_USER_LIST_SORT_BY,
    isOwnedByCurrentUser: false,
    isPublic: false,
};

@Injectable()
export class UserListDetailStore extends ComponentStore<UserListDetailState> {
    readonly userListDetailVm$ = this.select((state) => ({
        header: state.headerState,
        items: state.itemsState,
        page: state.page - 1,
        pageSize: PAGE_SIZE,
        total: state.totalResults,
        sortBy: state.activeSortBy,
        defaultSortBy: state.defaultSortBy,
        ownedByCurrentUser: state.isOwnedByCurrentUser,
        isPublic: state.isPublic,
        existingItemKeys: state.itemsState.state === 'success' ? state.itemsState.data.map((item) => item.key) : [],
    }));

    constructor(
        private readonly tmdbListService: TmdbListService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        super(INITIAL_STATE);
    }

    loadList$(listId: number) {
        this.patchState({
            listId,
            headerState: { state: 'loading' },
            itemsState: { state: 'loading' },
            page: 1,
            totalPages: 1,
            totalResults: 0,
            activeSortBy: DEFAULT_USER_LIST_SORT_BY,
            defaultSortBy: DEFAULT_USER_LIST_SORT_BY,
            isOwnedByCurrentUser: false,
            isPublic: false,
        });

        return this.fetchAndPatchPage$(listId, 1, undefined, DEFAULT_USER_LIST_SORT_BY, INITIAL_STATE);
    }

    reload$() {
        const state = this.get();

        if (state.listId === null) {
            return EMPTY;
        }

        return this.loadPage$(state.page - 1);
    }

    loadPage$(pageIndex: number) {
        const state = this.get();

        if (state.listId === null) {
            return EMPTY;
        }

        const page = pageIndex + 1;

        this.patchState({
            itemsState: { state: 'loading' },
            page,
        });

        return this.fetchAndPatchPage$(state.listId, page, state.activeSortBy, state.defaultSortBy, state);
    }

    setSortBy$(sortBy: V4ListSortBy) {
        const state = this.get();

        if (state.listId === null || sortBy === state.activeSortBy) {
            return EMPTY;
        }

        this.patchState({
            activeSortBy: sortBy,
            itemsState: { state: 'loading' },
            page: 1,
            totalPages: 1,
            totalResults: 0,
        });

        return this.fetchAndPatchPage$(state.listId, 1, sortBy, state.defaultSortBy, state);
    }

    updateList$(request: {
        readonly name: string;
        readonly description: string;
        readonly isPublic: boolean;
        readonly sortBy?: V4ListSortBy;
    }) {
        const state = this.get();

        if (state.listId === null || state.headerState.state !== 'success') {
            return throwError(() => new Error('List detail is not loaded yet.'));
        }

        const nextDefaultSortBy = request.sortBy ?? state.defaultSortBy;

        return this.tmdbListService
            .updateList$(state.listId, {
                name: request.name,
                description: request.description,
                public: request.isPublic,
                sort_by: request.sortBy,
            })
            .pipe(
                tap(() => {
                    this.patchState((state) => ({
                        headerState:
                            state.headerState.state === 'success'
                                ? remoteSuccess({
                                      ...state.headerState.data,
                                      name: request.name,
                                      description: request.description || null,
                                  })
                                : state.headerState,
                        defaultSortBy: nextDefaultSortBy,
                        activeSortBy:
                            request.sortBy && state.activeSortBy === state.defaultSortBy
                                ? request.sortBy
                                : state.activeSortBy,
                        isPublic: request.isPublic,
                    }));
                }),
                switchMap(() =>
                    request.sortBy && state.activeSortBy === state.defaultSortBy ? this.reload$() : of(undefined),
                ),
            );
    }

    clearList$() {
        const state = this.get();

        if (state.listId === null || state.headerState.state !== 'success') {
            return throwError(() => new Error('List detail is not loaded yet.'));
        }

        return this.tmdbListService.clearList$(state.listId).pipe(
            tap(() => {
                this.patchState((state) => ({
                    headerState:
                        state.headerState.state === 'success'
                            ? remoteSuccess({
                                  ...state.headerState.data,
                                  itemCount: 0,
                              })
                            : state.headerState,
                    itemsState: remoteSuccess([]),
                    page: 1,
                    totalPages: 1,
                    totalResults: 0,
                }));
            }),
        );
    }

    deleteList$() {
        const state = this.get();

        if (state.listId === null) {
            return throwError(() => new Error('List detail is not loaded yet.'));
        }

        return this.tmdbListService.deleteList$(state.listId);
    }

    addItem$(mediaId: number, mediaType: MediaType) {
        const state = this.get();

        if (state.listId === null) {
            return throwError(() => new Error('List detail is not loaded yet.'));
        }

        return this.tmdbListService.addToList$(state.listId, mediaId, mediaType).pipe(switchMap(() => this.reload$()));
    }

    removeItem$(item: UserListDetailItem) {
        const state = this.get();

        if (state.listId === null || state.headerState.state !== 'success') {
            return throwError(() => new Error('List detail is not loaded yet.'));
        }

        return this.tmdbListService
            .removeItems$(state.listId, [
                {
                    media_id: item.id,
                    media_type: item.mediaType,
                },
            ])
            .pipe(
                switchMap(() => {
                    const state = this.get();
                    const totalResults = Math.max(0, state.totalResults - 1);
                    const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
                    const page = Math.min(state.page, totalPages);
                    const nextItems =
                        state.itemsState.state === 'success'
                            ? state.itemsState.data.filter((existingItem) => existingItem.key !== item.key)
                            : null;

                    this.patchState({
                        itemsState: nextItems ? remoteSuccess(nextItems) : state.itemsState,
                        page,
                        totalPages,
                        totalResults,
                        headerState:
                            state.headerState.state === 'success'
                                ? remoteSuccess({
                                      ...state.headerState.data,
                                      itemCount: Math.max(0, state.headerState.data.itemCount - 1),
                                  })
                                : state.headerState,
                    });

                    if (totalResults > 0 && nextItems && (page !== state.page || nextItems.length === 0)) {
                        return this.loadPage$(page - 1);
                    }

                    return of(undefined);
                }),
            );
    }

    updateItemComment$(item: UserListDetailItem, comment: string) {
        const state = this.get();

        if (state.listId === null) {
            return throwError(() => new Error('List detail is not loaded yet.'));
        }

        return this.tmdbListService
            .updateItems$(state.listId, [
                {
                    media_id: item.id,
                    media_type: item.mediaType,
                    comment,
                },
            ])
            .pipe(
                tap(() => {
                    this.patchState((state) => ({
                        itemsState: updateRemoteData(state.itemsState, (items) =>
                            items.map((existingItem) =>
                                existingItem.key === item.key
                                    ? {
                                          ...existingItem,
                                          comment,
                                      }
                                    : existingItem,
                            ),
                        ),
                    }));
                }),
            );
    }

    private fetchAndPatchPage$(
        listId: number,
        page: number,
        sortBy: V4ListSortBy | undefined,
        fallbackDefaultSortBy: V4ListSortBy,
        restoreState: UserListDetailState,
    ) {
        return this.tmdbListService.getListDetails$(listId, page, sortBy).pipe(
            tap((result) => {
                const defaultSortBy = result.sort_by ?? fallbackDefaultSortBy;
                this.patchState(this.toLoadedPageState(result, sortBy ?? defaultSortBy, defaultSortBy));
            }),
            catchError((error: unknown) => {
                this.setState(restoreState);
                return throwError(() => error);
            }),
        );
    }

    private toLoadedPageState(result: V4ListDetails, activeSortBy: V4ListSortBy, fallbackDefaultSortBy: V4ListSortBy) {
        const items = this.toItems(result);
        const defaultSortBy = result.sort_by ?? fallbackDefaultSortBy;
        const updatedLabel = toUpdatedAtLabel(result.updated_at);

        return {
            headerState: remoteSuccess({
                id: result.id ?? 0,
                name: result.name || 'Untitled List',
                description: result.description ?? null,
                createdBy: result.created_by?.username ?? null,
                itemCount: result.item_count ?? items.length,
                updatedLabel,
            }),
            itemsState: remoteSuccess(items),
            page: result.page ?? 1,
            totalPages: result.total_pages ?? 1,
            totalResults: result.total_results ?? result.item_count ?? items.length,
            activeSortBy,
            defaultSortBy,
            isOwnedByCurrentUser:
                this.userSessionStore.username()?.toLocaleLowerCase() ===
                result.created_by?.username?.toLocaleLowerCase(),
            isPublic: result.public === true,
        };
    }

    private toItems(result: V4ListDetails): UserListDetailItem[] {
        const commentsByKey = new Map(Object.entries(result.comments ?? {}));

        return (result.results ?? [])
            .map((item) => this.toItem(item, commentsByKey))
            .filter(isDefined);
    }

    private toItem(item: V4ListContentItem, commentsByKey: ReadonlyMap<string, string>): UserListDetailItem | null {
        if (!item.id || !item.media_type) {
            return null;
        }

        const mediaType = item.media_type === 'tv' ? 'tv' : item.media_type === 'movie' ? 'movie' : null;
        const title = (mediaType === 'tv' ? item.name : item.title) ?? item.title ?? item.name;

        if (!mediaType || !title) {
            return null;
        }

        const date = mediaType === 'tv' ? (item.first_air_date ?? '') : (item.release_date ?? '');

        const key = `${mediaType}:${item.id}`;

        return {
            key,
            id: item.id,
            mediaType,
            mediaItem: {
                id: item.id,
                thumb: item.poster_path ?? null,
                title,
                overview: item.overview ?? '',
                rating: item.vote_average ?? null,
                date,
                mediaType,
                badges: [
                    {
                        label: mediaType === 'tv' ? 'TV show' : 'Movie',
                    },
                ],
            },
            title,
            comment: commentsByKey.get(key) ?? '',
            link: ['/', 'title', item.id, mediaType],
        };
    }
}
