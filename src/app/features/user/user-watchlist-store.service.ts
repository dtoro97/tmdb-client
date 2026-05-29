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
    MoviePage,
    TvSeriesPage,
} from '../../api';
import { API_JSON_OPTIONS, PAGE_SIZE } from '../../constants';
import {
    CardItem,
    RemoteData,
    LocaleStoreService,
    MediaListItem,
    MediaType,
    SortDirection,
    TmdbListService,
    TmdbUserAccountService,
    isDefined,
    toCardItem,
} from '../../shared';
import { remoteSuccess } from '../../shared/utils';
import {
    toTotalAfterMediaRemoval,
    toUserAccountMediaListItem,
    toUserAccountSortBy,
    toUserMediaTotalLabel,
} from './user-account-media.helpers';
import {
    DEFAULT_USER_ACCOUNT_SORT_BY,
    DEFAULT_USER_ACCOUNT_SORT_DIRECTION,
    DEFAULT_USER_ACCOUNT_SORT_FIELD,
    UserAccountSortBy,
    UserAccountSortField,
} from './user-list-sort-options';

interface UserWatchlistState {
    readonly items: RemoteData<CardItem[]>;
    readonly totalResults: number;
    readonly pageItems: RemoteData<MediaListItem[]>;
    readonly mediaType: MediaType;
    readonly page: number;
    readonly pageTotalResults: number;
    readonly sortField: UserAccountSortField;
    readonly sortDirection: SortDirection;
}

interface UserWatchlistPageChanges {
    readonly mediaType?: MediaType;
    readonly sortField?: UserAccountSortField;
    readonly sortDirection?: SortDirection;
}

const INITIAL_PAGE = 1;

const INITIAL_STATE: UserWatchlistState = {
    items: { state: 'notAsked' },
    totalResults: 0,
    pageItems: { state: 'notAsked' },
    mediaType: 'movie',
    page: INITIAL_PAGE,
    pageTotalResults: 0,
    sortField: DEFAULT_USER_ACCOUNT_SORT_FIELD,
    sortDirection: DEFAULT_USER_ACCOUNT_SORT_DIRECTION,
};

@Injectable()
export class UserWatchlistStore extends ComponentStore<UserWatchlistState> {
    readonly watchlistViewModel$ = this.select((state) => ({
        state: state.items,
        total: state.totalResults,
    }));

    readonly watchlistPageViewModel$ = this.select((state) => ({
        mediaType: state.mediaType,
        items: state.pageItems,
        page: state.page - 1,
        pageSize: PAGE_SIZE,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
        total: state.pageTotalResults,
        totalLabel: toUserMediaTotalLabel(
            state.mediaType,
            state.pageTotalResults,
        ),
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
            items: { state: 'loading' },
        });

        return this.fetchWatchlistTitles$().pipe(
            tap((result) => {
                this.patchState({
                    items: remoteSuccess(result.items),
                    totalResults: result.totalResults,
                });
            }),
            catchError((error: unknown) => {
                this.setState(previousState);
                return throwError(() => error);
            }),
        );
    }

    loadPage$(pageIndex: number, changes: UserWatchlistPageChanges = {}) {
        const previousState = this.get();
        const page = pageIndex + 1;
        const mediaType = changes.mediaType ?? previousState.mediaType;
        const sortField = changes.sortField ?? previousState.sortField;
        const sortDirection =
            changes.sortDirection ?? previousState.sortDirection;

        this.patchState({
            mediaType,
            page,
            pageItems: { state: 'loading' },
            sortField,
            sortDirection,
        });

        return this.fetchWatchlistPage$(
            mediaType,
            page,
            toUserAccountSortBy(sortField, sortDirection),
        ).pipe(
            tap((result) => {
                this.patchState({
                    pageItems: remoteSuccess(result.items),
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

    removeFromWatchlist$(item: MediaListItem) {
        const previousState = this.get();
        const optimisticTotal = toTotalAfterMediaRemoval(
            previousState.pageItems,
            item,
            previousState.pageTotalResults,
        );
        const nextPage = this.toValidPage(previousState.page, optimisticTotal);

        this.patchState({
            page: nextPage,
            pageItems: { state: 'loading' },
            pageTotalResults: optimisticTotal,
        });

        return this.tmdbListService
            .updateWatchlist$(item.id, item.mediaType, false)
            .pipe(
                switchMap(() => this.loadPage$(nextPage - 1)),
                catchError((error: unknown) => {
                    this.setState(previousState);
                    return throwError(() => error);
                }),
            );
    }

    private fetchWatchlistTitles$() {
        return this.tmdbUserAccountService.ensureAccount$().pipe(
            switchMap(({ accountId, sessionId }) => {
                const language = this.localeStore.language();

                return forkJoin({
                    movies: this.accountService.accountWatchlistMovies(
                        accountId,
                        language,
                        1,
                        sessionId,
                        DEFAULT_USER_ACCOUNT_SORT_BY,
                        'body',
                        false,
                        API_JSON_OPTIONS,
                    ),
                    tv: this.accountService.accountWatchlistTv(
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

    private fetchWatchlistPage$(
        mediaType: MediaType,
        page: number,
        sortBy: UserAccountSortBy,
    ) {
        return this.tmdbUserAccountService.ensureAccount$().pipe(
            switchMap(({ accountId, sessionId }) => {
                const language = this.localeStore.language();

                if (mediaType === 'movie') {
                    return this.accountService.accountWatchlistMovies(
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

                return this.accountService.accountWatchlistTv(
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
            map((result) => this.toWatchlistPage(result, mediaType, page)),
        );
    }

    private toWatchlistPage(
        result: MoviePage | TvSeriesPage,
        mediaType: MediaType,
        requestedPage: number,
    ) {
        return {
            items: (result.results ?? [])
                .map((item) => toUserAccountMediaListItem(item, mediaType))
                .filter(isDefined),
            page: result.page ?? requestedPage,
            totalResults: result.total_results ?? 0,
        };
    }

    private toValidPage(page: number, totalResults: number): number {
        const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

        return Math.min(page, totalPages);
    }
}
