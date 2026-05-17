import { Injectable } from '@angular/core';

import { ComponentStore } from '@ngrx/component-store';
import {
    catchError,
    forkJoin,
    map,
    Observable,
    of,
    switchMap,
    tap,
    throwError,
} from 'rxjs';

import {
    AccountRestControllerService,
    RatedMovieListItem,
    RatedTvEpisodeListItem,
    RatedTvSeriesListItem,
    TvSeriesRestControllerService,
} from '../../api';
import { API_JSON_OPTIONS, PAGE_SIZE } from '../../constants';
import {
    CardItem,
    LoadableItems,
    MediaListItem,
    MediaRatingService,
    LocaleStoreService,
    SortDirection,
    TmdbUserAccountService,
    UserSessionStoreService,
    loaded,
    normalizeRatingValue,
    toMediaListItem,
} from '../../shared';
import {
    combineLoadablePreviewItems,
    loadMorePaged$,
    mapLoadableItems,
    updateLoadableItems,
} from '../../shared/utils';

export interface UserRatedMediaItem {
    readonly media: MediaListItem;
    readonly userRating: number | null;
}

export interface UserRatedEpisodeItem {
    readonly id: number;
    readonly showId: number | null;
    readonly showName: string | null;
    readonly name: string;
    readonly overview: string;
    readonly seasonNumber: number | null;
    readonly episodeNumber: number | null;
    readonly airDate: string;
    readonly runtime: number | null;
    readonly voteAverage: number | null;
    readonly stillPath: string | null;
    readonly userRating: number | null;
}

type ApiSortBy = 'created_at.asc' | 'created_at.desc';

interface RatingsBucketState<T> {
    readonly itemsState: LoadableItems<T>;
    readonly page: number;
    readonly totalPages: number;
    readonly total: number;
}

interface UserRatingsState {
    readonly movies: RatingsBucketState<UserRatedMediaItem>;
    readonly tv: RatingsBucketState<UserRatedMediaItem>;
    readonly episodes: RatingsBucketState<UserRatedEpisodeItem>;
    readonly sortDirection: SortDirection;
}

const RECENT_RATINGS_PREVIEW_LIMIT = 20;

const INITIAL_STATE: UserRatingsState = {
    movies: {
        itemsState: { type: 'idle' },
        page: 1,
        totalPages: 1,
        total: 0,
    },
    tv: {
        itemsState: { type: 'idle' },
        page: 1,
        totalPages: 1,
        total: 0,
    },
    episodes: {
        itemsState: { type: 'idle' },
        page: 1,
        totalPages: 1,
        total: 0,
    },
    sortDirection: 'desc',
};

@Injectable()
export class UserRatingsStore extends ComponentStore<UserRatingsState> {
    readonly userRatingsVm$ = this.select((state) => {
        const moviesMediaState = mapLoadableItems(
            state.movies.itemsState,
            (item) => item.media,
        );
        const tvMediaState = mapLoadableItems(state.tv.itemsState, (item) => item.media);
        const recentRatings = this.getRecentRatings(state);

        return {
            sortDirection: state.sortDirection,
            hasRatings:
                this.hasItems(state.movies.itemsState) ||
                this.hasItems(state.tv.itemsState) ||
                this.hasItems(state.episodes.itemsState),
            ratingsTotal:
                state.movies.total + state.tv.total + state.episodes.total,
            ratingPreviewCards: combineLoadablePreviewItems(
                [
                    mapLoadableItems(state.movies.itemsState, (item) =>
                        this.toCardItem(item),
                    ),
                    mapLoadableItems(state.tv.itemsState, (item) =>
                        this.toCardItem(item),
                    ),
                ],
                10,
            ),
            recentRatings,
            recentRatingsCount: recentRatings.length,
            recentRatingsAverage:
                recentRatings.length > 0
                    ? recentRatings.reduce((sum, rating) => sum + rating, 0) /
                      recentRatings.length
                    : null,
            movies: {
                state: moviesMediaState,
                userRatings: this.toUserRatingsMap(state.movies.itemsState),
                total: state.movies.total,
                hasItems: this.hasItems(state.movies.itemsState),
                hasMore: state.movies.page < state.movies.totalPages,
                isLoadingMore: state.movies.itemsState.type === 'loading-more',
            },
            tv: {
                state: tvMediaState,
                userRatings: this.toUserRatingsMap(state.tv.itemsState),
                total: state.tv.total,
                hasItems: this.hasItems(state.tv.itemsState),
                hasMore: state.tv.page < state.tv.totalPages,
                isLoadingMore: state.tv.itemsState.type === 'loading-more',
            },
            episodes: {
                state: state.episodes.itemsState,
                total: state.episodes.total,
                hasItems: this.hasItems(state.episodes.itemsState),
                hasMore: state.episodes.page < state.episodes.totalPages,
                isLoadingMore:
                    state.episodes.itemsState.type === 'loading-more',
            },
        };
    });

