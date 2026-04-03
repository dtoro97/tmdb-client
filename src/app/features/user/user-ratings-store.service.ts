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
    loadMorePaged$,
    mapLoadableItems,
    updateLoadableItems,
    combineLoadablePreviewItems,
} from '../../shared/utils';
import { UserRatedEpisodeItem, UserRatedMediaItem } from './user-data.models';

type ApiSortBy = 'created_at.asc' | 'created_at.desc';

interface UserRatingsState {
    ratedMoviesState: LoadableItems<UserRatedMediaItem>;
    ratedMoviesPage: number;
    ratedMoviesTotalPages: number;
    ratedTvState: LoadableItems<UserRatedMediaItem>;
    ratedTvPage: number;
    ratedTvTotalPages: number;
    ratedEpisodesState: LoadableItems<UserRatedEpisodeItem>;
    ratedEpisodesPage: number;
    ratedEpisodesTotalPages: number;
    ratedMoviesTotal: number;
    ratedTvTotal: number;
    ratedEpisodesTotal: number;
    sortDirection: SortDirection;
}

function toUserRatingsMap(
    state: LoadableItems<UserRatedMediaItem>,
): ReadonlyMap<number, number> {
    if (state.type !== 'loaded' && state.type !== 'loading-more') {
        return new Map();
    }

    return new Map(
        state.value
            .filter((item) => item.userRating != null)
            .map((item) => [item.media.id, item.userRating!]),
    );
}

