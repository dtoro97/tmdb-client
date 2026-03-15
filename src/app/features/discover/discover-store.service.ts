import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { ComponentStore } from '@ngrx/component-store';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { catchError, EMPTY, forkJoin, map, Observable, of, tap } from 'rxjs';

import {
    DiscoverRestControllerService,
    PersonListItem,
    PersonListRestControllerService,
    SearchRestControllerService,
} from '../../api';
import { getISODate, loader } from '../../shared';

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
    popular_movie: {
        label: 'Movies',
        title: 'Popular Movies',
        subtitle: 'Movies ordered by popularity',
        defaultSortField: 'popularity',
        defaultSortDirection: 'desc',
    },
    top_rated_movie: {
        label: 'Movies',
        title: 'Top Rated Movies',
        subtitle: 'Movies ordered by rating',
        defaultSortField: 'vote_average',
        defaultSortDirection: 'desc',
        voteCountGte: 300,
    },
    upcoming_movie: {
        label: 'Movies',
        title: 'Upcoming Movies',
        subtitle: 'Movies that are being released soon',
        defaultSortField: 'popularity',
        defaultSortDirection: 'desc',
        dateFn: () => ({ gte: getISODate(0), lte: getISODate(60) }),
    },
    now_playing_movie: {
        label: 'Movies',
        title: 'Now Playing Movies',
        subtitle: 'Movies that are currently in theatres',
        defaultSortField: 'popularity',
        defaultSortDirection: 'desc',
        dateFn: () => ({ gte: getISODate(-30), lte: getISODate(7) }),
    },
    popular_tv: {
        label: 'TV Shows',
        title: 'Popular TV Shows',
        subtitle: 'TV shows ordered by popularity',
        defaultSortField: 'popularity',
        defaultSortDirection: 'desc',
    },
    top_rated_tv: {
        label: 'TV Shows',
        title: 'Top Rated TV Shows',
        subtitle: 'TV shows ordered by rating',
        defaultSortField: 'vote_average',
        defaultSortDirection: 'desc',
        voteCountGte: 300,
    },
    airing_today_tv: {
        label: 'TV Shows',
        title: 'TV Shows Airing Today',
        subtitle: 'TV shows that are airing today',
        defaultSortField: 'popularity',
        defaultSortDirection: 'desc',
        dateFn: () => ({ gte: getISODate(0), lte: getISODate(0) }),
    },
    on_the_air_tv: {
        label: 'TV Shows',
        title: 'TV Shows On The Air',
        subtitle: 'TV shows that are currently on the air',
        defaultSortField: 'popularity',
        defaultSortDirection: 'desc',
        dateFn: () => ({ gte: getISODate(0), lte: getISODate(7) }),
    },
    popular_person: {
        label: 'People',
        title: 'Popular People',
        subtitle: 'People ordered by popularity',
        defaultSortField: '',
        defaultSortDirection: 'desc',
    },
};
export type BrowseCategory =
    | 'popular'
    | 'top_rated'
    | 'upcoming'
    | 'now_playing'
    | 'airing_today'
    | 'on_the_air';
export type BrowseMediaType = 'movie' | 'tv' | 'person';

export interface CategoryConfig {
    label: string;
    title: string;
    subtitle: string;
    defaultSortField: string;
    defaultSortDirection: SortDirection;
    voteCountGte?: number;
    dateFn?: () => { gte?: string; lte?: string };
}

export interface SortOption {
    label: string;
    value: string;
}

export type SortDirection = 'asc' | 'desc';

export const MOVIE_SORT_OPTIONS: SortOption[] = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Rating', value: 'vote_average' },
    { label: 'Release Date', value: 'primary_release_date' },
    { label: 'Title', value: 'title' },
    { label: 'Revenue', value: 'revenue' },
];

export const TV_SORT_OPTIONS: SortOption[] = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Rating', value: 'vote_average' },
    { label: 'First Air Date', value: 'first_air_date' },
    { label: 'Name', value: 'name' },
];
export type DiscoverType = 'all' | 'movie' | 'tv' | 'person';

export interface KnownForLink {
    id: number;
    title: string;
    mediaType: string;
}

export interface DiscoverResult {
    id: number;
    thumb: string | null;
    title: string;
    date: string;
    mediaType: string;
    overview: string;
    rating: number | null;
    department: string;
    knownForLinks: KnownForLink[];
    voteCount?: number;
}

