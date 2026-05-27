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
    RatedMovieListItem,
    RatedMoviePage,
    RatedTvEpisodeListItem,
    RatedTvEpisodePage,
    RatedTvSeriesListItem,
    RatedTvSeriesPage,
} from '../../api';
import { API_JSON_OPTIONS, PAGE_SIZE } from '../../constants';
import {
    CardItem,
    EpisodeListItemData,
    LoadableItems,
    LocaleStoreService,
    MediaRatingService,
    MediaListItem,
    MediaType,
    SortDirection,
    TmdbUserAccountService,
    isDefined,
    toCardItem,
    toMediaListItem,
} from '../../shared';
import { toLoadedItems } from '../../shared/utils';
import {
    DEFAULT_USER_ACCOUNT_SORT_BY,
    DEFAULT_USER_ACCOUNT_SORT_DIRECTION,
    DEFAULT_USER_ACCOUNT_SORT_FIELD,
    UserAccountSortBy,
    UserAccountSortField,
} from './user-list-sort-options';

export type UserRatingContentType = MediaType | 'episode';

export interface UserRatedEpisodeItem {
    readonly key: string;
    readonly seriesId: number;
    readonly seasonNumber: number;
    readonly episodeNumber: number;
    readonly title: string;
    readonly rating: number | null;
    readonly item: EpisodeListItemData;
}

interface UserRatingsState {
    readonly items: LoadableItems<CardItem>;
    readonly totalResults: number;
    readonly pageItems: LoadableItems<MediaListItem>;
    readonly episodePageItems: LoadableItems<UserRatedEpisodeItem>;
    readonly contentType: UserRatingContentType;
    readonly page: number;
    readonly pageTotalResults: number;
    readonly sortField: UserAccountSortField;
    readonly sortDirection: SortDirection;
}

interface UserRatingsPageChanges {
    readonly contentType?: UserRatingContentType;
    readonly sortField?: UserAccountSortField;
    readonly sortDirection?: SortDirection;
}

const INITIAL_PAGE = 1;

const INITIAL_STATE: UserRatingsState = {
    items: { type: 'idle' },
    totalResults: 0,
    pageItems: { type: 'idle' },
    episodePageItems: { type: 'idle' },
    contentType: 'movie',
    page: INITIAL_PAGE,
    pageTotalResults: 0,
    sortField: DEFAULT_USER_ACCOUNT_SORT_FIELD,
    sortDirection: DEFAULT_USER_ACCOUNT_SORT_DIRECTION,
};

@Injectable()
export class UserRatingsStore extends ComponentStore<UserRatingsState> {
    readonly ratingsViewModel$ = this.select((state) => ({
        state: state.items,
        total: state.totalResults,
    }));

    readonly ratingsPageViewModel$ = this.select((state) => ({
        contentType: state.contentType,
        mediaItems: state.pageItems,
        episodeItems: state.episodePageItems,
        itemsState:
            state.contentType === 'episode'
                ? state.episodePageItems.type
                : state.pageItems.type,
        page: state.page - 1,
        pageSize: PAGE_SIZE,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
        total: state.pageTotalResults,
        emptyState: this.toEmptyState(state.contentType),
        totalLabel: this.toTotalLabel(state.contentType, state.pageTotalResults),
    }));

    constructor(
        private readonly accountService: AccountRestControllerService,
        private readonly localeStore: LocaleStoreService,
        private readonly mediaRatingService: MediaRatingService,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
    ) {
        super(INITIAL_STATE);
    }

