import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { ComponentStore } from '@ngrx/component-store';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { catchError, EMPTY, forkJoin, map, Observable, of, tap } from 'rxjs';

import {
    DiscoverRestControllerService,
    Keyword,
    KeywordRestControllerService,
    MovieListItem,
    TvSeriesListItem,
} from '../../api';
import { loader, MediaListItem } from '../../shared';

export type KeywordSortDirection = 'asc' | 'desc';

export interface KeywordSortOption {
    label: string;
    value: string;
}

const MOVIE_SORT_OPTIONS: KeywordSortOption[] = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Rating', value: 'vote_average' },
    { label: 'Release Date', value: 'primary_release_date' },
    { label: 'Title', value: 'title' },
    { label: 'Revenue', value: 'revenue' },
];

const TV_SORT_OPTIONS: KeywordSortOption[] = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Rating', value: 'vote_average' },
    { label: 'First Air Date', value: 'first_air_date' },
    { label: 'Name', value: 'name' },
];

const DEFAULT_MOVIE_SORT_FIELD = 'popularity';
const DEFAULT_TV_SORT_FIELD = 'popularity';
const DEFAULT_SORT_DIRECTION: KeywordSortDirection = 'desc';

interface KeywordSectionState {
    results: MediaListItem[];
    page: number;
    totalPages: number;
    totalResults: number;
    sortField: string;
    sortDirection: KeywordSortDirection;
}

interface KeywordState {
    keywordId?: number;
    keyword?: Keyword;
    selectedType: 'movie' | 'tv';
    movies: KeywordSectionState;
    tv: KeywordSectionState;
}

const EMPTY_SECTION: KeywordSectionState = {
    results: [],
    page: 0,
    totalPages: 0,
    totalResults: 0,
    sortField: '',
    sortDirection: DEFAULT_SORT_DIRECTION,
};

const INITIAL_STATE: KeywordState = {
    selectedType: 'movie',
    movies: { ...EMPTY_SECTION, sortField: DEFAULT_MOVIE_SORT_FIELD },
    tv: { ...EMPTY_SECTION, sortField: DEFAULT_TV_SORT_FIELD },
};

@Injectable()
export class KeywordStoreService extends ComponentStore<KeywordState> {
    keyword$ = this.select((state) => state.keyword);
    selectedType$ = this.select((state) => state.selectedType);
    movies$ = this.select((state) => state.movies.results);
    tv$ = this.select((state) => state.tv.results);
    moviesTotalResults$ = this.select((state) => state.movies.totalResults);
    tvTotalResults$ = this.select((state) => state.tv.totalResults);
    moviesHasMore$ = this.select(
        (state) => state.movies.page < state.movies.totalPages,
    );
    tvHasMore$ = this.select((state) => state.tv.page < state.tv.totalPages);
    movieSortField$ = this.select((state) => state.movies.sortField);
    movieSortDirection$ = this.select((state) => state.movies.sortDirection);
    tvSortField$ = this.select((state) => state.tv.sortField);
    tvSortDirection$ = this.select((state) => state.tv.sortDirection);
    activeResults$ = this.select((state) =>
        state.selectedType === 'movie'
            ? state.movies.results
            : state.tv.results,
    );
    activeTotalResults$ = this.select((state) =>
        state.selectedType === 'movie'
            ? state.movies.totalResults
            : state.tv.totalResults,
    );
    activeHasMore$ = this.select((state) =>
        state.selectedType === 'movie'
            ? state.movies.page < state.movies.totalPages
            : state.tv.page < state.tv.totalPages,
    );
    activeSortField$ = this.select((state) =>
        state.selectedType === 'movie'
            ? state.movies.sortField
            : state.tv.sortField,
    );
    activeSortDirection$ = this.select((state) =>
        state.selectedType === 'movie'
            ? state.movies.sortDirection
            : state.tv.sortDirection,
    );
    activeSortOptions$ = this.select((state) =>
        state.selectedType === 'movie' ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS,
    );

    private readonly opts = { httpHeaderAccept: 'application/json' as const };
    readonly movieSortOptions = MOVIE_SORT_OPTIONS;
    readonly tvSortOptions = TV_SORT_OPTIONS;

    constructor(
        private keywordRestControllerService: KeywordRestControllerService,
        private discoverRestControllerService: DiscoverRestControllerService,
        private ngxUiLoaderService: NgxUiLoaderService,
        private router: Router,
    ) {
        super(INITIAL_STATE);
    }