interface SectionState {
    results: DiscoverResult[];
    page: number;
    totalPages: number;
    visible: number;
}

const EMPTY_SECTION: SectionState = {
    results: [],
    page: 0,
    totalPages: 0,
    visible: 0,
};
const PREVIEW_COUNT = 5;
const PAGE_SIZE = 20;

interface DiscoverState {
    query: string;
    type: DiscoverType;
    category: BrowseCategory | null;
    browseType: BrowseMediaType | null;
    keywordIds: string[];
    sortField: string | null;
    sortDirection: SortDirection;
    totalResults: number;
    movies: SectionState;
    tv: SectionState;
    people: SectionState;
}

const INITIAL_STATE: DiscoverState = {
    query: '',
    type: 'all',
    category: null,
    browseType: null,
    keywordIds: [],
    sortField: null,
    sortDirection: 'desc',
    totalResults: 0,
    movies: { ...EMPTY_SECTION },
    tv: { ...EMPTY_SECTION },
    people: { ...EMPTY_SECTION },
};

@Injectable()
export class DiscoverStoreService extends ComponentStore<DiscoverState> {
    query$ = this.select((state) => state.query);
    type$ = this.select((state) => state.type);
    movieResults$ = this.select((state) =>
        state.movies.results.slice(0, state.movies.visible),
    );
    movieHasMore$ = this.select(
        (state) =>
            state.movies.visible < state.movies.results.length ||
            state.movies.page < state.movies.totalPages,
    );
    tvResults$ = this.select((state) =>
        state.tv.results.slice(0, state.tv.visible),
    );
    tvHasMore$ = this.select(
        (state) =>
            state.tv.visible < state.tv.results.length ||
            state.tv.page < state.tv.totalPages,
    );
    personResults$ = this.select((state) =>
        state.people.results.slice(0, state.people.visible),
    );
    personHasMore$ = this.select(
        (state) =>
            state.people.visible < state.people.results.length ||
            state.people.page < state.people.totalPages,
    );

    noSearchResults$ = this.select(
        (state) =>
            state.query !== '' &&
            state.movies.results.length === 0 &&
            state.tv.results.length === 0 &&
            state.people.results.length === 0,
    );

    sortField$ = this.select((state) => state.sortField);
    sortDirection$ = this.select((state) => state.sortDirection);
    totalResults$ = this.select((state) => state.totalResults);
    browsingPeople$ = this.select((state) => state.browseType === 'person');

    categoryConfig$ = this.select((state) => {
        if (!state.category || !state.browseType) return null;
        return CATEGORY_CONFIG[`${state.category}_${state.browseType}`] ?? null;
    });

    browseResults$ = this.select((state) => {
        if (!state.browseType) return [];
        const section =
            state.browseType === 'movie'
                ? state.movies
                : state.browseType === 'person'
                  ? state.people
                  : state.tv;
        return section.results.slice(0, section.visible);
    });

    browseHasMore$ = this.select((state) => {
        if (!state.browseType) return false;
        const section =
            state.browseType === 'movie'
                ? state.movies
                : state.browseType === 'person'
                  ? state.people
                  : state.tv;
        return (
            section.visible < section.results.length ||
            section.page < section.totalPages
        );
    });

    sortOptions$ = this.select((state) => {
        if (state.browseType === 'tv') return TV_SORT_OPTIONS;
        return MOVIE_SORT_OPTIONS;
    });

    browseStartIndex$ = this.select((state) => {
        if (state.sortDirection === 'asc') {
            return state.totalResults;
        }
        return 1;
    });

    private opts = { httpHeaderAccept: 'application/json' as const };

    constructor(
        private searchService: SearchRestControllerService,
        private personListRestControllerService: PersonListRestControllerService,
        private discoverService: DiscoverRestControllerService,
        private ngxUiLoaderService: NgxUiLoaderService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
    ) {
        super(INITIAL_STATE);
    }