function ratedItemToCardItem(item: UserRatedMediaItem): CardItem {
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

function toUserRatedMovie(item: RatedMovieListItem): UserRatedMediaItem {
    return {
        media: toMediaListItem(item, 'movie'),
        userRating: item.rating ?? null,
    };
}

function toUserRatedTv(item: RatedTvSeriesListItem): UserRatedMediaItem {
    return {
        media: toMediaListItem(item, 'tv'),
        userRating: item.rating ?? null,
    };
}

function toUserRatedEpisode(
    item: RatedTvEpisodeListItem,
    showName: string | null = null,
): UserRatedEpisodeItem {
    return {
        id: item.id ?? 0,
        showId: item.show_id ?? null,
        showName,
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

function toPagedTotalPages(totalResults: number): number {
    return Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
}

export interface UserRatingsVm {
    readonly ratedMoviesState: LoadableItems<UserRatedMediaItem>;
    readonly ratedTvState: LoadableItems<UserRatedMediaItem>;
    readonly ratedEpisodesState: LoadableItems<UserRatedEpisodeItem>;
    readonly ratedMoviesMediaState: LoadableItems<MediaListItem>;
    readonly ratedTvMediaState: LoadableItems<MediaListItem>;
    readonly ratedMoviesUserRatings: ReadonlyMap<number, number>;
    readonly ratedTvUserRatings: ReadonlyMap<number, number>;
    readonly hasRatedMovies: boolean;
    readonly hasRatedTv: boolean;
    readonly hasRatedEpisodes: boolean;
    readonly hasRatings: boolean;
    readonly ratedMoviesHasMore: boolean;
    readonly ratedTvHasMore: boolean;
    readonly ratedEpisodesHasMore: boolean;
    readonly ratingPreviewCards: LoadableItems<CardItem>;
    readonly ratingsTotal: number;
    readonly sortDirection: SortDirection;
}

const INITIAL_STATE: UserRatingsState = {
    ratedMoviesState: { type: 'idle' },
    ratedMoviesPage: 1,
    ratedMoviesTotalPages: 1,
    ratedTvState: { type: 'idle' },
    ratedTvPage: 1,
    ratedTvTotalPages: 1,
    ratedEpisodesState: { type: 'idle' },
    ratedEpisodesPage: 1,
    ratedEpisodesTotalPages: 1,
    ratedMoviesTotal: 0,
    ratedTvTotal: 0,
    ratedEpisodesTotal: 0,
    sortDirection: 'desc',
};

@Injectable()
export class UserRatingsStore extends ComponentStore<UserRatingsState> {
    readonly vm$ = this.select((state): UserRatingsVm => {
        const ratedMoviesMediaState = mapLoadableItems(
            state.ratedMoviesState,
            (item) => item.media,
        );
        const ratedTvMediaState = mapLoadableItems(
            state.ratedTvState,
            (item) => item.media,
        );
        const hasRatedMovies =
            state.ratedMoviesState.type === 'loaded' &&
            state.ratedMoviesState.value.length > 0;
        const hasRatedTv =
            state.ratedTvState.type === 'loaded' &&
            state.ratedTvState.value.length > 0;
        const hasRatedEpisodes =
            state.ratedEpisodesState.type === 'loaded' &&
            state.ratedEpisodesState.value.length > 0;

        return {
            ratedMoviesState: state.ratedMoviesState,
            ratedTvState: state.ratedTvState,
            ratedEpisodesState: state.ratedEpisodesState,
            ratedMoviesMediaState,
            ratedTvMediaState,
            ratedMoviesUserRatings: toUserRatingsMap(state.ratedMoviesState),
            ratedTvUserRatings: toUserRatingsMap(state.ratedTvState),
            hasRatedMovies,
            hasRatedTv,
            hasRatedEpisodes,
            hasRatings: hasRatedMovies || hasRatedTv || hasRatedEpisodes,
            ratedMoviesHasMore:
                state.ratedMoviesPage < state.ratedMoviesTotalPages,
            ratedTvHasMore: state.ratedTvPage < state.ratedTvTotalPages,
            ratedEpisodesHasMore:
                state.ratedEpisodesPage < state.ratedEpisodesTotalPages,
            ratingPreviewCards: combineLoadablePreviewItems(
                [
                    mapLoadableItems(
                        state.ratedMoviesState,
                        ratedItemToCardItem,
                    ),
                    mapLoadableItems(state.ratedTvState, ratedItemToCardItem),
                ],
                10,
            ),
            ratingsTotal:
                state.ratedMoviesTotal +
                state.ratedTvTotal +
                state.ratedEpisodesTotal,
            sortDirection: state.sortDirection,
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

    toggleSortDirection$(): Observable<void> {
        const currentDirection = this.get().sortDirection;
        const nextDirection: SortDirection =
            currentDirection === 'desc' ? 'asc' : 'desc';

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

    load$(
        sessionId: string,
        accountId: number,
        language: string,
    ): Observable<void> {
        this.patchState({
            ratedMoviesState: { type: 'loading' },
            ratedTvState: { type: 'loading' },
            ratedEpisodesState: { type: 'loading' },
        });

        return this.fetchRatings$(sessionId, accountId, language);
    }

    loadMoreRatedMovies$(): Observable<void> {
        const state = this.get();

        if (state.ratedMoviesState.type !== 'loaded') {
            return of(undefined);
        }

        return loadMorePaged$({
            currentItems: state.ratedMoviesState.value,
            currentPage: state.ratedMoviesPage,
            totalPages: state.ratedMoviesTotalPages,
            placeholderCount: PAGE_SIZE,
            setLoadingMore: (items) =>
                this.patchState({
                    ratedMoviesState: {
                        type: 'loading-more',
                        value: items,
                        placeholderCount: PAGE_SIZE,
                    } as LoadableItems<UserRatedMediaItem>,
                }),
            fetchPage: (nextPage) =>
                this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
                    switchMap(({ accountId }) =>
                        this.accountService.accountRatedMovies(
                            accountId,
                            this.localeStore.language(),
                            nextPage,
                            this.userSessionStore.sessionId()!,
                            this.apiSortBy,
                            'body',
                            false,
                            API_JSON_OPTIONS,
                        ),
                    ),
                    map((result) =>
                        (result.results ?? []).map((item) =>
                            toUserRatedMovie(item),
                        ),
                    ),
                ),
            setLoaded: (items, page) =>
                this.patchState({
                    ratedMoviesState: loaded(items),
                    ratedMoviesPage: page,
                }),
        });
    }

    loadMoreRatedTv$(): Observable<void> {
        const state = this.get();

        if (state.ratedTvState.type !== 'loaded') {
            return of(undefined);
        }

        return loadMorePaged$({
            currentItems: state.ratedTvState.value,
            currentPage: state.ratedTvPage,
            totalPages: state.ratedTvTotalPages,
            placeholderCount: PAGE_SIZE,
            setLoadingMore: (items) =>
                this.patchState({
                    ratedTvState: {
                        type: 'loading-more',
                        value: items,
                        placeholderCount: PAGE_SIZE,
                    } as LoadableItems<UserRatedMediaItem>,
                }),
            fetchPage: (nextPage) =>
                this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
                    switchMap(({ accountId }) =>
                        this.accountService.accountRatedTv(
                            accountId,
                            this.localeStore.language(),
                            nextPage,
                            this.userSessionStore.sessionId()!,
                            this.apiSortBy,
                            'body',
                            false,
                            API_JSON_OPTIONS,
                        ),
                    ),
                    map((result) =>
                        (result.results ?? []).map((item) =>
                            toUserRatedTv(item),
                        ),
                    ),
                ),
            setLoaded: (items, page) =>
                this.patchState({
                    ratedTvState: loaded(items),
                    ratedTvPage: page,
                }),
        });
    }

    loadMoreRatedEpisodes$(): Observable<void> {
        const state = this.get();

        if (state.ratedEpisodesState.type !== 'loaded') {
            return of(undefined);
        }

        return loadMorePaged$({
            currentItems: state.ratedEpisodesState.value,
            currentPage: state.ratedEpisodesPage,
            totalPages: state.ratedEpisodesTotalPages,
            placeholderCount: PAGE_SIZE,
            setLoadingMore: (items) =>
                this.patchState({
                    ratedEpisodesState: {
                        type: 'loading-more',
                        value: items,
                        placeholderCount: PAGE_SIZE,
                    } as LoadableItems<UserRatedEpisodeItem>,
                }),
            fetchPage: (nextPage) =>
                this.tmdbUserAccountService.ensureAccountIdentity$().pipe(
                    switchMap(({ accountId }) =>
                        this.accountService.accountRatedTvEpisodes(
                            accountId,
                            this.localeStore.language(),
                            nextPage,
                            this.userSessionStore.sessionId()!,
                            this.apiSortBy,
                            'body',
                            false,
                            API_JSON_OPTIONS,
                        ),
                    ),
                    map((result) =>
                        (result.results ?? []).map((item) =>
                            toUserRatedEpisode(item),
                        ),
                    ),
                ),
            setLoaded: (items, page) =>
                this.patchState({
                    ratedEpisodesState: loaded(items),
                    ratedEpisodesPage: page,
                }),
        });
    }

    updateRatedMediaRating$(
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
                            ratedMoviesState: updateLoadableItems(
                                state.ratedMoviesState,
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
                        }));
                        return;
                    }

                    this.patchState((state) => ({
                        ratedTvState: updateLoadableItems(
                            state.ratedTvState,
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
                    }));
                }),
                map(() => undefined),
            );
    }

    removeRatedMediaRating$(
        mediaId: number,
        mediaType: 'movie' | 'tv',
    ): Observable<void> {
        return this.mediaRatingService
            .deleteMediaRating$(mediaId, mediaType)
            .pipe(
                tap(() => {
                    if (mediaType === 'movie') {
                        this.patchState((state) => {
                            const nextTotalResults = Math.max(
                                0,
                                state.ratedMoviesTotal - 1,
                            );

                            return {
                                ratedMoviesState: updateLoadableItems(
                                    state.ratedMoviesState,
                                    (items) =>
                                        items.filter(
                                            (item) => item.media.id !== mediaId,
                                        ),
                                ),
                                ratedMoviesPage: Math.min(
                                    state.ratedMoviesPage,
                                    toPagedTotalPages(nextTotalResults),
                                ),
                                ratedMoviesTotalPages:
                                    toPagedTotalPages(nextTotalResults),
                                ratedMoviesTotal: nextTotalResults,
                            };
                        });
                        return;
                    }

                    this.patchState((state) => {
                        const nextTotalResults = Math.max(
                            0,
                            state.ratedTvTotal - 1,
                        );

                        return {
                            ratedTvState: updateLoadableItems(
                                state.ratedTvState,
                                (items) =>
                                    items.filter(
                                        (item) => item.media.id !== mediaId,
                                    ),
                            ),
                            ratedTvPage: Math.min(
                                state.ratedTvPage,
                                toPagedTotalPages(nextTotalResults),
                            ),
                            ratedTvTotalPages:
                                toPagedTotalPages(nextTotalResults),
                            ratedTvTotal: nextTotalResults,
                        };
                    });
                }),
                map(() => undefined),
            );
    }

    updateRatedEpisodeRating$(
        episodeId: number,
        showId: number | null,
        seasonNumber: number | null,
        episodeNumber: number | null,
        userRating: number,
    ): Observable<void> {
        const normalizedRating = normalizeRatingValue(userRating);

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
            .rateEpisode$(showId, seasonNumber, episodeNumber, normalizedRating)
            .pipe(
                tap(() => {
                    this.patchState((state) => ({
                        ratedEpisodesState: updateLoadableItems(
                            state.ratedEpisodesState,
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
                    }));
                }),
                map(() => undefined),
            );
    }

    removeRatedEpisodeRating$(
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
                        const nextTotalResults = Math.max(
                            0,
                            state.ratedEpisodesTotal - 1,
                        );

                        return {
                            ratedEpisodesState: updateLoadableItems(
                                state.ratedEpisodesState,
                                (items) =>
                                    items.filter(
                                        (item) => item.id !== episodeId,
                                    ),
                            ),
                            ratedEpisodesPage: Math.min(
                                state.ratedEpisodesPage,
                                toPagedTotalPages(nextTotalResults),
                            ),
                            ratedEpisodesTotalPages:
                                toPagedTotalPages(nextTotalResults),
                            ratedEpisodesTotal: nextTotalResults,
                        };
                    });
                }),
                map(() => undefined),
            );
    }

    private get apiSortBy(): ApiSortBy {
        return `created_at.${this.get().sortDirection}`;
    }

    private fetchRatings$(
        sessionId: string,
        accountId: number,
        language: string,
    ): Observable<void> {
        return forkJoin({
            ratedMovies: this.accountService.accountRatedMovies(
                accountId,
                language,
                1,
                sessionId,
                this.apiSortBy,
                'body',
                false,
                API_JSON_OPTIONS,
            ),
            ratedTv: this.accountService.accountRatedTv(
                accountId,
                language,
                1,
                sessionId,
                this.apiSortBy,
                'body',
                false,
                API_JSON_OPTIONS,
            ),
            ratedEpisodes: this.accountService.accountRatedTvEpisodes(
                accountId,
                language,
                1,
                sessionId,
                this.apiSortBy,
                'body',
                false,
                API_JSON_OPTIONS,
            ),
        }).pipe(
            tap((result) => {
                this.patchState({
                    ratedMoviesState: loaded(
                        (result.ratedMovies.results ?? []).map((item) =>
                            toUserRatedMovie(item),
                        ),
                    ),
                    ratedMoviesPage: result.ratedMovies.page ?? 1,
                    ratedMoviesTotalPages:
                        result.ratedMovies.total_pages ?? 1,
                    ratedMoviesTotal: result.ratedMovies.total_results ?? 0,
                    ratedTvState: loaded(
                        (result.ratedTv.results ?? []).map((item) =>
                            toUserRatedTv(item),
                        ),
                    ),
                    ratedTvPage: result.ratedTv.page ?? 1,
                    ratedTvTotalPages: result.ratedTv.total_pages ?? 1,
                    ratedTvTotal: result.ratedTv.total_results ?? 0,
                    ratedEpisodesState: loaded(
                        (result.ratedEpisodes.results ?? []).map((item) =>
                            toUserRatedEpisode(item),
                        ),
                    ),
                    ratedEpisodesPage: result.ratedEpisodes.page ?? 1,
                    ratedEpisodesTotalPages:
                        result.ratedEpisodes.total_pages ?? 1,
                    ratedEpisodesTotal:
                        result.ratedEpisodes.total_results ?? 0,
                });
            }),
            switchMap((result) =>
                this.resolveEpisodeShowNames$(
                    result.ratedEpisodes.results ?? [],
                    language,
                ),
            ),
            tap({
                error: () => {
                    this.patchState({
                        ratedMoviesState: loaded([]),
                        ratedTvState: loaded([]),
                        ratedEpisodesState: loaded([]),
                    });
                },
            }),
        );
    }

    private resolveEpisodeShowNames$(
        episodes: readonly RatedTvEpisodeListItem[],
        language: string,
    ): Observable<void> {
        const uniqueShowIds = [
            ...new Set(
                episodes
                    .map((ep) => ep.show_id)
                    .filter((id): id is number => id != null),
            ),
        ];

        if (uniqueShowIds.length === 0) {
            return of(undefined);
        }

        const showNameRequests = Object.fromEntries(
            uniqueShowIds.map((id) => [
                String(id),
                this.tvSeriesService
                    .tvSeriesDetails(id, undefined, language, 'body', false, API_JSON_OPTIONS)
                    .pipe(
                        map((series) => series.name?.trim() || null),
                        catchError(() => of(null as string | null)),
                    ),
            ]),
        );

        return forkJoin(showNameRequests).pipe(
            tap((showNames) => {
                this.patchState((state) => ({
                    ratedEpisodesState: updateLoadableItems(
                        state.ratedEpisodesState,
                        (items) =>
                            items.map((item) => {
                                const name =
                                    item.showId != null
                                        ? showNames[String(item.showId)] ?? null
                                        : null;
                                return name !== item.showName
                                    ? { ...item, showName: name }
                                    : item;
                            }),
                    ),
                }));
            }),
            map(() => undefined),
        );
    }
}
