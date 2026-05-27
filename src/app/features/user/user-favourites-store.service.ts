import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import {
    EMPTY,
    catchError,
    forkJoin,
    map,
    switchMap,
    tap,
    throwError,
} from 'rxjs';

import {
    AccountRestControllerService,
    MovieListItem,
    MoviePage,
    TvSeriesListItem,
    TvSeriesPage,
} from '../../api';
import { API_JSON_OPTIONS, PAGE_SIZE } from '../../constants';
import {
    CardItem,
    LoadableItems,
    LocaleStoreService,
    MediaType,
    SortDirection,
    TmdbListService,
    TmdbUserAccountService,
    isDefined,
    toCardItem,
} from '../../shared';
import { toLoadedItems } from '../../shared/utils';
import {
    DEFAULT_USER_ACCOUNT_SORT_BY,
    DEFAULT_USER_ACCOUNT_SORT_DIRECTION,
    DEFAULT_USER_ACCOUNT_SORT_FIELD,
    UserAccountSortBy,
    UserAccountSortField,
} from './user-list-sort-options';

interface UserFavouritesState {
    readonly items: LoadableItems<CardItem>;
    readonly totalResults: number;
    readonly pageItems: LoadableItems<CardItem>;
    readonly mediaType: MediaType;
    readonly page: number;
    readonly pageTotalResults: number;
    readonly sortField: UserAccountSortField;
    readonly sortDirection: SortDirection;
}

interface UserFavouritesPageChanges {
    readonly mediaType?: MediaType;
    readonly sortField?: UserAccountSortField;
    readonly sortDirection?: SortDirection;
}

const INITIAL_PAGE = 1;

const INITIAL_STATE: UserFavouritesState = {
    items: { type: 'idle' },
    totalResults: 0,
    pageItems: { type: 'idle' },
    mediaType: 'movie',
    page: INITIAL_PAGE,
    pageTotalResults: 0,
    sortField: DEFAULT_USER_ACCOUNT_SORT_FIELD,
    sortDirection: DEFAULT_USER_ACCOUNT_SORT_DIRECTION,
};

@Injectable()
export class UserFavouritesStore extends ComponentStore<UserFavouritesState> {
    readonly favouritesViewModel$ = this.select((state) => ({
        state: state.items,
        total: state.totalResults,
    }));

    readonly favouritesPageViewModel$ = this.select((state) => ({
        mediaType: state.mediaType,
        items: state.pageItems,
        page: state.page - 1,
        pageSize: PAGE_SIZE,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
        total: state.pageTotalResults,
        totalLabel: this.toTotalLabel(state.mediaType, state.pageTotalResults),
    }));

    constructor(
        private readonly accountService: AccountRestControllerService,
        private readonly localeStore: LocaleStoreService,
        private readonly tmdbListService: TmdbListService,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
    ) {
        super(INITIAL_STATE);
    }

    load$() {
        const previousState = this.get();

        this.patchState({
            items: { type: 'loading' },
        });

        return this.fetchFavouriteTitles$().pipe(
            tap((result) => {
                this.patchState({
                    items: toLoadedItems(result.items),
                    totalResults: result.totalResults,
                });
            }),
            catchError((error: unknown) => {
                this.setState(previousState);
                return throwError(() => error);
            }),
        );
    }

    loadPage$(pageIndex: number, changes: UserFavouritesPageChanges = {}) {
        const previousState = this.get();
        const page = pageIndex + 1;
        const mediaType = changes.mediaType ?? previousState.mediaType;
        const sortField = changes.sortField ?? previousState.sortField;
        const sortDirection =
            changes.sortDirection ?? previousState.sortDirection;

        this.patchState({
            mediaType,
            page,
            pageItems: { type: 'loading' },
            sortField,
            sortDirection,
        });

        return this.fetchFavouritePage$(
            mediaType,
            page,
            this.toSortBy(sortField, sortDirection),
        ).pipe(
            tap((result) => {
                this.patchState({
                    pageItems: toLoadedItems(result.items),
                    page: result.page,
                    pageTotalResults: result.totalResults,
                });
            }),
            catchError((error: unknown) => {
                this.setState(previousState);
                return throwError(() => error);
            }),
        );
    }

    setMediaType$(mediaType: MediaType) {
        if (this.get().mediaType === mediaType) {
            return EMPTY;
        }

        return this.loadPage$(0, { mediaType });
    }

    setSortField$(sortField: unknown) {
        if (sortField !== 'created_at') {
            return EMPTY;
        }

        if (this.get().sortField === sortField) {
            return EMPTY;
        }

        return this.loadPage$(0, { sortField });
    }

