import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ComponentStore } from '@ngrx/component-store';
import { catchError, EMPTY, forkJoin, map, Observable, of, tap } from 'rxjs';

import { SearchRestControllerService } from '../../api';
import { API_JSON_OPTIONS, PAGE_SIZE, SMALL_LIST_COUNT } from '../../constants';
import {
    LoadableItems,
    MediaListItem,
    MediaOrPersonFilterType,
    PersonListItem,
    toMediaListItem,
    toPersonListItem,
} from '../../shared';

export type SearchType = MediaOrPersonFilterType;

interface SectionState<T> {
    results: T[];
    page: number;
    totalPages: number;
    visible: number;
}

interface SearchState {
    query: string;
    type: SearchType;
    movies: SectionState<MediaListItem>;
    tv: SectionState<MediaListItem>;
    people: SectionState<PersonListItem>;
    movieResultsState: LoadableItems<MediaListItem>;
    tvResultsState: LoadableItems<MediaListItem>;
    personResultsState: LoadableItems<PersonListItem>;
}

const EMPTY_SECTION: SectionState<never> = {
    results: [],
    page: 0,
    totalPages: 0,
    visible: 0,
};

const INITIAL_STATE: SearchState = {
    query: '',
    type: 'all',
    movies: { ...EMPTY_SECTION, results: [] },
    tv: { ...EMPTY_SECTION, results: [] },
    people: { ...EMPTY_SECTION, results: [] },
    movieResultsState: { type: 'idle' },
    tvResultsState: { type: 'idle' },
    personResultsState: { type: 'idle' },
};

@Injectable()
export class SearchStoreService extends ComponentStore<SearchState> {
    readonly query$ = this.select((state) => state.query);
    readonly type$ = this.select((state) => state.type);

    readonly movieResultsState$ = this.select((state) => state.movieResultsState);
    readonly tvResultsState$ = this.select((state) => state.tvResultsState);
    readonly personResultsState$ = this.select((state) => state.personResultsState);

    readonly movieHasMore$ = this.select(
        (state) =>
            state.movies.visible < state.movies.results.length ||
            state.movies.page < state.movies.totalPages,
    );
    readonly tvHasMore$ = this.select(
        (state) =>
            state.tv.visible < state.tv.results.length ||
            state.tv.page < state.tv.totalPages,
    );
    readonly personHasMore$ = this.select(
        (state) =>
            state.people.visible < state.people.results.length ||
            state.people.page < state.people.totalPages,
    );

    readonly noSearchResults$ = this.select(
        (state) =>
            state.query !== '' &&
            state.movieResultsState.type === 'loaded' &&
            state.tvResultsState.type === 'loaded' &&
            state.personResultsState.type === 'loaded' &&
            state.movies.results.length === 0 &&
            state.tv.results.length === 0 &&
            state.people.results.length === 0,
    );

    constructor(
        private readonly searchService: SearchRestControllerService,
        private readonly router: Router,
        private readonly activatedRoute: ActivatedRoute,
    ) {
        super(INITIAL_STATE);
    }

    search$(query: string, type: SearchType): Observable<void> {
        if (!query) {
            this.patchState({
                ...INITIAL_STATE,
                query,
                type,
                movieResultsState: { type: 'loaded', value: [] },
                tvResultsState: { type: 'loaded', value: [] },
                personResultsState: { type: 'loaded', value: [] },
            });
            return of(undefined);
        }

        this.patchState({
            ...INITIAL_STATE,
            query,
            type,
            movieResultsState:
                type === 'movie' || type === 'all'
                    ? { type: 'loading' }
                    : { type: 'loaded', value: [] },
            tvResultsState:
                type === 'tv' || type === 'all'
                    ? { type: 'loading' }
                    : { type: 'loaded', value: [] },
            personResultsState:
                type === 'person' || type === 'all'
                    ? { type: 'loading' }
                    : { type: 'loaded', value: [] },
        });

        const initialVisible = type === 'all' ? SMALL_LIST_COUNT : PAGE_SIZE;

        if (type === 'movie') {
            return this.fetchMovies$(query, 1, initialVisible);
        }

        if (type === 'tv') {
            return this.fetchTv$(query, 1, initialVisible);
        }

        if (type === 'person') {
            return this.fetchPeople$(query, 1, initialVisible);
        }

        return forkJoin([
            this.fetchMovies$(query, 1, initialVisible),
            this.fetchTv$(query, 1, initialVisible),
            this.fetchPeople$(query, 1, initialVisible),
        ]).pipe(map(() => undefined));
    }

    loadMoreMovies$(): Observable<void> {
        const { movies, query } = this.get();
        if (!query) {
            return of(undefined);
        }

        if (movies.visible < movies.results.length) {
            const nextMovies = { ...movies, visible: movies.results.length };
            this.patchState({
                movies: nextMovies,
                movieResultsState: {
                    type: 'loaded',
                    value: nextMovies.results.slice(0, nextMovies.visible),
                },
            });
            return of(undefined);
        }

        this.patchState({
            movieResultsState: {
                type: 'loading-more',
                value: movies.results.slice(0, movies.visible),
                placeholderCount: PAGE_SIZE,
            },
        });

        return this.fetchMovies$(query, movies.page + 1, movies.results.length + PAGE_SIZE);
    }