    loadKeyword$(keywordId: number): Observable<void> {
        this.patchState({
            ...INITIAL_STATE,
            keywordId,
        });

        return forkJoin({
            keyword: this.keywordRestControllerService.keywordDetails(
                keywordId,
                undefined,
                undefined,
                this.opts,
            ),
            movies: this.fetchMoviesPage$(keywordId, 1).pipe(
                catchError(() => of(null)),
            ),
            tv: this.fetchTvPage$(keywordId, 1).pipe(
                catchError(() => of(null)),
            ),
        }).pipe(
            tap(({ keyword, movies, tv }) => {
                this.patchState({
                    keyword,
                    movies: {
                        results: (movies?.results ?? []).map((item) =>
                            this.mapMovieToListItem(item),
                        ),
                        page: movies?.page ?? 1,
                        totalPages: movies?.total_pages ?? 1,
                        totalResults: movies?.total_results ?? 0,
                        sortField: DEFAULT_MOVIE_SORT_FIELD,
                        sortDirection: DEFAULT_SORT_DIRECTION,
                    },
                    tv: {
                        results: (tv?.results ?? []).map((item) =>
                            this.mapTvToListItem(item),
                        ),
                        page: tv?.page ?? 1,
                        totalPages: tv?.total_pages ?? 1,
                        totalResults: tv?.total_results ?? 0,
                        sortField: DEFAULT_TV_SORT_FIELD,
                        sortDirection: DEFAULT_SORT_DIRECTION,
                    },
                });
            }),
            map(() => undefined),
            loader(this.ngxUiLoaderService),
            catchError(() => {
                this.router.navigate(['not-found']);
                return EMPTY;
            }),
        );
    }

    loadMoreMovies$(): Observable<void> {
        const { keywordId, movies } = this.get();
        if (!keywordId || movies.page >= movies.totalPages) {
            return of(undefined);
        }

        return this.fetchMoviesPage$(
            keywordId,
            movies.page + 1,
            movies.sortField,
            movies.sortDirection,
        ).pipe(
            tap((response) => {
                this.patchState({
                    movies: {
                        ...movies,
                        results: [
                            ...movies.results,
                            ...(response.results ?? []).map((item) =>
                                this.mapMovieToListItem(item),
                            ),
                        ],
                        page: response.page ?? movies.page + 1,
                        totalPages: response.total_pages ?? movies.totalPages,
                        totalResults:
                            response.total_results ?? movies.totalResults,
                    },
                });
            }),
            map(() => undefined),
            catchError(() => EMPTY),
        );
    }

    loadMoreTv$(): Observable<void> {
        const { keywordId, tv } = this.get();
        if (!keywordId || tv.page >= tv.totalPages) {
            return of(undefined);
        }

        return this.fetchTvPage$(
            keywordId,
            tv.page + 1,
            tv.sortField,
            tv.sortDirection,
        ).pipe(
            tap((response) => {
                this.patchState({
                    tv: {
                        ...tv,
                        results: [
                            ...tv.results,
                            ...(response.results ?? []).map((item) =>
                                this.mapTvToListItem(item),
                            ),
                        ],
                        page: response.page ?? tv.page + 1,
                        totalPages: response.total_pages ?? tv.totalPages,
                        totalResults: response.total_results ?? tv.totalResults,
                    },
                });
            }),
            map(() => undefined),
            catchError(() => EMPTY),
        );
    }

    setSelectedType(type: 'movie' | 'tv'): void {
        this.patchState({ selectedType: type });
    }

    loadMore$(): Observable<void> {
        return this.get().selectedType === 'movie'
            ? this.loadMoreMovies$()
            : this.loadMoreTv$();
    }

    updateMovieSort(sortField: string): Observable<void> {
        const { keywordId, movies } = this.get();
        if (!keywordId) return of(undefined);
        const normalizedSortField = this.normalizeMovieSortField(sortField);
        return this.reloadMovies$(
            keywordId,
            normalizedSortField,
            movies.sortDirection,
        );
    }

    toggleMovieSortDirection(): Observable<void> {
        const { keywordId, movies } = this.get();
        if (!keywordId) return of(undefined);
        const nextDirection: KeywordSortDirection =
            movies.sortDirection === 'desc' ? 'asc' : 'desc';
        return this.reloadMovies$(keywordId, movies.sortField, nextDirection);
    }

    updateTvSort(sortField: string): Observable<void> {
        const { keywordId, tv } = this.get();
        if (!keywordId) return of(undefined);
        const normalizedSortField = this.normalizeTvSortField(sortField);
        return this.reloadTv$(keywordId, normalizedSortField, tv.sortDirection);
    }

    toggleTvSortDirection(): Observable<void> {
        const { keywordId, tv } = this.get();
        if (!keywordId) return of(undefined);
        const nextDirection: KeywordSortDirection =
            tv.sortDirection === 'desc' ? 'asc' : 'desc';
        return this.reloadTv$(keywordId, tv.sortField, nextDirection);
    }

    updateSort(sortField: string): Observable<void> {
        return this.get().selectedType === 'movie'
            ? this.updateMovieSort(sortField)
            : this.updateTvSort(sortField);
    }