    toggleSortDirection$() {
        return this.loadPage$(0, {
            sortDirection: this.get().sortDirection === 'asc' ? 'desc' : 'asc',
        });
    }

    removeFromFavourites$(item: CardItem) {
        const previousState = this.get();
        const optimisticTotal = this.toTotalAfterRemoval(previousState, item);
        const nextPage = this.toValidPage(previousState.page, optimisticTotal);

        this.patchState({
            page: nextPage,
            pageItems: { type: 'loading' },
            pageTotalResults: optimisticTotal,
        });

        return this.tmdbListService
            .updateFavorite$(item.id, item.mediaType, false)
            .pipe(
                switchMap(() => this.loadPage$(nextPage - 1)),
                catchError((error: unknown) => {
                    this.setState(previousState);
                    return throwError(() => error);
                }),
            );
    }

    private fetchFavouriteTitles$() {
        return this.tmdbUserAccountService.ensureAccount$().pipe(
            switchMap(({ accountId, sessionId }) => {
                const language = this.localeStore.language();

                return forkJoin({
                    movies: this.accountService.accountGetFavorites(
                        accountId,
                        language,
                        1,
                        sessionId,
                        DEFAULT_USER_ACCOUNT_SORT_BY,
                        'body',
                        false,
                        API_JSON_OPTIONS,
                    ),
                    tv: this.accountService.accountFavoriteTv(
                        accountId,
                        language,
                        1,
                        sessionId,
                        DEFAULT_USER_ACCOUNT_SORT_BY,
                        'body',
                        false,
                        API_JSON_OPTIONS,
                    ),
                });
            }),
            map(({ movies, tv }) => {
                const movieItems = (movies.results ?? []).map((item) =>
                    toCardItem(item, 'movie'),
                );
                const tvItems = (tv.results ?? []).map((item) =>
                    toCardItem(item, 'tv'),
                );

                return {
                    items: [...movieItems, ...tvItems],
                    totalResults:
                        (movies.total_results ?? movieItems.length) +
                        (tv.total_results ?? tvItems.length),
                };
            }),
        );
    }

    private fetchFavouritePage$(
        mediaType: MediaType,
        page: number,
        sortBy: UserAccountSortBy,
    ) {
        return this.tmdbUserAccountService.ensureAccount$().pipe(
            switchMap(({ accountId, sessionId }) => {
                const language = this.localeStore.language();

                if (mediaType === 'movie') {
                    return this.accountService.accountGetFavorites(
                        accountId,
                        language,
                        page,
                        sessionId,
                        sortBy,
                        'body',
                        false,
                        API_JSON_OPTIONS,
                    );
                }

                return this.accountService.accountFavoriteTv(
                    accountId,
                    language,
                    page,
                    sessionId,
                    sortBy,
                    'body',
                    false,
                    API_JSON_OPTIONS,
                );
            }),
            map((result) => this.toFavouritePage(result, mediaType, page)),
        );
    }

    private toFavouritePage(
        result: MoviePage | TvSeriesPage,
        mediaType: MediaType,
        requestedPage: number,
    ) {
        return {
            items: (result.results ?? [])
                .map((item) => this.toFavouriteItem(item, mediaType))
                .filter(isDefined),
            page: result.page ?? requestedPage,
            totalResults: result.total_results ?? 0,
        };
    }

    private toFavouriteItem(
        item: MovieListItem | TvSeriesListItem,
        mediaType: MediaType,
    ): CardItem | null {
        const cardItem = toCardItem(item, mediaType);
        const title = cardItem.title.trim();

        if (!cardItem.id || !title) {
            return null;
        }

        return {
            ...cardItem,
            title,
            overview: cardItem.overview.trim(),
        };
    }

    private toSortBy(
        sortField: UserAccountSortField,
        sortDirection: SortDirection,
    ): UserAccountSortBy {
        return `${sortField}.${sortDirection}` as UserAccountSortBy;
    }

    private toTotalLabel(mediaType: MediaType, totalResults: number): string {
        if (mediaType === 'tv') {
            return `${totalResults} TV series`;
        }

        return `${totalResults} movie${totalResults === 1 ? '' : 's'}`;
    }

    private toTotalAfterRemoval(
        state: UserFavouritesState,
        item: CardItem,
    ): number {
        const itemWasLoaded =
            state.pageItems.type === 'loaded' &&
            state.pageItems.value.some(
                (pageItem) =>
                    pageItem.id === item.id &&
                    pageItem.mediaType === item.mediaType,
            );

        return itemWasLoaded
            ? Math.max(0, state.pageTotalResults - 1)
            : state.pageTotalResults;
    }

    private toValidPage(page: number, totalResults: number): number {
        const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

        return Math.min(page, totalPages);
    }
}