    loadMoreTv$(): Observable<void> {
        const { tv, query } = this.get();
        if (!query) {
            return of(undefined);
        }

        if (tv.visible < tv.results.length) {
            const nextTv = { ...tv, visible: tv.results.length };
            this.patchState({
                tv: nextTv,
                tvResultsState: {
                    type: 'loaded',
                    value: nextTv.results.slice(0, nextTv.visible),
                },
            });
            return of(undefined);
        }

        this.patchState({
            tvResultsState: {
                type: 'loading-more',
                value: tv.results.slice(0, tv.visible),
                placeholderCount: PAGE_SIZE,
            },
        });

        return this.fetchTv$(query, tv.page + 1, tv.results.length + PAGE_SIZE);
    }

    loadMorePeople$(): Observable<void> {
        const { people, query } = this.get();
        if (!query) {
            return of(undefined);
        }

        if (people.visible < people.results.length) {
            const nextPeople = { ...people, visible: people.results.length };
            this.patchState({
                people: nextPeople,
                personResultsState: {
                    type: 'loaded',
                    value: nextPeople.results.slice(0, nextPeople.visible),
                },
            });
            return of(undefined);
        }

        this.patchState({
            personResultsState: {
                type: 'loading-more',
                value: people.results.slice(0, people.visible),
                placeholderCount: PAGE_SIZE,
            },
        });

        return this.fetchPeople$(query, people.page + 1, people.results.length + PAGE_SIZE);
    }

    updateType(type: SearchType): void {
        const query = this.get().query.trim();
        const queryParams: Record<string, string> = {};

        if (query) {
            queryParams['query'] = query;
        }

        if (type !== 'all') {
            queryParams['type'] = type;
        }

        this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams,
        });
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
                API_JSON_OPTIONS,
            )
            .pipe(
                tap((result) => {
                    const mapped = (result.results ?? []).map((item) =>
                        toMediaListItem(item, 'movie', 'year'),
                    );
                    const current = this.get().movies;
                    const nextMovies: SectionState<MediaListItem> = {
                        results: [...current.results, ...mapped],
                        page: result.page ?? page,
                        totalPages: result.total_pages ?? 0,
                        visible,
                    };
                    this.patchState({
                        movies: nextMovies,
                        movieResultsState: {
                            type: 'loaded',
                            value: nextMovies.results.slice(0, nextMovies.visible),
                        },
                    });
                }),
                map(() => undefined),
                catchError(() => {
                    const currentState = this.get().movieResultsState;
                    this.patchState({
                        movieResultsState: {
                            type: 'loaded',
                            value:
                                currentState.type === 'loading-more'
                                    ? currentState.value
                                    : [],
                        },
                    });
                    return EMPTY;
                }),
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
                API_JSON_OPTIONS,
            )
            .pipe(
                tap((result) => {
                    const mapped = (result.results ?? []).map((item) =>
                        toMediaListItem(item, 'tv', 'year'),
                    );
                    const current = this.get().tv;
                    const nextTv: SectionState<MediaListItem> = {
                        results: [...current.results, ...mapped],
                        page: result.page ?? page,
                        totalPages: result.total_pages ?? 0,
                        visible,
                    };
                    this.patchState({
                        tv: nextTv,
                        tvResultsState: {
                            type: 'loaded',
                            value: nextTv.results.slice(0, nextTv.visible),
                        },
                    });
                }),
                map(() => undefined),
                catchError(() => {
                    const currentState = this.get().tvResultsState;
                    this.patchState({
                        tvResultsState: {
                            type: 'loaded',
                            value:
                                currentState.type === 'loading-more'
                                    ? currentState.value
                                    : [],
                        },
                    });
                    return EMPTY;
                }),
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
                API_JSON_OPTIONS,
            )
            .pipe(
                tap((result) => {
                    const mapped = (result.results ?? []).map((item) =>
                        toPersonListItem(item),
                    );
                    const current = this.get().people;
                    const nextPeople: SectionState<PersonListItem> = {
                        results: [...current.results, ...mapped],
                        page: result.page ?? page,
                        totalPages: result.total_pages ?? 0,
                        visible,
                    };
                    this.patchState({
                        people: nextPeople,
                        personResultsState: {
                            type: 'loaded',
                            value: nextPeople.results.slice(0, nextPeople.visible),
                        },
                    });
                }),
                map(() => undefined),
                catchError(() => {
                    const currentState = this.get().personResultsState;
                    this.patchState({
                        personResultsState: {
                            type: 'loaded',
                            value:
                                currentState.type === 'loading-more'
                                    ? currentState.value
                                    : [],
                        },
                    });
                    return EMPTY;
                }),
            );
    }
}
