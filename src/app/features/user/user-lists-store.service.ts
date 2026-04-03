import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import { forkJoin, map, Observable, tap } from 'rxjs';

import { AccountListItem, AccountRestControllerService } from '../../api';
import { API_JSON_OPTIONS } from '../../constants';
import {
    CardItem,
    LoadableItems,
    MediaListItem,
    loaded,
    mediaListItemToCardItem,
    toMediaListItem,
} from '../../shared';
import {
    combineLoadablePreviewItems,
    mapLoadableItems,
} from '../../shared/utils';
import {
    UserDataListItem,
    UserDataOverviewListPreviewItem,
} from './user-data.models';

interface UserListsState {
    favoriteMoviesState: LoadableItems<MediaListItem>;
    favoriteTvState: LoadableItems<MediaListItem>;
    listsState: LoadableItems<UserDataListItem>;
    favoriteMoviesTotal: number;
    favoriteTvTotal: number;
    listsTotal: number;
}

function toUserListItem(item: AccountListItem): UserDataListItem {
    return {
        id: item.id ?? 0,
        name: item.name?.trim() || 'Untitled List',
        description: item.description?.trim() || '',
        itemCount: item.item_count ?? 0,
        favoriteCount: item.favorite_count ?? 0,
        posterPath: item.poster_path ?? null,
    };
}

function toOverviewListPreviewItem(
    item: UserDataListItem,
): UserDataOverviewListPreviewItem {
    const metadataParts = [
        `${item.itemCount} item${item.itemCount === 1 ? '' : 's'}`,
    ];

    if (item.favoriteCount > 0) {
        metadataParts.push(
            `${item.favoriteCount} favorite${item.favoriteCount === 1 ? '' : 's'}`,
        );
    }

    return {
        id: item.id,
        name: item.name,
        description: item.description,
        metadata: metadataParts.join(' • '),
        posterPath: item.posterPath,
    };
}

export interface UserListsVm {
    readonly favoriteMoviesState: LoadableItems<MediaListItem>;
    readonly favoriteTvState: LoadableItems<MediaListItem>;
    readonly listsState: LoadableItems<UserDataListItem>;
    readonly hasFavoriteMovies: boolean;
    readonly hasFavoriteTv: boolean;
    readonly hasLists: boolean;
    readonly favoritePreviewCards: LoadableItems<CardItem>;
    readonly listPreviewState: LoadableItems<UserDataOverviewListPreviewItem>;
    readonly favoritesTotal: number;
    readonly favoriteMoviesTotal: number;
    readonly favoriteTvTotal: number;
    readonly listsTotal: number;
}

const INITIAL_STATE: UserListsState = {
    favoriteMoviesState: { type: 'idle' },
    favoriteTvState: { type: 'idle' },
    listsState: { type: 'idle' },
    favoriteMoviesTotal: 0,
    favoriteTvTotal: 0,
    listsTotal: 0,
};

@Injectable()
export class UserListsStore extends ComponentStore<UserListsState> {
    readonly vm$ = this.select(
        (state): UserListsVm => ({
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
                state.listsState.type === 'loaded' &&
                state.listsState.value.length > 0,
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
            listPreviewState: combineLoadablePreviewItems(
                [
                    mapLoadableItems(state.listsState, (item) =>
                        toOverviewListPreviewItem(item),
                    ),
                ],
                4,
            ),
            favoritesTotal:
                state.favoriteMoviesTotal + state.favoriteTvTotal,
            favoriteMoviesTotal: state.favoriteMoviesTotal,
            favoriteTvTotal: state.favoriteTvTotal,
            listsTotal: state.listsTotal,
        }),
    );

    constructor(private readonly accountService: AccountRestControllerService) {
        super(INITIAL_STATE);
    }

    load$(
        sessionId: string,
        accountId: number,
        language: string,
    ): Observable<void> {
        this.patchState({
            favoriteMoviesState: { type: 'loading' },
            favoriteTvState: { type: 'loading' },
            listsState: { type: 'loading' },
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
            lists: this.accountService.accountLists(
                accountId,
                1,
                sessionId,
                'body',
                false,
                API_JSON_OPTIONS,
            ),
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
                    listsState: loaded(
                        (result.lists.results ?? []).map((item) =>
                            toUserListItem(item),
                        ),
                    ),
                    favoriteMoviesTotal:
                        result.favoriteMovies.total_results ?? 0,
                    favoriteTvTotal: result.favoriteTv.total_results ?? 0,
                    listsTotal: result.lists.total_results ?? 0,
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
}