    load$() {
        const previousState = this.get();

        this.patchState({
            items: { type: 'loading' },
        });

        return this.fetchRatedTitles$().pipe(
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

    loadPage$(pageIndex: number, changes: UserRatingsPageChanges = {}) {
        const previousState = this.get();
        const page = pageIndex + 1;
        const contentType = changes.contentType ?? previousState.contentType;
        const sortField = changes.sortField ?? previousState.sortField;
        const sortDirection =
            changes.sortDirection ?? previousState.sortDirection;

        this.patchState({
            contentType,
            page,
            sortField,
            sortDirection,
        });

        if (contentType === 'episode') {
            this.patchState({ episodePageItems: { type: 'loading' } });
        } else {
            this.patchState({ pageItems: { type: 'loading' } });
        }

        return this.fetchRatingsPage$(
            contentType,
            page,
            this.toSortBy(sortField, sortDirection),
        ).pipe(
            tap((result) => {
                if (result.contentType === 'episode') {
                    this.patchState({
                        episodePageItems: toLoadedItems(result.items),
                        page: result.page,
                        pageTotalResults: result.totalResults,
                    });
                    return;
                }

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

    setContentType$(contentType: UserRatingContentType) {
        if (this.get().contentType === contentType) {
            return EMPTY;
        }

        return this.loadPage$(0, { contentType });
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

    removeMediaRating$(item: MediaListItem) {
        const previousState = this.get();
        const optimisticTotal = this.toTotalAfterMediaRemoval(previousState, item);
        const nextPage = this.toValidPage(previousState.page, optimisticTotal);

        this.patchState({
            page: nextPage,
            pageItems: { type: 'loading' },
            pageTotalResults: optimisticTotal,
        });

        return this.mediaRatingService
            .deleteMediaRating$(item.id, item.mediaType)
            .pipe(
                switchMap(() => this.loadPage$(nextPage - 1)),
                catchError((error: unknown) => {
                    this.setState(previousState);
                    return throwError(() => error);
                }),
            );
    }

    updateMediaRating$(item: MediaListItem, value: number) {
        return this.mediaRatingService.rateMedia$(item.id, item.mediaType, value).pipe(
            tap(() => this.patchRatedMediaItemRating(item, value)),
        );
    }

    removeEpisodeRating$(item: UserRatedEpisodeItem) {
        const previousState = this.get();
        const optimisticTotal = this.toTotalAfterEpisodeRemoval(
            previousState,
            item,
        );
        const nextPage = this.toValidPage(previousState.page, optimisticTotal);

        this.patchState({
            page: nextPage,
            episodePageItems: { type: 'loading' },
            pageTotalResults: optimisticTotal,
        });

        return this.mediaRatingService
            .deleteEpisodeRating$(
                item.seriesId,
                item.seasonNumber,
                item.episodeNumber,
            )
            .pipe(
                switchMap(() => this.loadPage$(nextPage - 1)),
                catchError((error: unknown) => {
                    this.setState(previousState);
                    return throwError(() => error);
                }),
            );
    }

    updateEpisodeRating$(item: UserRatedEpisodeItem, value: number) {
        return this.mediaRatingService
            .rateEpisode$(
                item.seriesId,
                item.seasonNumber,
                item.episodeNumber,
                value,
            )
            .pipe(tap(() => this.patchRatedEpisodeItemRating(item, value)));
    }

    private fetchRatedTitles$() {
        return this.tmdbUserAccountService.ensureAccount$().pipe(
            switchMap(({ accountId, sessionId }) => {
                const language = this.localeStore.language();

                return forkJoin({
                    movies: this.accountService.accountRatedMovies(
                        accountId,
                        language,
                        1,
                        sessionId,
                        DEFAULT_USER_ACCOUNT_SORT_BY,
                        'body',
                        false,
                        API_JSON_OPTIONS,
                    ),
                    tv: this.accountService.accountRatedTv(
                        accountId,
                        language,
                        1,
                        sessionId,
                        DEFAULT_USER_ACCOUNT_SORT_BY,
                        'body',
                        false,
                        API_JSON_OPTIONS,
                    ),
                    episodes: this.accountService.accountRatedTvEpisodes(
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
            map(({ movies, tv, episodes }) => {
                const movieItems = (movies.results ?? []).map((item) => ({
                    ...toCardItem(item, 'movie'),
                    rating: item.rating ?? null,
                }));
                const tvItems = (tv.results ?? []).map((item) => ({
                    ...toCardItem(item, 'tv'),
                    rating: item.rating ?? null,
                }));
                const episodeItems = (episodes.results ?? [])
                    .map((item) => this.toRatedEpisodeCardItem(item))
                    .filter(isDefined);

                return {
                    items: [...movieItems, ...tvItems, ...episodeItems],
                    totalResults:
                        (movies.total_results ?? movieItems.length) +
                        (tv.total_results ?? tvItems.length) +
                        (episodes.total_results ?? episodeItems.length),
                };
            }),
        );
    }

    private fetchRatingsPage$(
        contentType: UserRatingContentType,
        page: number,
        sortBy: UserAccountSortBy,
    ) {
        return this.tmdbUserAccountService.ensureAccount$().pipe(
            switchMap(({ accountId, sessionId }) => {
                const language = this.localeStore.language();

                if (contentType === 'episode') {
                    return this.accountService.accountRatedTvEpisodes(
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

                if (contentType === 'movie') {
                    return this.accountService.accountRatedMovies(
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

                return this.accountService.accountRatedTv(
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
            map((result) => this.toRatingsPage(result, contentType, page)),
        );
    }

    private toRatingsPage(
        result: RatedMoviePage | RatedTvSeriesPage | RatedTvEpisodePage,
        contentType: UserRatingContentType,
        requestedPage: number,
    ) {
        if (contentType === 'episode') {
            return {
                contentType,
                items: ((result as RatedTvEpisodePage).results ?? [])
                    .map((item) => this.toRatedEpisodeItem(item))
                    .filter(isDefined),
                page: result.page ?? requestedPage,
                totalResults: result.total_results ?? 0,
            };
        }

        return {
            contentType,
            items: (
                (result as RatedMoviePage | RatedTvSeriesPage).results ?? []
            )
                .map((item) => this.toRatedMediaItem(item, contentType))
                .filter(isDefined),
            page: result.page ?? requestedPage,
            totalResults: result.total_results ?? 0,
        };
    }

    private toRatedMediaItem(
        item: RatedMovieListItem | RatedTvSeriesListItem,
        mediaType: MediaType,
    ): MediaListItem | null {
        const mediaItem = toMediaListItem(item, mediaType, 'year');
        const title = mediaItem.title.trim();

        if (!mediaItem.id || !title) {
            return null;
        }

        return {
            ...mediaItem,
            title,
            overview: mediaItem.overview.trim(),
            rating: item.rating ?? null,
        };
    }

    private toRatedEpisodeItem(
        item: RatedTvEpisodeListItem,
    ): UserRatedEpisodeItem | null {
        const seriesId = item.show_id ?? null;
        const seasonNumber = item.season_number ?? null;
        const episodeNumber = item.episode_number ?? null;
        const title = item.name?.trim() || 'Untitled episode';

        if (seriesId === null || seasonNumber === null || episodeNumber === null) {
            return null;
        }

        return {
            key: `${seriesId}-${seasonNumber}-${episodeNumber}`,
            seriesId,
            seasonNumber,
            episodeNumber,
            title,
            rating: item.rating ?? null,
            item: {
                name: title,
                subtitle: null,
                overview: item.overview?.trim() ?? '',
                stillPath: item.still_path ?? null,
                seasonNumber,
                episodeNumber,
                airDate: item.air_date ?? null,
                runtime: item.runtime ?? null,
                voteAverage: item.rating ?? null,
                routeCommands: [
                    '/title',
                    seriesId,
                    'tv',
                    'episodes',
                    seasonNumber,
                    episodeNumber,
                ],
            },
        };
    }

    private toRatedEpisodeCardItem(
        item: RatedTvEpisodeListItem,
    ): CardItem | null {
        const seriesId = item.show_id ?? null;
        const seasonNumber = item.season_number ?? null;
        const episodeNumber = item.episode_number ?? null;
        const title = item.name?.trim() || 'Untitled episode';

        if (seriesId === null || seasonNumber === null || episodeNumber === null) {
            return null;
        }

        return {
            id: seriesId,
            mediaType: 'tv',
            title,
            imagePath: item.still_path ?? null,
            backdropPath: null,
            rating: item.rating ?? null,
            date: item.air_date ?? '',
            overview: item.overview?.trim() ?? '',
            role: `S${seasonNumber}E${episodeNumber}`,
            routeCommands: [
                '/title',
                seriesId,
                'tv',
                'episodes',
                seasonNumber,
                episodeNumber,
            ],
        };
    }

    private toSortBy(
        sortField: UserAccountSortField,
        sortDirection: SortDirection,
    ): UserAccountSortBy {
        return `${sortField}.${sortDirection}` as UserAccountSortBy;
    }

    private toTotalLabel(
        contentType: UserRatingContentType,
        totalResults: number,
    ): string {
        if (contentType === 'episode') {
            return `${totalResults} episode rating${totalResults === 1 ? '' : 's'}`;
        }

        if (contentType === 'tv') {
            return `${totalResults} TV series rating${totalResults === 1 ? '' : 's'}`;
        }

        return `${totalResults} movie rating${totalResults === 1 ? '' : 's'}`;
    }

    private toEmptyState(contentType: UserRatingContentType) {
        if (contentType === 'episode') {
            return {
                iconClass: 'fa-regular fa-star',
                title: 'No rated episodes',
                text: 'TV episodes you rate will appear here.',
            };
        }

        if (contentType === 'tv') {
            return {
                iconClass: 'fa-regular fa-star',
                title: 'No rated TV series',
                text: 'TV series you rate will appear here.',
            };
        }

        return {
            iconClass: 'fa-regular fa-star',
            title: 'No rated movies',
            text: 'Movies you rate will appear here.',
        };
    }

    private toTotalAfterMediaRemoval(
        state: UserRatingsState,
        item: MediaListItem,
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

    private toTotalAfterEpisodeRemoval(
        state: UserRatingsState,
        item: UserRatedEpisodeItem,
    ): number {
        const itemWasLoaded =
            state.episodePageItems.type === 'loaded' &&
            state.episodePageItems.value.some(
                (pageItem) => pageItem.key === item.key,
            );

        return itemWasLoaded
            ? Math.max(0, state.pageTotalResults - 1)
            : state.pageTotalResults;
    }

    private toValidPage(page: number, totalResults: number): number {
        const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

        return Math.min(page, totalPages);
    }

    private patchRatedMediaItemRating(item: MediaListItem, value: number): void {
        const state = this.get();

        if (state.pageItems.type !== 'loaded') {
            return;
        }

        this.patchState({
            pageItems: {
                type: 'loaded',
                value: state.pageItems.value.map((pageItem) =>
                    pageItem.id === item.id &&
                    pageItem.mediaType === item.mediaType
                        ? { ...pageItem, rating: value }
                        : pageItem,
                ),
            },
        });
    }

    private patchRatedEpisodeItemRating(
        item: UserRatedEpisodeItem,
        value: number,
    ): void {
        const state = this.get();

        if (state.episodePageItems.type !== 'loaded') {
            return;
        }

        this.patchState({
            episodePageItems: {
                type: 'loaded',
                value: state.episodePageItems.value.map((pageItem) =>
                    pageItem.key === item.key
                        ? {
                              ...pageItem,
                              rating: value,
                              item: {
                                  ...pageItem.item,
                                  voteAverage: value,
                              },
                          }
                        : pageItem,
                ),
            },
        });
    }
}