    toggleSortDirection(): Observable<void> {
        return this.get().selectedType === 'movie'
            ? this.toggleMovieSortDirection()
            : this.toggleTvSortDirection();
    }

    private fetchMoviesPage$(
        keywordId: number,
        page: number,
        sortField: string = DEFAULT_MOVIE_SORT_FIELD,
        sortDirection: KeywordSortDirection = DEFAULT_SORT_DIRECTION,
    ) {
        const sortBy = `${sortField}.${sortDirection}` as
            | 'original_title.asc'
            | 'original_title.desc'
            | 'popularity.asc'
            | 'popularity.desc'
            | 'revenue.asc'
            | 'revenue.desc'
            | 'primary_release_date.asc'
            | 'title.asc'
            | 'title.desc'
            | 'primary_release_date.desc'
            | 'vote_average.asc'
            | 'vote_average.desc'
            | 'vote_count.asc'
            | 'vote_count.desc';

        return this.discoverRestControllerService.discoverMovie(
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            undefined,
            undefined,
            page,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            sortBy,
            undefined,
            undefined,
            1,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            String(keywordId),
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
        );
    }

    private fetchTvPage$(
        keywordId: number,
        page: number,
        sortField: string = DEFAULT_TV_SORT_FIELD,
        sortDirection: KeywordSortDirection = DEFAULT_SORT_DIRECTION,
    ) {
        const sortBy = `${sortField}.${sortDirection}` as
            | 'first_air_date.asc'
            | 'first_air_date.desc'
            | 'name.asc'
            | 'name.desc'
            | 'original_name.asc'
            | 'original_name.desc'
            | 'popularity.asc'
            | 'popularity.desc'
            | 'vote_average.asc'
            | 'vote_average.desc'
            | 'vote_count.asc'
            | 'vote_count.desc';

        return this.discoverRestControllerService.discoverTv(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            undefined,
            undefined,
            page,
            undefined,
            sortBy,
            undefined,
            undefined,
            undefined,
            1,
            undefined,
            undefined,
            undefined,
            undefined,
            String(keywordId),
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
        );
    }

    private reloadMovies$(
        keywordId: number,
        sortField: string,
        sortDirection: KeywordSortDirection,
    ): Observable<void> {
        return this.fetchMoviesPage$(keywordId, 1, sortField, sortDirection).pipe(
            tap((response) => {
                this.patchState((state) => ({
                    movies: {
                        ...state.movies,
                        results: (response.results ?? []).map((item) =>
                            this.mapMovieToListItem(item),
                        ),
                        page: response.page ?? 1,
                        totalPages: response.total_pages ?? 1,
                        totalResults: response.total_results ?? 0,
                        sortField,
                        sortDirection,
                    },
                }));
            }),
            map(() => undefined),
            loader(this.ngxUiLoaderService),
            catchError(() => EMPTY),
        );
    }

    private reloadTv$(
        keywordId: number,
        sortField: string,
        sortDirection: KeywordSortDirection,
    ): Observable<void> {
        return this.fetchTvPage$(keywordId, 1, sortField, sortDirection).pipe(
            tap((response) => {
                this.patchState((state) => ({
                    tv: {
                        ...state.tv,
                        results: (response.results ?? []).map((item) =>
                            this.mapTvToListItem(item),
                        ),
                        page: response.page ?? 1,
                        totalPages: response.total_pages ?? 1,
                        totalResults: response.total_results ?? 0,
                        sortField,
                        sortDirection,
                    },
                }));
            }),
            map(() => undefined),
            loader(this.ngxUiLoaderService),
            catchError(() => EMPTY),
        );
    }

    private normalizeMovieSortField(sortField: string): string {
        if (MOVIE_SORT_OPTIONS.some((option) => option.value === sortField)) {
            return sortField;
        }
        return DEFAULT_MOVIE_SORT_FIELD;
    }

    private normalizeTvSortField(sortField: string): string {
        if (TV_SORT_OPTIONS.some((option) => option.value === sortField)) {
            return sortField;
        }
        return DEFAULT_TV_SORT_FIELD;
    }

    private mapMovieToListItem(item: MovieListItem): MediaListItem {
        return {
            id: item.id!,
            thumb: item.poster_path ?? null,
            title: item.title ?? '',
            overview: item.overview ?? '',
            rating: item.vote_average ?? null,
            date: (item.release_date ?? '').substring(0, 4),
            mediaType: 'movie',
            voteCount: item.vote_count ?? 0,
        };
    }

    private mapTvToListItem(item: TvSeriesListItem): MediaListItem {
        return {
            id: item.id!,
            thumb: item.poster_path ?? null,
            title: item.name ?? '',
            overview: item.overview ?? '',
            rating: item.vote_average ?? null,
            date: (item.first_air_date ?? '').substring(0, 4),
            mediaType: 'tv',
            voteCount: item.vote_count ?? 0,
        };
    }
}