    updateType(type: DiscoverType) {
        const current = this.get().type;
        const newType = current === type ? 'all' : type;
        const query = this.get().query;
        const queryParams: Record<string, string> = { query };
        if (newType !== 'all') {
            queryParams['type'] = newType;
        }
        this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams,
        });
    }

    search$(query: string, type: DiscoverType): Observable<void> {
        this.patchState({
            ...INITIAL_STATE,
            query,
            type,
        });

        if (!query) {
            this.router.navigate(['/discover'], {
                queryParams: { category: 'popular', type: 'movie' },
                replaceUrl: true,
            });
            return EMPTY;
        }

        const initialVisible = type === 'all' ? PREVIEW_COUNT : PAGE_SIZE;

        if (type === 'movie') {
            return this.fetchMovies$(query, 1, initialVisible).pipe(
                loader(this.ngxUiLoaderService),
            );
        }

        if (type === 'tv') {
            return this.fetchTv$(query, 1, initialVisible).pipe(
                loader(this.ngxUiLoaderService),
            );
        }

        if (type === 'person') {
            return this.fetchPeople$(query, 1, initialVisible).pipe(
                loader(this.ngxUiLoaderService),
            );
        }

        return forkJoin([
            this.fetchMovies$(query, 1, initialVisible),
            this.fetchTv$(query, 1, initialVisible),
            this.fetchPeople$(query, 1, initialVisible),
        ]).pipe(
            map(() => undefined),
            loader(this.ngxUiLoaderService),
        );
    }

    browse$(
        category: BrowseCategory,
        mediaType: BrowseMediaType,
        sortField?: string,
        sortDirection?: SortDirection,
        keywordIds: string[] = [],
    ): Observable<void> {
        const configKey = `${category}_${mediaType}`;
        const config = CATEGORY_CONFIG[configKey];
        if (!config) {
            this.router.navigate(['/discover'], {
                queryParams: { category: 'popular', type: 'movie' },
                replaceUrl: true,
            });
            return EMPTY;
        }

        const field = sortField || config.defaultSortField;
        const direction = sortDirection || config.defaultSortDirection;
        const sortBy = `${field}.${direction}`;

        this.patchState({
            ...INITIAL_STATE,
            category,
            browseType: mediaType,
            keywordIds,
            sortField: field,
            sortDirection: direction,
        });

        return this.fetchBrowse$(
            mediaType,
            sortBy,
            1,
            PAGE_SIZE,
            config,
            keywordIds,
        ).pipe(
            loader(this.ngxUiLoaderService),
        );
    }

    updateSort(sortField: string) {
        const { category, browseType, sortDirection, keywordIds } = this.get();
        if (!category || !browseType) return;
        this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: {
                category,
                type: browseType,
                sortField,
                sortDirection,
                ...(keywordIds.length ? { keywords: keywordIds.join(',') } : {}),
            },
        });
    }

    loadMoreMovies$(): Observable<void> {
        const { movies } = this.get();
        if (movies.visible < movies.results.length) {
            this.patchState({
                movies: { ...movies, visible: movies.results.length },
            });
            return of(undefined);
        }
        return this.fetchMovies$(
            this.get().query,
            movies.page + 1,
            movies.results.length + PAGE_SIZE,
        );
    }

    toggleSortDirection() {
        const { category, browseType, sortField, sortDirection, keywordIds } =
            this.get();
        if (!category || !browseType || !sortField) return;
        const newDirection: SortDirection =
            sortDirection === 'desc' ? 'asc' : 'desc';
        this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: {
                category,
                type: browseType,
                sortField,
                sortDirection: newDirection,
                ...(keywordIds.length ? { keywords: keywordIds.join(',') } : {}),
            },
        });
    }

    loadMoreBrowse$(): Observable<void> {
        const { browseType, category, sortField, sortDirection, keywordIds } =
            this.get();
        if (!browseType || !category) return EMPTY;

        const section =
            browseType === 'movie'
                ? this.get().movies
                : browseType === 'person'
                  ? this.get().people
                  : this.get().tv;
        const config = CATEGORY_CONFIG[`${category}_${browseType}`];
        if (!config) {
            this.router.navigate(['/']);
            return EMPTY;
        }

        if (section.visible < section.results.length) {
            const key =
                browseType === 'movie'
                    ? 'movies'
                    : browseType === 'person'
                      ? 'people'
                      : 'tv';
            this.patchState({
                [key]: { ...section, visible: section.results.length },
            });
            return of(undefined);
        }
        const sortBy = `${sortField || config.defaultSortField}.${sortDirection}`;
        return this.fetchBrowse$(
            browseType,
            sortBy,
            section.page + 1,
            section.results.length + PAGE_SIZE,
            config,
            keywordIds,
        );
    }

    loadMoreTv$(): Observable<void> {
        const { tv } = this.get();
        if (tv.visible < tv.results.length) {
            this.patchState({ tv: { ...tv, visible: tv.results.length } });
            return of(undefined);
        }
        return this.fetchTv$(
            this.get().query,
            tv.page + 1,
            tv.results.length + PAGE_SIZE,
        );
    }

    loadMorePeople$(): Observable<void> {
        const { people } = this.get();
        if (people.visible < people.results.length) {
            this.patchState({
                people: { ...people, visible: people.results.length },
            });
            return of(undefined);
        }
        return this.fetchPeople$(
            this.get().query,
            people.page + 1,
            people.results.length + PAGE_SIZE,
        );
    }

    private fetchBrowse$(
        mediaType: BrowseMediaType,
        sortBy: string,
        page: number,
        visible: number,
        config: CategoryConfig,
        keywordIds: string[] = [],
    ): Observable<void> {
        const dates = config.dateFn ? config.dateFn() : {};
        const keywordFilter = keywordIds.length ? keywordIds.join(',') : undefined;

        if (mediaType === 'movie') {
            return this.discoverService
                .discoverMovie(
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    false,
                    undefined,
                    undefined,
                    page,
                    undefined,
                    dates.gte,
                    dates.lte,
                    undefined,
                    undefined,
                    undefined,
                    sortBy as 'popularity.desc',
                    undefined,
                    undefined,
                    config.voteCountGte ?? 1,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    keywordFilter,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    this.opts,
                )
                .pipe(
                    tap((result) => {
                        const mapped: DiscoverResult[] = (
                            result.results ?? []
                        ).map((m) => this.mapMovieToDiscoverResult(m, true));
                        const current = this.get().movies;
                        this.patchState({
                            totalResults: result.total_results ?? 0,
                            movies: {
                                results: [...current.results, ...mapped],
                                page: result.page ?? page,
                                totalPages: result.total_pages ?? 0,
                                visible,
                            },
                        });
                    }),
                    map(() => undefined),
                    catchError(() => EMPTY),
                );
        } else if (mediaType === 'tv') {
            return this.discoverService
                .discoverTv(
                    undefined,
                    undefined,
                    undefined,
                    dates.gte,
                    dates.lte,
                    false,
                    undefined,
                    undefined,
                    page,
                    undefined,
                    sortBy as 'popularity.desc',
                    undefined,
                    undefined,
                    undefined,
                    config.voteCountGte ?? 1,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    keywordFilter,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    this.opts,
                )
                .pipe(
                    tap((result) => {
                        const mapped: DiscoverResult[] = (
                            result.results ?? []
                        ).map((s) => this.mapTvToDiscoverResult(s, true));
                        const current = this.get().tv;
                        this.patchState({
                            totalResults: result.total_results ?? 0,
                            tv: {
                                results: [...current.results, ...mapped],
                                page: result.page ?? page,
                                totalPages: result.total_pages ?? 0,
                                visible,
                            },
                        });
                    }),
                    map(() => undefined),
                    catchError(() => EMPTY),
                );
        } else if (mediaType === 'person') {
            return this.personListRestControllerService
                .personPopularList(
                    undefined,
                    page,
                    undefined,
                    undefined,
                    this.opts,
                )
                .pipe(
                    tap((result) => {
                        const mapped = (result.results ?? []).map((p) =>
                            this.mapPersonToVMItem(p),
                        );
                        const current = this.get().people;
                        this.patchState({
                            totalResults: result.total_results ?? 0,
                            people: {
                                results: [...current.results, ...mapped],
                                page: result.page ?? page,
                                totalPages: result.total_pages ?? 0,
                                visible,
                            },
                        });
                    }),
                    map(() => undefined),
                    catchError(() => EMPTY),
                );
        }
        this.router.navigate(['/']);
        return EMPTY;
    }

    private fetchMovies$(
        query: string,
        page: number,
        visible: number,
    ): Observable<void> {
        return this.searchService
            .searchMovie(
                query,
                undefined,
                undefined,
                undefined,
                page,
                undefined,
                undefined,
                undefined,
                undefined,
                this.opts,
            )
            .pipe(
                tap((result) => {
                    const mapped = (result.results ?? []).map((m) =>
                        this.mapMovieToDiscoverResult(m),
                    );
                    const current = this.get().movies;
                    this.patchState({
                        movies: {
                            results: [...current.results, ...mapped],
                            page: result.page ?? page,
                            totalPages: result.total_pages ?? 0,
                            visible,
                        },
                    });
                }),
                map(() => undefined),
                catchError(() => EMPTY),
            );
    }

    private fetchTv$(
        query: string,
        page: number,
        visible: number,
    ): Observable<void> {
        return this.searchService
            .searchTv(
                query,
                undefined,
                undefined,
                undefined,
                page,
                undefined,
                undefined,
                undefined,
                this.opts,
            )
            .pipe(
                tap((result) => {
                    const mapped = (result.results ?? []).map((s) =>
                        this.mapTvToDiscoverResult(s),
                    );
                    const current = this.get().tv;
                    this.patchState({
                        tv: {
                            results: [...current.results, ...mapped],
                            page: result.page ?? page,
                            totalPages: result.total_pages ?? 0,
                            visible,
                        },
                    });
                }),
                map(() => undefined),
                catchError(() => EMPTY),
            );
    }

    private fetchPeople$(
        query: string,
        page: number,
        visible: number,
    ): Observable<void> {
        return this.searchService
            .searchPerson(
                query,
                undefined,
                undefined,
                page,
                undefined,
                undefined,
                this.opts,
            )
            .pipe(
                tap((result) => {
                    const mapped = (result.results ?? []).map((p) =>
                        this.mapPersonToVMItem(p),
                    );
                    const current = this.get().people;
                    this.patchState({
                        people: {
                            results: [...current.results, ...mapped],
                            page: result.page ?? page,
                            totalPages: result.total_pages ?? 0,
                            visible,
                        },
                    });
                }),
                map(() => undefined),
                catchError(() => EMPTY),
            );
    }

    private mapPersonToVMItem(person: PersonListItem) {
        return {
            id: person.id!,
            thumb:
                ((person as Record<string, unknown>)[
                    'profile_path'
                ] as string) || null,
            title: person.name || '',
            date: '',
            mediaType: 'person',
            overview: '',
            rating: null,
            department:
                ((person as Record<string, unknown>)[
                    'known_for_department'
                ] as string) || '',
            knownForLinks: (person.known_for ?? [])
                .filter((i) => i.id && (i.title || i.name))
                .map((i) => ({
                    id: i.id!,
                    title: i.title || i.name || '',
                    mediaType: i.media_type || 'movie',
                })),
        };
    }

    private mapMovieToDiscoverResult(
        movie: {
            id?: number | null;
            poster_path?: string | null;
            title?: string | null;
            release_date?: string | null;
            overview?: string | null;
            vote_average?: number | null;
            vote_count?: number | null;
        },
        includeVoteCount = false,
    ): DiscoverResult {
        const item: DiscoverResult = {
            id: movie.id!,
            thumb: movie.poster_path || null,
            title: movie.title || '',
            date: (movie.release_date || '').substring(0, 4),
            mediaType: 'movie',
            overview: movie.overview || '',
            rating: movie.vote_average ?? null,
            department: '',
            knownForLinks: [],
        };

        if (includeVoteCount) {
            item.voteCount = movie.vote_count ?? 0;
        }

        return item;
    }

    private mapTvToDiscoverResult(
        tv: {
            id?: number | null;
            poster_path?: string | null;
            name?: string | null;
            first_air_date?: string | null;
            overview?: string | null;
            vote_average?: number | null;
            vote_count?: number | null;
        },
        includeVoteCount = false,
    ): DiscoverResult {
        const item: DiscoverResult = {
            id: tv.id!,
            thumb: tv.poster_path || null,
            title: tv.name || '',
            date: tv.first_air_date?.substring(0, 4) ?? '',
            mediaType: 'tv',
            overview: tv.overview || '',
            rating: tv.vote_average ?? null,
            department: '',
            knownForLinks: [],
        };

        if (includeVoteCount) {
            item.voteCount = tv.vote_count ?? 0;
        }

        return item;
    }
}