    constructor(
        private readonly accountService: AccountRestControllerService,
        private readonly localeStore: LocaleStoreService,
        private readonly mediaRatingService: MediaRatingService,
        private readonly tmdbUserAccountService: TmdbUserAccountService,
        private readonly tvSeriesService: TvSeriesRestControllerService,
        private readonly userSessionStore: UserSessionStoreService,
    ) {
        super(INITIAL_STATE);
    }

    load$(
        sessionId: string,
        accountId: number,
        language: string,
    ): Observable<void> {
        this.patchState({
            movies: { ...this.get().movies, itemsState: { type: 'loading' } },
            tv: { ...this.get().tv, itemsState: { type: 'loading' } },
            episodes: {
                ...this.get().episodes,
                itemsState: { type: 'loading' },
            },
        });

        return forkJoin({
            movies: this.accountService.accountRatedMovies(
                accountId,
                language,
                1,
                sessionId,
                this.toApiSortBy(),
                'body',
                false,
                API_JSON_OPTIONS,
            ),
            tv: this.accountService.accountRatedTv(
                accountId,
                language,
                1,
                sessionId,
                this.toApiSortBy(),
                'body',
                false,
                API_JSON_OPTIONS,
            ),
            episodes: this.accountService.accountRatedTvEpisodes(
                accountId,
                language,
                1,
                sessionId,
                this.toApiSortBy(),
                'body',
                false,
                API_JSON_OPTIONS,
            ),
        }).pipe(
            tap((result) => {
                this.patchState({
                    movies: {
                        itemsState: loaded(
                            (result.movies.results ?? []).map((item) =>
                                this.toUserRatedMovie(item),
                            ),
                        ),
                        page: result.movies.page ?? 1,
                        totalPages: result.movies.total_pages ?? 1,
                        total: result.movies.total_results ?? 0,
                    },
                    tv: {
                        itemsState: loaded(
                            (result.tv.results ?? []).map((item) =>
                                this.toUserRatedTv(item),
                            ),
                        ),
                        page: result.tv.page ?? 1,
                        totalPages: result.tv.total_pages ?? 1,
                        total: result.tv.total_results ?? 0,
                    },
                    episodes: {
                        itemsState: loaded(
                            (result.episodes.results ?? []).map((item) =>
                                this.toUserRatedEpisode(item),
                            ),
                        ),
                        page: result.episodes.page ?? 1,
                        totalPages: result.episodes.total_pages ?? 1,
                        total: result.episodes.total_results ?? 0,
                    },
                });
            }),
            switchMap((result) => {
                const showIds = [
                    ...new Set(
                        (result.episodes.results ?? [])
                            .map((episode) => episode.show_id)
                            .filter((showId): showId is number => showId != null),
                    ),
                ];

                if (showIds.length === 0) {
                    return of(undefined);
                }

                return forkJoin(
                    Object.fromEntries(
                        showIds.map((showId) => [
                            String(showId),
                            this.tvSeriesService
                                .tvSeriesDetails(
                                    showId,
                                    undefined,
                                    language,
                                    'body',
                                    false,
                                    API_JSON_OPTIONS,
                                )
                                .pipe(
                                    map((series) => series.name?.trim() || null),
                                    catchError(() => of(null as string | null)),
                                ),
                        ]),
                    ),
                ).pipe(
                    tap((showNames) => {
                        this.patchState((currentState) => ({
                            episodes: {
                                ...currentState.episodes,
                                itemsState: updateLoadableItems(
                                    currentState.episodes.itemsState,
                                    (items) =>
                                        items.map((item) => {
                                            const showName =
                                                item.showId != null
                                                    ? showNames[
                                                          String(item.showId)
                                                      ] ?? null
                                                    : null;

                                            return showName === item.showName
                                                ? item
                                                : {
                                                      ...item,
                                                      showName,
                                                  };
                                        }),
                                ),
                            },
                        }));
                    }),
                    map(() => undefined),
                );
            }),
            tap({
                error: () => {
                    this.patchState({
                        movies: {
                            page: 1,
                            totalPages: 1,
                            total: 0,
                            itemsState: loaded([]),
                        },
                        tv: {
                            page: 1,
                            totalPages: 1,
                            total: 0,
                            itemsState: loaded([]),
                        },
                        episodes: {
                            page: 1,
                            totalPages: 1,
                            total: 0,
                            itemsState: loaded([]),
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
                        this.accountService.accountRatedMovies(
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
                            this.toUserRatedMovie(item),
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
                        this.accountService.accountRatedTv(
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
                            this.toUserRatedTv(item),
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

    loadMoreEpisodes$(): Observable<void> {
        const state = this.get();

        if (state.episodes.itemsState.type !== 'loaded') {
            return of(undefined);
        }

        return loadMorePaged$({
            currentItems: state.episodes.itemsState.value,
            currentPage: state.episodes.page,
            totalPages: state.episodes.totalPages,
            placeholderCount: PAGE_SIZE,
            setLoadingMore: (items) =>
                this.patchState((currentState) => ({
                    episodes: {
                        ...currentState.episodes,
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
                        this.accountService.accountRatedTvEpisodes(
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
                            this.toUserRatedEpisode(item),
                        ),
                    ),
                ),
            setLoaded: (items, page) =>
                this.patchState((currentState) => ({
                    episodes: {
                        ...currentState.episodes,
                        itemsState: loaded(items),
                        page,
                    },
                })),
        });
    }

    updateMediaRating$(
        mediaId: number,
        mediaType: 'movie' | 'tv',
        userRating: number,
    ): Observable<void> {
        const normalizedRating = normalizeRatingValue(userRating);

        return this.mediaRatingService
            .rateMedia$(mediaId, mediaType, normalizedRating)
            .pipe(
                tap(() => {
                    if (mediaType === 'movie') {
                        this.patchState((state) => ({
                            movies: {
                                ...state.movies,
                                itemsState: updateLoadableItems(
                                    state.movies.itemsState,
                                    (items) =>
                                        items.map((item) =>
                                            item.media.id === mediaId
                                                ? {
                                                      ...item,
                                                      userRating:
                                                          normalizedRating,
                                                  }
                                                : item,
                                        ),
                                ),
                            },
                        }));
                        return;
                    }

                    this.patchState((state) => ({
                        tv: {
                            ...state.tv,
                            itemsState: updateLoadableItems(
                                state.tv.itemsState,
                                (items) =>
                                    items.map((item) =>
                                        item.media.id === mediaId
                                            ? {
                                                  ...item,
                                                  userRating: normalizedRating,
                                              }
                                            : item,
                                    ),
                            ),
                        },
                    }));
                }),
                map(() => undefined),
            );
    }

    removeMediaRating$(
        mediaId: number,
        mediaType: 'movie' | 'tv',
    ): Observable<void> {
        return this.mediaRatingService
            .deleteMediaRating$(mediaId, mediaType)
            .pipe(
                tap(() => {
                    if (mediaType === 'movie') {
                        this.patchState((state) => {
                            const nextTotal = Math.max(0, state.movies.total - 1);

                            return {
                                movies: {
                                    ...state.movies,
                                    itemsState: updateLoadableItems(
                                        state.movies.itemsState,
                                        (items) =>
                                            items.filter(
                                                (item) =>
                                                    item.media.id !== mediaId,
                                            ),
                                    ),
                                    page: Math.min(
                                        state.movies.page,
                                        this.toTotalPages(nextTotal),
                                    ),
                                    totalPages: this.toTotalPages(nextTotal),
                                    total: nextTotal,
                                },
                            };
                        });
                        return;
                    }

                    this.patchState((state) => {
                        const nextTotal = Math.max(0, state.tv.total - 1);

                        return {
                            tv: {
                                ...state.tv,
                                itemsState: updateLoadableItems(
                                    state.tv.itemsState,
                                    (items) =>
                                        items.filter(
                                            (item) => item.media.id !== mediaId,
                                        ),
                                ),
                                page: Math.min(
                                    state.tv.page,
                                    this.toTotalPages(nextTotal),
                                ),
                                totalPages: this.toTotalPages(nextTotal),
                                total: nextTotal,
                            },
                        };
                    });
                }),
                map(() => undefined),
            );
    }

    updateEpisodeRating$(
        episodeId: number,
        showId: number | null,
        seasonNumber: number | null,
        episodeNumber: number | null,
        userRating: number,
    ): Observable<void> {
        if (
            showId === null ||
            seasonNumber === null ||
            episodeNumber === null
        ) {
            return throwError(
                () => new Error('Episode rating context is incomplete.'),
            );
        }

        const normalizedRating = normalizeRatingValue(userRating);

        return this.mediaRatingService
            .rateEpisode$(showId, seasonNumber, episodeNumber, normalizedRating)
            .pipe(
                tap(() => {
                    this.patchState((state) => ({
                        episodes: {
                            ...state.episodes,
                            itemsState: updateLoadableItems(
                                state.episodes.itemsState,
                                (items) =>
                                    items.map((item) =>
                                        item.id === episodeId
                                            ? {
                                                  ...item,
                                                  userRating: normalizedRating,
                                              }
                                            : item,
                                    ),
                            ),
                        },
                    }));
                }),
                map(() => undefined),
            );
    }

    removeEpisodeRating$(
        episodeId: number,
        showId: number | null,
        seasonNumber: number | null,
        episodeNumber: number | null,
    ): Observable<void> {
        if (
            showId === null ||
            seasonNumber === null ||
            episodeNumber === null
        ) {
            return throwError(
                () => new Error('Episode rating context is incomplete.'),
            );
        }

        return this.mediaRatingService
            .deleteEpisodeRating$(showId, seasonNumber, episodeNumber)
            .pipe(
                tap(() => {
                    this.patchState((state) => {
                        const nextTotal = Math.max(0, state.episodes.total - 1);

                        return {
                            episodes: {
                                ...state.episodes,
                                itemsState: updateLoadableItems(
                                    state.episodes.itemsState,
                                    (items) =>
                                        items.filter(
                                            (item) => item.id !== episodeId,
                                        ),
                                ),
                                page: Math.min(
                                    state.episodes.page,
                                    this.toTotalPages(nextTotal),
                                ),
                                totalPages: this.toTotalPages(nextTotal),
                                total: nextTotal,
                            },
                        };
                    });
                }),
                map(() => undefined),
            );
    }

    private hasItems<T>(state: LoadableItems<T>): boolean {
        return (
            (state.type === 'loaded' || state.type === 'loading-more') &&
            state.value.length > 0
        );
    }

    private toTotalPages(total: number): number {
        return Math.max(1, Math.ceil(total / PAGE_SIZE));
    }

    private toApiSortBy(): ApiSortBy {
        return `created_at.${this.get().sortDirection}`;
    }

    private toCardItem(item: UserRatedMediaItem): CardItem {
        return {
            id: item.media.id,
            mediaType: item.media.mediaType as 'movie' | 'tv',
            title: item.media.title,
            imagePath: item.media.thumb,
            backdropPath: null,
            rating: item.userRating,
            date: item.media.date,
            overview: item.media.overview,
        };
    }

    private toUserRatingsMap(
        state: LoadableItems<UserRatedMediaItem>,
    ): ReadonlyMap<number, number> {
        if (state.type !== 'loaded' && state.type !== 'loading-more') {
            return new Map();
        }

        return new Map(
            state.value.flatMap((item) =>
                item.userRating == null
                    ? []
                    : [[item.media.id, item.userRating] as const],
            ),
        );
    }

    private toUserRatedMovie(item: RatedMovieListItem): UserRatedMediaItem {
        return {
            media: toMediaListItem(item, 'movie'),
            userRating: item.rating ?? null,
        };
    }

    private toUserRatedTv(item: RatedTvSeriesListItem): UserRatedMediaItem {
        return {
            media: toMediaListItem(item, 'tv'),
            userRating: item.rating ?? null,
        };
    }

    private toUserRatedEpisode(
        item: RatedTvEpisodeListItem,
    ): UserRatedEpisodeItem {
        return {
            id: item.id ?? 0,
            showId: item.show_id ?? null,
            showName: null,
            name: item.name?.trim() || 'Untitled Episode',
            overview: item.overview ?? '',
            seasonNumber: item.season_number ?? null,
            episodeNumber: item.episode_number ?? null,
            airDate: item.air_date ?? '',
            runtime: item.runtime ?? null,
            voteAverage: item.vote_average ?? null,
            stillPath: item.still_path ?? null,
            userRating: item.rating ?? null,
        };
    }

    private getRecentRatings(state: UserRatingsState): readonly number[] {
        return [
            ...this.toRecentRatingItems(state.movies.itemsState),
            ...this.toRecentRatingItems(state.tv.itemsState),
            ...this.toRecentRatingItems(state.episodes.itemsState),
        ]
            .slice(0, RECENT_RATINGS_PREVIEW_LIMIT)
            .map((rating) => rating);
    }

    private toRecentRatingItems<T extends { userRating: number | null }>(
        state: LoadableItems<T>,
    ): readonly number[] {
        if (state.type !== 'loaded' && state.type !== 'loading-more') {
            return [];
        }

        return state.value.flatMap((item) =>
            item.userRating == null ? [] : [item.userRating],
        );
    }
}
